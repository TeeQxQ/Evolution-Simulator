//
class Flower
{
    //x and y refers to an absolute location
    constructor(x, y, energy, tileIdx, color)
    {
        this.location = {x: x, y: y};

        //Energy levels
        this.energy = energy;
        this.maxEnergy = 20;
        this.minEnergy = 10;
        this.splitEnergy = 10;
        this.energyGrowRate = 0.01;

        //Physical size
        this.startSize = 0;
        this.size = this.startSize;
        this.grownSize = 10;
        this.grownRate = (this.grownSize - this.size) / Math.round((this.maxEnergy - this.energy) / this.energyGrowRate);
        
        //this.originalSize = size;
        //this.maxSize = size * 2;
        //this.splitSize = size;
        
        this.tileIndex = tileIdx;
        this.color = color;
    }

    grow()
    {
        //Grow larger
        if (this.energy < this.maxEnergy)
        {
            if (this.size < this.grownSize)
            {
                this.size += this.grownRate;
            }
            
            this.energy += this.energyGrowRate;
            return this.energyGrowRate;
        }
        //Split
        else
        {
            this.energy -= this.splitEnergy;
            return 0;
        }
    }

    wither()
    {
        this.color = 'grey';
        //Wither until dead
        if (this.energy > this.minEnergy)
        {
            this.energy -= this.energyGrowRate;
            return this.energyGrowRate;
        }
        else
        {
            return 0;
        }
    }

}
