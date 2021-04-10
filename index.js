const canvas = document.getElementById('game-layer');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const backgroundCanvas = document.getElementById('background-layer');
const backgroundCtx = backgroundCanvas.getContext('2d');
backgroundCanvas.width = window.innerWidth;
backgroundCanvas.height = window.innerHeight;

const DEBUG = true;

class World
{
    constructor(width, height, tileSize, defaultScale)
    {
        this.dimensions = {width: width, height: height};
        this.tileSize = tileSize;
        this.origin = {x: Math.round(canvas.width / 2) - Math.round(width / 2) * tileSize * defaultScale, 
                       y: Math.round(canvas.height / 2) - Math.round(height / 2) * tileSize * defaultScale};
        this.canvasArtist = new CanvasArtist(backgroundCtx, ctx);
        this.init();
    }

    init()
    {
        this.creatures = [];
        this.tiles = [];
        this.flowers = [];
        this.createMap();
        this.mapUpdateNeeded = true;
    }

    createMap()
    {
        const width = this.dimensions.width;
        const height = this.dimensions.height;
        let waterArray = new Array(width * height);

        for (let i = 0; i < width * height; i++)
        {
            const xCoord = i % width;
            const yCoord = Math.floor(i / height);
            this.tiles.push(new Tile(xCoord, yCoord, this.tileSize, "green", "grass"));
            waterArray[i] = 0;
        }

        for(let i = 0; i < 1; i++)
        {
            const r = Math.floor(Math.random() * width * height);
            const prevR = r - 1;
            const nextR = r + 1;
            const prevRowR = r - width;
            const nextRowR = r + width;

            console.log("r: " + r);
            console.log("prevR: " + prevR);
            console.log("nextR: " + nextR);
            console.log("prevRowR: " + prevRowR);
            console.log("nextRowR: " + nextRowR);
            
            waterArray[r] += 3;
            if (prevR >= 0 && r % width != 0)
            {
                waterArray[prevR] += 2;
            }

            if (nextR < width * height && r % width != width - 1)
            {
                waterArray[nextR] += 2;
            }

            if (prevRowR >= 0 && r % height != 0)
            {
                waterArray[prevRowR] += 2;
                
                if (prevRowR - 1 >= 0)
                {
                    waterArray[prevRowR - 1] += 2;
                }

                if (prevRowR + 1 < width * height && (prevRowR + 1) % width != width-1)
                {
                    waterArray[prevRowR + 1] += 2;
                }
            }

            if (nextRowR < width * height && r % height != height - 1)
            {
                waterArray[nextRowR] += 2;

                if (nextRowR - 1 >= 0)
                {
                    waterArray[nextRowR - 1] += 2;
                }

                if (nextRowR + 1 < width * height)
                {
                    waterArray[nextRowR + 1] += 2;
                }
            }
        }

        for (let i = 0; i < width * height; i++)
        {
            if (waterArray[i] > 1)
            {
                this.tiles[i].type = "water";
                this.tiles[i].color = "blue";
            }
            if (waterArray[i] > 2)
            {
                this.tiles[i].type = "sand";
                this.tiles[i].color = "orange";
            }
        }

        /*for (let i = 0; i < width * height; i++)
        {
            const xCoord = i % width;
            const yCoord = Math.floor(i / height);
            let color = 'green';
            let r = Math.random();

            const prevX = xCoord - 1;
            const prevY = yCoord - 1;
            const nextX = xCoord + 1;

            let nextToWater = 0;

            if (prevX >= 0)
            {
                
                if (prevY >= 0)
                {
                    if (this.tiles[prevY * height + prevX].type === "water")
                    {
                        nextToWater++;
                    }
            }
            else
            {
                nextToWater+=2;
            }

            if (prevY >= 0)
            {
                if (this.tiles[prevY * height + xCoord].type === "water")
                {
                    nextToWater+=2;
                }

                if (nextX < width)
                {
                    if (this.tiles[prevY * height + nextX].type === "water")
                    {
                        nextToWater++;
                    }
                }
                else
                {
                    nextToWater+=2;
                }

            }
            else
            {
                nextToWater+=2;
            }

            if (r < 0.01 + nextToWater * nextToWater * 0.01 * 6)
            {
                color = null;
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

        }*/
        
    }

    //Map is drawn on the background canvas, and it is updated infrequently to optimize performance
    updateMap(scale)
    {
        backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
        this.tiles.forEach((tile, index) => 
        {
            //tile.draw(this.origin, scale);
            this.canvasArtist.drawTile(tile, this.origin, scale);
        });
    }

    addCreature(x, y)
    {
        //random direction
        const direction = Math.random() * 2 * Math.PI;
        this.creatures.push(new Creature(x, y, direction, 10));
    }

    addFlower(color)
    {
        const x = Math.random() * this.dimensions.width * this.tileSize;
        const y = Math.random() * this.dimensions.height * this.tileSize;
        this.addFlowerIfPossible(x, y, 5, color);
    }

    //Returns how much energy was moved in split
    addFlowerIfPossible(newX, newY, newSize, color)
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
            this.flowers.push(new Flower(newX, newY, newSize, closestTileIdx, color));
            this.tiles[closestTileIdx].nofFlowers++;
            return newSize;
        }

        return 0;
    }

    moveOrigin(deltaX, deltaY)
    {
        this.origin.x += Math.round(deltaX);
        this.origin.y += Math.round(deltaY);
        this.mapUpdateNeeded = true;
    }

    draw(scale)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.tiles.forEach((tile, index) => 
        {
            this.mapUpdateNeeded = tile.step() || this.mapUpdateNeeded;
        });

        if (this.mapUpdateNeeded || DEBUG)
        {
            this.updateMap(scale);
            this.mapUpdateNeeded = false;
        }

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
                    const dir = Math.random() * 2 * Math.PI;
                    const magnitude = Math.random() * this.tileSize + this.tileSize;

                    const newX = x + Math.cos(dir) * magnitude;
                    const newY = y + Math.sin(dir) * magnitude;

                    const energyMoved = this.addFlowerIfPossible(newX, newY, flower.splitSize, flower.color);
                    if (energyMoved === 0)
                    {
                        //New flower couldnt be created
                        this.tiles[flower.tileIndex].energyRecoveryStorage += flower.splitSize;
                    }

                }
                else
                {
                    //Remove as much energy as flower took for growing
                    this.tiles[flower.tileIndex].energy -= flowerGrowth;
                }

                //flower.draw(this.origin, scale);
                this.canvasArtist.drawFlower(flower, this.origin, scale);

            }
            //...or die
            else
            {
                const flowerWithering = flower.wither();
                if(flowerWithering === 0)
                {
                    this.tiles[flower.tileIndex].nofFlowers--;
                    this.tiles[flower.tileIndex].energyRecoveryStorage += flower.originalSize;
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
            //creature.step();
            //creature.draw(this.origin, scale);
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
        
        this.world = new World(worldWidth, worldHeight, this.tileSize, this.scale);

        this.init();
    }

    init()
    {
        const nofCreatures = 1;
        const nofFlowers = 5;
        const flowerColors = ['pink', 'cyan', 'black', 'white', 'yellow']
        for (let i = 0; i < nofCreatures; i++)
        {
            this.world.addCreature(100, 100);
        }

        
        for (let i = 0; i < nofFlowers; i++)
        {
            this.world.addFlower(flowerColors[i]);
        }
    }



    step()
    {
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

