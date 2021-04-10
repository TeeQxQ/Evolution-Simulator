//
class Flower
{
    //x and y refers to an absolute location
    constructor(x, y, size, tileIdx, color)
    {
        this.location = {x: x, y: y};
        this.size = size;
        this.originalSize = size;
        this.maxSize = size * 2;
        this.splitSize = size;
        this.growRate = 0.01;
        this.tileIndex = tileIdx;
        this.color = color;
    }

    grow()
    {
        //Grow larger
        if (this.size < this.maxSize)
        {
            this.size += this.growRate;
            return this.growRate;
        }
        //Split
        else
        {
            this.size -= this.splitSize;
            return 0;
        }
    }

    wither()
    {
        this.color = 'grey';
        //Wither until dead
        if (this.size > this.originalSize)
        {
            this.size -= this.growRate;
            return this.growRate;
        }
        else
        {
            return 0;
        }
    }

}
