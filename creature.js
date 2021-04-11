//Represents a single creature wondering in the world
class Creature
{
    //x and y refers to an absolute location
    constructor(x, y, direction, radius)
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
        this.energy = this.maxEnergy;
        this.energyConsumption = 0.01;
        this.waterMultiplier = 5;

        //Vision
        this.sight = {x: 0, y: 0};
        this.sightMagnitude = this.radius * 3;
        this.sightRange = 20;
        this.sightColor = '';

        this.updateVelocity();
        this.updateSight();
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
        this.sight = {
            x: Math.cos(this.direction) * this.sightMagnitude,
            y: Math.sin(this.direction) * this.sightMagnitude
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