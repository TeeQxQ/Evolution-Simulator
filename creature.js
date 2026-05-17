//Represents a single creature wondering in the world
class Creature
{
    //x and y refers to an absolute location
    constructor(x, y, direction, radius, brain)
    {
        //Physics
        this.location = {x: x, y: y};
        this.velocity = {x: 0, y: 0};
        this.velocityMagnitude = 0.5;
        this.radius = radius;
        this.direction = direction; //0 - 2*PI

        //Energy
        this.maxEnergy = 100;
        this.minEnergy = 0;
        this.energy = this.maxEnergy / 2;
        this.energyConsumption = 0.01;
        //Extra energy drained per step while standing on a water tile, on top of
        //the normal energyConsumption.
        this.waterDrain = 0.5;

        //Vision. Three sight spots: left, center, right. All at the same distance,
        //offset by sightAngles (radians) relative to facing direction.
        this.sightMagnitude = this.radius * 3;
        //Range 10-30
        this.sightRange = Math.random() * 20 + 10;
        this.sightAngles = [-Math.PI / 6, 0, Math.PI / 6];
        this.sights = this.sightAngles.map(() => ({
            vector: {x: 0, y: 0},
            color: '',
            biome: null,
            hasFlower: false,
            hasCreature: false
        }));

        //Brain. Inputs are 3 sights x 5 binary flags = 15 inputs total. Each sight
        //contributes [isWater, isGrass, isSand, isFlower, isCreature] in left,
        //center, right order. Two outputs: output[0] in [-1, 1] is scaled by
        //maxTurn for the rotation; output[1] is a gate -- rotation is applied
        //only when output[1] > 0.
        this.brain = brain;
        this.maxTurn = 0.2;

        this.updateVelocity();
        this.updateSight();
    }

    //Flatten all sights into one input vector. Per sight (left, center, right):
    //[isWater, isGrass, isSand, isFlower, isCreature].
    sightAsBinary()
    {
        const inputs = [];
        for (const s of this.sights)
        {
            inputs.push(s.biome === biome.WATER ? 1 : 0);
            inputs.push(s.biome === biome.GRASS ? 1 : 0);
            inputs.push(s.biome === biome.SAND  ? 1 : 0);
            inputs.push(s.hasFlower             ? 1 : 0);
            inputs.push(s.hasCreature           ? 1 : 0);
        }
        return inputs;
    }

    think()
    {
        if (!this.brain) return;
        const output = this.brain.think(this.sightAsBinary());
        const shouldRotate = output[1] > 0;
        if (shouldRotate)
        {
            this.rotate(output[0] * this.maxTurn);
        }
    }

    updateVelocity()
    {
        this.velocity = {
            x: Math.cos(this.direction) * this.velocityMagnitude,
            y: Math.sin(this.direction) * this.velocityMagnitude
        }
    }

    updateSight()
    {
        for (let i = 0; i < this.sights.length; i++)
        {
            const angle = this.direction + this.sightAngles[i];
            this.sights[i].vector = {
                x: Math.cos(angle) * this.sightMagnitude,
                y: Math.sin(angle) * this.sightMagnitude
            };
        }
    }

    rotate(radians)
    {
        this.direction += radians;
        if (this.direction > 2 * Math.PI)
        {
            this.direction -= 2 * Math.PI;
        }

        if (this.direction < 0)
        {
            this.direction += 2 * Math.PI;
        }

        this.updateVelocity();
        this.updateSight();
    }

    eat(energy)
    {
        if (this.maxEnergy - this.energy > energy)
        {
            this.energy += energy;
            return true;
        }

        return false;
    }

    isAlive()
    {
        return this.energy > this.minEnergy;
    }

    step()
    {
        this.energy -= this.energyConsumption;
        this.location.x += this.velocity.x;
        this.location.y += this.velocity.y;
    }
}