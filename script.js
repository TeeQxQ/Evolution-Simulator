const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//Represents a single creature wondering in the world
class Creature
{
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

    draw(origin, scale)
    {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(origin.x + this.location.x * scale,
                origin.y + this.location.y * scale,
                this.radius * scale,
                0,
                Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}

//
class Flower
{
    constructor(x, y, size, tileIdx)
    {
        this.location = {x: x, y: y};
        this.size = size;
        this.originalSize = size;
        this.maxSize = size * 2;
        this.growRate = 0.01;
        this.tileIndex = tileIdx;
        this.color = 'pink';
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
            this.size = this.originalSize;
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

    draw(origin, scale)
    {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(origin.x + this.location.x * scale,
                origin.y + this.location.y * scale,
                this.size * scale,
                0,
                Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

}

//World is created from square blocks called tiles
class Tile
{
    constructor(indX, indY, size, color, type)
    {
        //Location refers to an index in the 2d array
        this.location = {x: indX, y: indY};
        this.size = size;
        this.color = color;
        this.type = type;
        this.maxEnergy = 100;
        this.minEnergy = 0;
        this.energy = 100; //Math.round(this.maxEnergy/2); //50% at the beginning
        this.energyGrowRate = 0.02;
        this.nofFlowers = 0;
        //Storage to store energy which will be returned after all flowers have died
        this.energyRecoveryStorage = 0;
        this.energyRecoveryRate = 0.01;
    }

    hasEnergy()
    {
        return this.energy > this.minEnergy;
    }

    step()
    {
        if(this.nofFlowers === 0 && this.type != "water")
        {
            if (this.energyRecoveryStorage > 0)
            {
                this.energy += this.energyRecoveryRate;
                this.energyRecoveryStorage -= this.energyRecoveryRate;
            }
            else
            {
                if (this.energy > 0 && this.type != "grass")
                {
                    this.type = "grass";
                    this.color = "green";
                }
            }
        }
        else
        {
            if (this.energy <= this.minEnergy && this.type != "sand")
            {
                this.type = "sand";
                this.color = "orange";
            }
        }
    }

    draw(origin, scale)
    {
        if (this.type != "water")
        {
            ctx.fillStyle = this.color;
            //ctx.lineWidth = "1";
            ctx.beginPath();
            ctx.rect(origin.x + this.location.x * this.size * scale,
                     origin.y + this.location.y * this.size * scale,
                     this.size * scale,
                     this.size * scale
                     );
            ctx.fill();
            //ctx.stroke();
            ctx.closePath();
        }
    }
}

class World
{
    constructor(width, height, tileSize)
    {
        this.dimensions = {width: width, height: height};
        this.tileSize = tileSize;
        this.init();
    }

    init()
    {
        this.creatures = [];
        this.tiles = [];
        this.flowers = [];
        this.origin = {x: 0, y: 0};
        this.createMap();
    }

    createMap()
    {
        const width = this.dimensions.width;
        const height = this.dimensions.height;
        for (let i = 0; i < width * height; i++)
        {
            const xCoord = i % width;
            const yCoord = Math.floor(i / height);
            let color = 'green';
            let r = Math.random();

            const prevX = xCoord - 1;
            //const nextX = xCoord + 1;
            const prevY = yCoord - 1;
            //const nextY = yCoord + 1;
            let nextToWater = false;

            if (prevX >= 0)
            {
                if (this.tiles[yCoord * height + prevX].type === "water")
                {
                    nextToWater = true;
                }
            }
            if (prevY >= 0)
            {
                if (this.tiles[prevY * height + xCoord].type === "water")
                {
                    nextToWater = true;
                }
            }

            if (nextToWater)
            {
                if (r < 0.6)
                {
                    color = null;
                }
            }
            else
            {
                if (r < 0.01)
                {
                    color = null;
                }
            }

            if (color)
            {
                const type = "grass";
                this.tiles.push(new Tile(xCoord, yCoord, this.tileSize, color, type));
            }
            else
            {
                const type = "water";
                this.tiles.push(new Tile(xCoord, yCoord, this.tileSize, color, type));
            }

        }
        
    }

    addCreature(x, y)
    {
        //random direction
        const direction = Math.random() * 2 * Math.PI;
        this.creatures.push(new Creature(x, y, direction, 10));
    }

    addFlower()
    {
        const x = Math.random() * this.dimensions.width * this.tileSize;
        const y = Math.random() * this.dimensions.height * this.tileSize;
        this.addFlowerIfPossible(x, y, 5);
    }

    addFlowerIfPossible(newX, newY, newSize)
    {
        let flowerNotInWater = false;

        //find closest tile
        let closestTileIdx = 0;
        let closestDistance = this.dimensions.width;
        this.tiles.forEach((tile, index) => 
        {
            //Center coordinates for the tile
            const tileX = tile.location.x * this.tileSize + this.tileSize/2;
            const tileY = tile.location.y * this.tileSize + this.tileSize/2;

            let dist = Math.sqrt(Math.pow(tileX - newX, 2) + Math.pow(tileY - newY, 2));
            if (dist < closestDistance)
            {
                closestDistance = dist;
                closestTileIdx = index;

                if (closestDistance < this.tileSize / 2 && tile.type == "grass")
                {
                    flowerNotInWater = true;
                }
            }
        });

        const closestTile = this.tiles[closestTileIdx];
        const tileX = closestTile.location.x * this.tileSize + this.tileSize/2;
        const tileY = closestTile.location.y * this.tileSize + this.tileSize/2; 

        if (!flowerNotInWater &&
            tileX - this.tileSize/2 < newX &&
            tileX + this.tileSize/2 > newX &&
            tileY - this.tileSize/2 < newY &&
            tileY + this.tileSize/2 > newY &&
            closestTile.type == "grass")
        {
            flowerNotInWater = true;
        }

        if (flowerNotInWater)
        {
            this.flowers.push(new Flower(newX, newY, newSize, closestTileIdx));
            this.tiles[closestTileIdx].nofFlowers++;
        }
    }

    moveOrigin(deltaX, deltaY)
    {
        this.origin.x += Math.round(deltaX);
        this.origin.y += Math.round(deltaY);
    }

    draw(scale)
    {
        this.tiles.forEach((tile, index) => 
        {
            tile.step();
            tile.draw(this.origin, scale);
        });

        this.flowers.forEach((flower, index) => 
        {
            //Live...
            if (this.tiles[flower.tileIndex].hasEnergy())
            {
                const flowerGrowth = flower.grow();
                if(flowerGrowth === 0)
                {
                    //Flower has splitted
                    const x = flower.location.x;
                    const y = flower.location.y;
                    //random direction and magnitude to pop
                    const dir = Math.random() * Math.PI;
                    const magnitude = Math.random() * this.tileSize + this.tileSize;

                    const newX = x + Math.cos(dir) * magnitude;
                    const newY = y + Math.sin(dir) * magnitude;

                    this.addFlowerIfPossible(newX, newY, flower.originalSize);
                }
                else
                {
                    //Remove as much energy as flower took for growing
                    this.tiles[flower.tileIndex].energy -= flowerGrowth;
                }

                flower.draw(this.origin, scale);

            }
            //...or die
            else
            {
                const flowerWithering = flower.wither();
                if(flowerWithering === 0)
                {
                    this.tiles[flower.tileIndex].nofFlowers--;
                    this.flowers.splice(index, 1);
                }
                else
                {
                    this.tiles[flower.tileIndex].energyRecoveryStorage += flowerWithering;
                    flower.draw(this.origin, scale);
                }
            }
            
        });

        this.creatures.forEach((creature, index) =>
        {
            creature.step();
            creature.draw(this.origin, scale);
        });

        
    }
}

class Simulator
{
    constructor()
    {
        //Scaling
        this.minScale = 0.4;
        this.maxScale = 3;
        this.scale = this.minScale;
        this.tileSize = 50;

        //Mouse handling
        this.mouseClicked = false;
        this.mouseClickCoord = {x: 0, y: 0};

        const worldWidth = 30;
        const worldHeight = 30;
        
        this.world = new World(worldWidth, worldHeight, this.tileSize);

        this.init();
    }

    init()
    {
        const nofCreatures = 1;
        const nofFlowers = 10;
        for (let i = 0; i < nofCreatures; i++)
        {
            this.world.addCreature(100, 100);
        }

        for (let i = 0; i < nofFlowers; i++)
        {
            this.world.addFlower();
        }
    }

    clearCanvas()
    {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
	    ctx.fillRect(0, 
				     0, 
				     canvas.width, 
				     canvas.height);
        ctx.closePath();
    }

    step()
    {
        this.clearCanvas();
        this.world.draw(this.scale);
    }

    animate()
    {
        this.step();
        requestAnimationFrame(() => this.animate());
    }

    run()
    {
        this.animate();
    }

    pause()
    {
        //TODO
    }

    stop()
    {
        //TODO
    }

    wheelController(event)
    {
        
        const mouseXCoord = (event.x - this.world.origin.x) / (this.tileSize * this.scale);
        const mouseYCoord = (event.y - this.world.origin.y) / (this.tileSize * this.scale);

        if (event.deltaY > 0)
        {
            if (this.scale > this.minScale)
            {
                this.scale -= 0.1;
            }
        }
        else
        {
            if (this.scale < this.maxScale)
            {
                this.scale += 0.1;
            }
        }

        const newMouseXCoord = (event.x - this.world.origin.x) / (this.tileSize * this.scale);
        const newMouseYCoord = (event.y - this.world.origin.y) / (this.tileSize * this.scale);

        this.world.moveOrigin((newMouseXCoord - mouseXCoord) * this.tileSize * this.scale, 
                              (newMouseYCoord - mouseYCoord) * this.tileSize * this.scale);
    }

    clickController(event)
    {
        this.mouseClicked = true;
        this.mouseClickCoord = {x: event.x, y: event.y};
    }

    releaseController(event)
    {
        this.mouseClicked = false;
    }

    moveController(event)
    {
        if (this.mouseClicked)
        {
            this.world.moveOrigin(event.x - this.mouseClickCoord.x, 
                                  event.y - this.mouseClickCoord.y);
            this.mouseClickCoord = {x: event.x, y: event.y};
        }
    }
}

const simulator = new Simulator();

canvas.onwheel = (event) =>
{
    simulator.wheelController(event);
}

canvas.onmousedown = (event) =>
{
    simulator.clickController(event);
};

canvas.onmouseup = (event) => 
{
    simulator.releaseController(event);
}

canvas.onmousemove = (event) => 
{
    simulator.moveController(event);
}

simulator.run();
