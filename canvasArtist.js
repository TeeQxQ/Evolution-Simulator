const DEBUG_CANVAS_ARTIST = true;

class CanvasArtist
{
    constructor(backgroundContext, gameContext)
    {
        this.bgCtx = backgroundContext;
        this.ctx = gameContext;
    }

    drawCreature(creature, origin, scale)
    {
        this.ctx.beginPath();
        this.ctx.fillStyle = 'red';
        this.ctx.arc(origin.x + creature.location.x * scale,
                     origin.y + creature.location.y * scale,
                     creature.radius * scale,
                     0,
                     Math.PI * 2);
        this.ctx.fill();
        this.ctx.closePath();
    }

    drawFlower(flower, origin, scale)
    {
        this.ctx.fillStyle = flower.color;
        this.ctx.beginPath();
        this.ctx.arc(origin.x + flower.location.x * scale,
                     origin.y + flower.location.y * scale,
                     flower.size * scale,
                     0,
                     Math.PI * 2);
        this.ctx.fill();
        this.ctx.closePath();
    }

    //Tiles are drawn on background
    drawTile(tile, origin, scale)
    {
        //Water won't be drawn
        if (tile.biome != biome.WATER)
        {
            let color;
            switch(tile.biome)
            {
                case biome.GRASS:
                    color = "green";
                    break;
                case biome.SAND:
                    color = "orange";
                    break;
                default:
                    break;
            }
            this.bgCtx.fillStyle = color;
            this.bgCtx.beginPath();
            this.bgCtx.rect(origin.x + tile.location.x * tile.size * scale,
                            origin.y + tile.location.y * tile.size * scale,
                            tile.size * scale,
                            tile.size * scale);
            this.bgCtx.fill();
            this.bgCtx.closePath();

            if(DEBUG_CANVAS_ARTIST)
            {
                this.bgCtx.stroke();
                this.bgCtx.font = "10px Arial";
                this.bgCtx.fillStyle = "white";
                this.bgCtx.textAlign = "center";
                this.bgCtx.fillText(tile.energy.toFixed(2) + ":" + tile.energyRecoveryStorage.toFixed(2), 
                                    origin.x + (tile.location.x * tile.size + tile.size/2) * scale,
                                    origin.y + (tile.location.y * tile.size + tile.size/2) * scale
                                    );
            }
        }
    }
}