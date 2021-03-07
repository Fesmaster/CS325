import "./phaser.js";

const TILE_SIZE = 16;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 38;

const ROOMSIZE_MAX = 10;
const ROOMSIZE_MIN = 5;
const ROOM_DEPTH = 5;

/*SO, this huge wall of text is a mapping from adjacency information into tileIDs*/
const TILE_MAPPING = [];
TILE_MAPPING[0xC0] = 0;     TILE_MAPPING[0xD0] = 10;     TILE_MAPPING[0x50] = 20;
TILE_MAPPING[0xE0] = 1;     TILE_MAPPING[0xF0] = 11;     TILE_MAPPING[0x70] = 21;
TILE_MAPPING[0xA0] = 2;     TILE_MAPPING[0xB0] = 12;     TILE_MAPPING[0x30] = 22;
TILE_MAPPING[0xC8] = 3;     TILE_MAPPING[0xDA] = 13;     TILE_MAPPING[0x52] = 23;
TILE_MAPPING[0xEC] = 4;     TILE_MAPPING[0xFF] = 14;     TILE_MAPPING[0x73] = 24;
TILE_MAPPING[0xA4] = 5;     TILE_MAPPING[0xB5] = 15;     TILE_MAPPING[0x31] = 25;
TILE_MAPPING[0xF8] = 6;     TILE_MAPPING[0xFA] = 16;     TILE_MAPPING[0xF2] = 26;
TILE_MAPPING[0xFC] = 7;     TILE_MAPPING[0x00] = 17;     TILE_MAPPING[0xF3] = 27;
TILE_MAPPING[0xF4] = 8;     TILE_MAPPING[0xF5] = 18;     TILE_MAPPING[0xF1] = 28;
/*TILE_MAPPING[0x60] = 9;   TILE_MAPPING[0x90] = 19;     TILE_MAPPING[0xC0] = 29;*/

TILE_MAPPING[0x80] = 30; TILE_MAPPING[0x40] = 40;
TILE_MAPPING[0x20] = 31; TILE_MAPPING[0x10] = 41;
TILE_MAPPING[0xF7] = 32; TILE_MAPPING[0xFD] = 42;
TILE_MAPPING[0xFB] = 33; TILE_MAPPING[0xFE] = 43;
TILE_MAPPING[0xE8] = 34; TILE_MAPPING[0xD2] = 44;
TILE_MAPPING[0xB4] = 35; TILE_MAPPING[0x71] = 45;
TILE_MAPPING[0xD8] = 36; TILE_MAPPING[0x72] = 46;
TILE_MAPPING[0xE4] = 37; TILE_MAPPING[0xB1] = 47;
TILE_MAPPING[0xF6] = 38; TILE_MAPPING[0x60] = 48;
TILE_MAPPING[0xF9] = 39; TILE_MAPPING[0x90] = 49;


//helper function for adjacency calculations
function isWall(map, x, y){
    if (x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT){
        return map[x][y] > 0; //0 and under is empty space
    }else{
        return true; //off the map is considered wall
    }
}
//calculate the adjacency information, 
//IE, the index into the TILE_MAPPING table that holds the correct tile ID
function calculateAdjacencyInfo(map, x, y){
    let number = 0;
    let Sides = [{x:0,y:-1}, {x:-1,y:0}, {x:1,y:0}, {x:0,y:1}];
    let SidesID = [0x10, 0x20, 0x40, 0x80];
    
    let CornerMask = [0x30, 0x50, 0xA0, 0xC0];
    let Corners = [{x:-1,y:-1}, {x:1,y:-1}, {x:-1,y:1}, {x:1,y:1}];
    let CornersID = [0x01, 0x02, 0x04, 0x08];
    //first, get the 4 directly adjacent tiles
    for(let i = 0;i<4;i++){
        if (isWall(map, x+Sides[i].x, y+Sides[i].y)){
            number = number | SidesID[i];
        }
    }
    //then, get the corners, if they are noticable
    for(let i = 0;i<4;i++){
        //console.log((number & CornerMask[i]) == CornerMask[i]);
        if ((number & CornerMask[i]) === CornerMask[i]){
            
            if ( isWall(map, x+Corners[i].x, y+Corners[i].y)){
                number = number | CornersID[i];
            }
        }
    }
    //
    return number;
}

//Some helper functions
function VecToString(vec){
    return "{x:" + vec.x + ",y:" + vec.y + "}"; 
}
function getVectorFromDir(dir){
    switch(dir){
        case 0: return {Forward:new Phaser.Math.Vector2(0,-1), Right:new Phaser.Math.Vector2(1, 0)}; //forward
        case 1: return {Forward:new Phaser.Math.Vector2(1, 0), Right:new Phaser.Math.Vector2(0, 1)}; //left
        case 2: return {Forward:new Phaser.Math.Vector2(0, 1), Right:new Phaser.Math.Vector2(-1,0)}; //right
        case 3: return {Forward:new Phaser.Math.Vector2(-1,0), Right:new Phaser.Math.Vector2(0,-1)}; //backwards
        default: return{Forward:new Phaser.Math.Vector2(0, 0), Right:new Phaser.Math.Vector2(0, 0)};
    }
}
function turn(dir, angle){
    let r = dir + angle;
    while (r < 0){
        r += 4;
    }
    return r % 4;
}

/* Convert bounds from a flood fill to room size param, using a specific direction
 */
function clampBounds(pos, bounds, dir){
    switch(dir){
        case 0: bounds.maxy = pos.y; break;
        case 1: bounds.minx = pos.x; break;
        case 2: bounds.miny = pos.y; break;
        case 0: bounds.maxx = pos.x; break;
        default: break;
    }
}

/*Helper methods for the floodfill below
 * they just do soem simple things
 */
function isInBounds(pos, bounds){
    if (
        (bounds.minx !== undefined && pos.x < bounds.minx) || 
        (bounds.maxx !== undefined && pos.x > bounds.maxx) || 
        (bounds.miny !== undefined && pos.y < bounds.miny) || 
        (bounds.maxy !== undefined && pos.y > bounds.maxy)
    ){
        return false
    }else{
        return true
    }
}
function isInTiles(pos){
    //console.log("isInTiles: "+VecToString(pos));
    if (pos.x < 0 || pos.y < 0 || pos.x >= MAP_WIDTH || pos.y >= MAP_HEIGHT){
        return false
    }else{
        return true
    }
}
function setBounds(bounds, pos, dir){
    if (dir === 0){
        if (bounds.miny === undefined || bounds.miny < pos.y){
            bounds.miny = pos.y;
        }
    }else if (dir == 1){
        if (bounds.maxx === undefined || bounds.maxx > pos.x){
            bounds.maxx = pos.x;
        }
    }else if (dir == 2){
        if (bounds.maxy === undefined || bounds.maxy > pos.y){
            bounds.maxy = pos.y;
        }
    }else if (dir == 3){
        if (bounds.minx === undefined || bounds.minx < pos.x){
            bounds.minx = pos.x;
        }
    }
}

/* This method uses flood fill to find the larget rectangular area at a given point
 * The only avalable spaces are those full of wall, 
 * It is limited to a 10x10 space, as otherwise it can take literally forever...
 */
function FloodTraceRect(map, origin, bounds, used){
    if (bounds === undefined) {bounds = {};}
    if (used === undefined) {used = {};}
    let list = [origin];
    let nList = [];
    while(list.length> 0){
        nList = [];
        for (let i=0;i<list.length;i++){
            let coord = list[i].clone();
            if (isInBounds(coord, bounds)){
                //check four surrounding tiles
                let offsets = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}]
                for (let j = 0;j<4;j++){
                    let c_check = coord.clone().add(offsets[j]);
                    
                    if (
                        isInBounds(c_check, bounds) && 
                        isInTiles(c_check) && 
                        Math.abs(c_check.x - origin.x) < ROOMSIZE_MAX && 
                        Math.abs(c_check.y - origin.y) < ROOMSIZE_MAX
                    ){
                        if (used[VecToString(c_check)] === undefined){
                            //check this tile
                            if (map[c_check.x][c_check.y] !== 0){
                                //console.log("ADD: " + VecToString(c_check));
                                nList.push(c_check);
                            }else{
                                setBounds(bounds, coord, j);
                            }
                        }
                    }else{
                        setBounds(bounds, coord, j);
                    } 
                    
                }
                used[VecToString(coord)] = true;
            }
        }
        list = nList;
    }
    return bounds;
}

/* Checks if a room is valid, and if not, prints a nice error message.
 */
function isValidRoom(pos, bounds, dir){
    if (isInBounds(pos, bounds)){
        if (
            bounds.maxx - bounds.minx + 1 < ROOMSIZE_MIN || 
            bounds.maxy - bounds.miny + 1 < ROOMSIZE_MIN
        ){
            //console.log("Invalid Room: Not large enough.")
            //console.log(bounds)
            return false;
        }
        
        if (dir % 2 == 0){
            if (pos.x > bounds.minx && pos.x < bounds.maxx){
                return true;
            }else{
                //console.log("Invalid Room: Door is not in the middle of a wall (x).");
            }
        }else{
            if (pos.y > bounds.miny && pos.y < bounds.maxy){
                return true;
            }else{
                //console.log("Invalid Room: Door is not in the middle of a wall (y).");
            }
        }
    }else{
        //console.log("Invalid Room: door is not within the bounds.")
        return false
    }
}
/* This method builds room data into the map, including logging new room positions.
 * 
 */
function buildRoom(map, pos, bounds, dir, depth){
    if (depth === undefined){depth = 0;} //define depth. used for recursive call
    
    if (!isValidRoom(pos, bounds, dir)){
        //console.log("ERROR: attempting to creat a room with door outside of bounds");
        //depth = 1000;
        return false;
    }
    clampBounds(pos, bounds, dir);
    
    for (let x = bounds.minx; x <= bounds.maxx; x++){
        for (let y = bounds.miny; y <= bounds.maxy; y++){
            if (x == bounds.minx || x == bounds.maxx || y == bounds.miny || y == bounds.maxy){
                //wall
                map[x][y] = 3
            }else{
                //room content
                map[x][y] = 0
            }
        }
    }
    
    //recursively generate more rooms
    if (depth < ROOM_DEPTH){
        let count = (Math.random()*8)+1
        for (let i = 0; i < count;i++){
            let dirOff = Math.floor(Math.random()*3)-1;
            if (dirOff == 2){dirOff = 1;}
            let d2 = turn(dir, dirOff);
            let newOrigin = new Phaser.Math.Vector2(0, 0);
            
            if (d2%2 == 0){
                //back wall
                newOrigin.x = Math.floor(Math.random()*(bounds.maxx-bounds.minx-1)) + bounds.minx+1;
                if (d2 == 2){
                    newOrigin.y = bounds.maxy;
                    //console.log("SKIP");
                    //return;
                }else{
                    newOrigin.y = bounds.miny;
                    //console.log("SKIP");
                    //return;
                }
            }else{
                newOrigin.y = Math.floor(Math.random()*(bounds.maxy-bounds.miny-1)) + bounds.miny+1;
                if (d2 == 3){
                    newOrigin.x = bounds.minx;
                }else{
                    newOrigin.x = bounds.maxx;
                    //console.log("SKIP");
                    //return;
                }
            }
            let newBounds = FloodTraceRect(map, newOrigin.clone(), {}, {});
            buildRoom(map, newOrigin.clone(), newBounds, d2, depth+1)
        }
    }
    
    map[pos.x][pos.y] = 0;
    return true
}


class MyScene extends Phaser.Scene {
    
    constructor() {
        super();
        
        this.left  = null;
        this.right = null;
        this.up    = null;
        this.down  = null;
        
        this.speed = 3;
        this.player = null;
        /*
        this.Interactables = [];
        //*/
        
        this.map = null;
        this.tiles = null;
        this.layer_floor = null;
        this.layer_props = null;
        this.layer_wall = null;
        
        this.camera = null;
    }
    
    preload() {
        this.load.image("tiles", "assets/Tilemap.png");
        this.load.image("player", "assets/Player.png");
        this.load.tilemapTiledJSON("map", "assets/mapTiles.json");
    }
    
    create() {
        //create input
        //*
        this.input.keyboard.addCapture('W,S,A,D,SPACE');
        this.left  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.up    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.down  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        //*/
        
        
        
        //create map
        this.map = this.make.tilemap({
            tileWidth: TILE_SIZE, 
            tileHeight: TILE_SIZE, 
            width: MAP_WIDTH, 
            height: MAP_HEIGHT,
            key: "map"
        });
        this.map.height = MAP_HEIGHT;
        this.map.width = MAP_WIDTH;
        this.map.heightInPixels = MAP_HEIGHT * TILE_SIZE;
        this.map.widthInPixels = MAP_WIDTH * TILE_SIZE;
        this.tiles = this.map.addTilesetImage("Tilemap", "tiles");
        this.layer_floor = this.map.createBlankLayer("floor", this.tiles);
        this.layer_floor.setScale(2)
        
        //this.layer_props = this.map.createBlankLayer(1, this.tiles);
        //this.layer_props.setScale(2)
        
        this.layer_wall  = this.map.createBlankLayer("walls", this.tiles);
        this.layer_wall.setScale(2)
        
        //generate the map
        this.generate();
        
        
        
        //clamp the camera so it can't go out of bounds
        
        
        this.player = this.matter.add.image(25*TILE_SIZE*2, 2*TILE_SIZE*2, "player");
        this.player.setFixedRotation();
        this.player.body.label = "player";
        this.player.setExistingBody(this.player.body);
        
        
        
        /*
        let cursors = this.input.keyboard.createCursorKeys();
        let cameraConfig = {
            camera: this.cameras.main,
            left: cursors.left,
            right: cursors.right,
            up: cursors.up,
            down: cursors.down,
            speed: 0.5
        };
        this.camera = new Phaser.Cameras.Controls.FixedKeyControl(cameraConfig);
        //*/
        this.cameras.main.setBounds(
            -TILE_SIZE, 
            -TILE_SIZE, 
            this.map.widthInPixels*2 + 2* TILE_SIZE, 
            this.map.heightInPixels*2 + 2 * TILE_SIZE
        );
        this.cameras.main.startFollow(this.player);
        
        
        //build collision information
        this.map.setCollisionFromCollisionGroup(true, true);
        this.matter.world.convertTilemapLayer(this.layer_wall);
    }
    generate(){
        let walls = []
        for (let x = 0;x < MAP_WIDTH; x++){
            walls[x] = []
            for (let y = 0;y<MAP_HEIGHT;y++){
                //generate the floor
                //it uses 4 tiles, thus the strange messing about with modulus
                let tile = 51;
                if (x % 2 == 0){tile += 1;}
                if (y % 2 == 0){tile += 2;}
                this.layer_floor.putTileAt(tile, x, y);
                
                //generate the walls
                //this currently makes them all filled
                walls[x][y] = 1
            }
        }
        
        //place the initial room
        let dir = 2;
        let p = new Phaser.Math.Vector2(25, 0);
        let bounds = FloodTraceRect(walls, p.clone(), {}, {});
        buildRoom(walls, p.clone(), bounds, dir);
        
        
        //draw the walls to the tilemap
        for (let x = 0;x < MAP_WIDTH; x++){
            for (let y = 0;y<MAP_HEIGHT;y++){
                if (walls[x][y] > 0 && walls[x][y] < 2){
                    //14 = full black
                    //let adj = calculateAdjacencyInfo(walls, x, y)
                    //this.layer_wall.putTileAt(TILE_MAPPING[adj], x, y);
                    this.layer_wall.putTileAt(15, x, y);
                }else if (walls[x][y] > 1){
                    //17 is a pillar
                    let adj = calculateAdjacencyInfo(walls, x, y)
                    
                    this.layer_wall.putTileAt(TILE_MAPPING[adj]+1, x, y);
                }
            }
        }
        //this.layer_props.putTileAt(0, 5, 14);
    }
    
    update(time, delta) {
        //this.camera.update(delta);
        
        
        let v = new Phaser.Math.Vector2(0,0);
        if (this.left.isDown) {v.x -= this.speed;}
        if (this.right.isDown){v.x += this.speed;}
        if (this.up.isDown)   {v.y -= this.speed;}
        if (this.down.isDown) {v.y += this.speed;}
        this.player.setVelocity(v.x, v.y);
        //clamp the player to the screen
        if (this.player.x < 0){
            this.player.x = 0;
        }else if(this.player.x > this.map.widthInPixels*2 +  TILE_SIZE){
            this.player.x = this.map.widthInPixels*2 +  TILE_SIZE
        }
        
        if (this.player.y < 0){
            this.player.y = 0;
        }else if(this.player.y > this.map.heightInPixels*2 +  TILE_SIZE){
            this.player.y = this.map.heightInPixels*2 +  TILE_SIZE
        
            
        }
    }
}

const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: TILE_SIZE * MAP_WIDTH,
    height: TILE_SIZE * MAP_HEIGHT,
    scene: MyScene,
    pixelArt: true,
    physics: { 
        default: 'matter',
        arcade: {
            debug: true,
            gravity: {x:0,y:0}
        },
        matter: {
            /*
            debug: {
                showBody: true,
                showStaticBody: true
            }, 
            //*/
            gravity: {x:0,y:0}
        }
    },
});
