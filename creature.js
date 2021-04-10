//Represents a single creature wondering in the world
class Creature
{
    //x and y refers to an absolute location
    constructor(x, y, direction, radius)
    {
        this.location = {x: x, y: y};
        this.velocity = {x: 0, y: 0};
        this.velocityMagnitude = 0;
        this.radius = radius;
        this.direction = direction; //0 - 2*PI
        this.energy = 100;

        this.updateVelocity();
    }

    updateVelocity()
    {
        this.velocity = {
            x: Math.cos(this.direction) * this.velocityMagnitude,
            y: Math.sin(this.direction) * this.velocityMagnitude
        }
    }

    step()
    {
        this.location.x += this.velocity.x;
        this.location.y += this.velocity.y;
    }
}