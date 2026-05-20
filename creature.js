//Per-element mutation probabilities during reproduction. The brain has many
//more weights than the creature has traits, so the per-element rates are tuned
//so the *category-level* probability ("at least one weight mutates" vs
//"at least one trait mutates") is roughly equal.
//With the current brain shape (152 weights) and 5 traits:
//  P(any brain weight mutates) ~= 1 - (1 - 0.0005)^152 ~= 7.3%
//  P(any trait mutates)        ~= 1 - (1 - 0.018)^5   ~= 8.7%
const BRAIN_MUTATION_RATE = 0.0005;
const TRAIT_MUTATION_RATE = 0.018;

//With probability TRAIT_MUTATION_RATE, add uniform jitter in [-sigma, +sigma]
//and clamp to [min, max]; otherwise return value unchanged. Returns
//{value, mutated} so callers can detect whether the mutation actually fired.
function maybeMutate(value, sigma, min, max) {
    if (Math.random() < TRAIT_MUTATION_RATE) {
        const jitter = (Math.random() - 0.5) * 2 * sigma;
        return {
            value: Math.max(min, Math.min(max, value + jitter)),
            mutated: true
        };
    }
    return { value: value, mutated: false };
}

//Represents a single creature wondering in the world
class Creature {
    //x and y refers to an absolute location
    constructor(x, y, direction, radius, brain) {
        //Physics
        this.location = { x: x, y: y };
        this.velocity = { x: 0, y: 0 };
        //Speed bounds the brain's speed output is mapped into. minSpeed = 0
        //means the brain can stop the creature completely.
        this.minSpeed = 0;
        this.maxSpeed = 1.0;
        this.velocityMagnitude = (this.minSpeed + this.maxSpeed) / 2;
        this.radius = radius;
        this.direction = direction; //0 - 2*PI

        //Energy
        this.maxEnergy = 100;
        this.minEnergy = 0;
        this.energy = this.maxEnergy / 2;
        
        this.energyConsumptionPerSpeed = 0.02;
        this.energyConsumptionBase = this.energyConsumptionPerSpeed / 10;
        //Extra energy drained per step while standing on a water tile.
        this.waterDrain = 0.2;
        //Energy threshold at which the creature reproduces; on reproduction
        //the parent loses half its energy and the child starts with the
        //parent's remaining (post-split) energy. Randomized for initial
        //creatures; children inherit the parent's value (see reproduce()).
        //Range 50-95.
        this.reproductionEnergy = Math.random() * 45 + 50;

        //Body color. Randomized for initial creatures; children inherit the
        //parent's color (per channel mutation possible, see reproduce()).
        this.color = {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        };

        //Vision. Three sight spots: left, center, right. All at the same distance,
        //offset by sightAngles (radians) relative to facing direction.
        //Range 40-100
        this.sightMagnitude = Math.random() * 60 + 40;
        //Range 10-30
        this.sightRange = Math.random() * 20 + 10;
        this.sightAngles = [-Math.PI / 6, 0, Math.PI / 6];
        this.sights = this.sightAngles.map(() => ({
            vector: { x: 0, y: 0 },
            color: '',
            biome: null,
            hasFlower: false,
            hasCreature: false
        }));

        //Brain. 16 inputs: 3 sights x 5 binary flags + current energy / maxEnergy.
        //Each sight contributes [isWater, isGrass, isSand, isFlower, isCreature]
        //in left, center, right order. Three outputs: output[0] in [-1, 1] is
        //scaled by maxTurn for the rotation; output[1] is a gate -- rotation is
        //applied only when output[1] > 0; output[2] in [-1, 1] is mapped
        //linearly into [minSpeed, maxSpeed] for velocityMagnitude.
        this.brain = brain;
        this.maxTurn = 0.2;

        this.updateVelocity();
        this.updateSight();
    }

    //Brain input vector. Per sight (left, center, right):
    //[isWater, isGrass, isSand, isFlower, isCreature], followed by the
    //creature's current energy normalized to [0, 1].
    brainInputs() {
        const inputs = [];
        for (const s of this.sights) {
            inputs.push(s.biome === biome.WATER ? 1 : 0);
            inputs.push(s.biome === biome.GRASS ? 1 : 0);
            inputs.push(s.biome === biome.SAND ? 1 : 0);
            inputs.push(s.hasFlower ? 1 : 0);
            inputs.push(s.hasCreature ? 1 : 0);
        }
        inputs.push(this.energy / this.maxEnergy);
        return inputs;
    }

    think() {
        if (!this.brain) return;
        const output = this.brain.think(this.brainInputs());
        const shouldRotate = output[1] > 0;
        if (shouldRotate) {
            this.rotate(output[0] * this.maxTurn);
        }
        //Map output[2] from [-1, 1] to [minSpeed, maxSpeed].
        const speedRange = this.maxSpeed - this.minSpeed;
        this.velocityMagnitude = this.minSpeed + (output[2] + 1) * 0.5 * speedRange;
        this.updateVelocity();
    }

    updateVelocity() {
        this.velocity = {
            x: Math.cos(this.direction) * this.velocityMagnitude,
            y: Math.sin(this.direction) * this.velocityMagnitude
        }
    }

    updateSight() {
        for (let i = 0; i < this.sights.length; i++) {
            const angle = this.direction + this.sightAngles[i];
            this.sights[i].vector = {
                x: Math.cos(angle) * this.sightMagnitude,
                y: Math.sin(angle) * this.sightMagnitude
            };
        }
    }

    rotate(radians) {
        this.direction += radians;
        if (this.direction > 2 * Math.PI) {
            this.direction -= 2 * Math.PI;
        }

        if (this.direction < 0) {
            this.direction += 2 * Math.PI;
        }

        this.updateVelocity();
        this.updateSight();
    }

    eat(energy) {
        if (this.maxEnergy - this.energy > energy) {
            this.energy += energy;
            return true;
        }

        return false;
    }

    isAlive() {
        return this.energy > this.minEnergy;
    }

    shouldReproduce() {
        return this.energy >= this.reproductionEnergy;
    }

    //Halve parent energy and return a child with a (possibly mutated) clone of
    //the brain and inheritable parameters. Child spawns at the parent's
    //location with a random facing and starts with the parent's post-split
    //energy. Each weight mutates with BRAIN_MUTATION_RATE, each trait with
    //TRAIT_MUTATION_RATE; the two rates are tuned so the category-level
    //probabilities are comparable.
    reproduce() {
        this.energy /= 2;

        const childBrain = this.brain.clone();
        const brainMutated = childBrain.mutate(BRAIN_MUTATION_RATE);

        //Child heads off in a random direction, independent of the parent.
        const childDirection = Math.random() * 2 * Math.PI;
        const child = new Creature(
            this.location.x,
            this.location.y,
            childDirection,
            this.radius,
            childBrain
        );
        const sightRange = maybeMutate(this.sightRange, 2, 5, 50);
        const sightMagnitude = maybeMutate(this.sightMagnitude, 5, 20, 200);
        const minSpeed = maybeMutate(this.minSpeed, 0.05, 0, 1.0);
        const maxSpeed = maybeMutate(this.maxSpeed, 0.05, 0.3, 2.0);
        const reproductionEnergy = maybeMutate(this.reproductionEnergy, 5, 30, 99);
        child.sightRange = sightRange.value;
        child.sightMagnitude = sightMagnitude.value;
        child.minSpeed = minSpeed.value;
        child.maxSpeed = maxSpeed.value;
        child.reproductionEnergy = reproductionEnergy.value;
        //sightMagnitude is baked into sight vectors via updateSight; re-run
        //since the constructor used a fresh random value before our override.
        child.updateSight();

        //Color tracks behavioural mutation: if any inheritable trait or brain
        //weight changed this reproduction, jitter the color so visibly distinct
        //lineages emerge alongside behavioural drift; otherwise inherit exactly.
        const traitMutated = brainMutated || sightRange.mutated || sightMagnitude.mutated
            || minSpeed.mutated || maxSpeed.mutated || reproductionEnergy.mutated;
        if (traitMutated) {
            child.color = {
                r: Math.floor(Math.random() * 256),
                g: Math.floor(Math.random() * 256),
                b: Math.floor(Math.random() * 256)
            };
        }
        else {
            child.color = { r: this.color.r, g: this.color.g, b: this.color.b };
        }
        //If mutation crossed the speeds, swap so min <= max.
        if (child.minSpeed > child.maxSpeed) {
            [child.minSpeed, child.maxSpeed] = [child.maxSpeed, child.minSpeed];
        }
        child.velocityMagnitude = this.velocityMagnitude;
        child.energy = this.energy;
        return child;
    }

    step() {
        this.energy -= this.energyConsumptionBase + this.velocityMagnitude * this.energyConsumptionPerSpeed;
        this.location.x += this.velocity.x;
        this.location.y += this.velocity.y;
    }
}