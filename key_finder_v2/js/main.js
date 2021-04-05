import "./phaser.js";

//BEGIN constants
const TILE_SIZE = 16;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 38;

const ROOMSIZE_MAX = 10;
const ROOMSIZE_MIN = 5;
const ROOM_DEPTH = 5;

const KEYCOUNT = 5;

let ENABLE_NAVGRAPHICS = false;

//BEGIN tilemapping
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

TILE_MAPPING[0x80] = 30;    TILE_MAPPING[0x40] = 40;
TILE_MAPPING[0x20] = 31;    TILE_MAPPING[0x10] = 41;
TILE_MAPPING[0xF7] = 32;    TILE_MAPPING[0xFD] = 42;
TILE_MAPPING[0xFB] = 33;    TILE_MAPPING[0xFE] = 43;
TILE_MAPPING[0xE8] = 34;    TILE_MAPPING[0xD2] = 44;
TILE_MAPPING[0xB4] = 35;    TILE_MAPPING[0x71] = 45;
TILE_MAPPING[0xD8] = 36;    TILE_MAPPING[0x72] = 46;
TILE_MAPPING[0xE4] = 37;    TILE_MAPPING[0xB1] = 47;
TILE_MAPPING[0xF6] = 38;    TILE_MAPPING[0x60] = 48;
TILE_MAPPING[0xF9] = 39;    TILE_MAPPING[0x90] = 49;
//END tilemapping
//END constants

//BEGIN Navigation

//BEGIN PriorityQueue
//Priority Queue class, implemented using min binary heap.
//I was lazy and used one from the web
//https://javascript.plainenglish.io/introduction-to-priority-queues-in-javascript-30cfc49b01ee
class PriorityQueue {
  constructor() {
    this.values = [];
  }
  enqueue(value, priority) {
    let newNode = new Node(value, priority);
    this.values.push(newNode);
  
    let index = this.values.length - 1;
    const element = this.values[index];
    
    while(index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      const parent = this.values[parentIndex];
      
      if(element.priority >= parent.priority) break;
      this.values[parentIndex] = element;
      this.values[index] = parent;
      index = parentIndex;
    }
    return this.values;
  }
  dequeue() {
    const min = this.values[0];
    const end = this.values.pop();
    if(this.values.length > 0) {
      this.values[0] = end;
      
      let index = 0;
      const length = this.values.length;
      const element = this.values[0];
      
      while(true) {
        let leftIndex = 2 * index + 1;
        let rightIndex = 2 * index + 2;
        let leftChild, rightChild;
        let swap = null;
      
        if(leftIndex < length) {
          leftChild = this.values[leftIndex];
          if(leftChild.priority < element.priority) {
            swap = leftIndex;
          }
        }
        if(rightIndex < length) {
          rightChild = this.values[rightIndex];
          if((swap === null && rightChild.priority < element.priority) || (swap !== null && rightChild.priority < leftChild.priority)) {
            swap = rightIndex;
          }
        }
        if(swap === null) break;
        this.values[index] = this.values[swap];
        this.values[swap] = element;
        index = swap;
      }
    }
    return min;
  }
}
class Node {
  constructor(value, priority) {
    this.value = value;
    this.priority = priority;
  }
}
//END PriorityQueue

//BEGIN ASTAR
//this function calculates the weight for the A* pathfinding
function astar_heuristic(current, next, goal){
    if (next === goal){
        return current.distance(goal)
    }else{
        return 1*current.distance(next) + 1*current.distance(goal)
    }
}
//astar pathfinding function. returns array of points
function astar(navmesh, g){
    let queue = new PriorityQueue();
    let current = navmesh[1];
    let prev = null;
    let target = navmesh[0];
    for(let i=0;i<navmesh.length;i++){
        navmesh[i].weight = Infinity;
        navmesh[i].prev = null;
        navmesh[i].searched = false;
    }
    current.weight = 0;
    current.prev = null;
    
    while(current !== target && current !== undefined && current !== null){
        for(let i=0;i<current.adjacent.length;i++){
            
            if (current.adjacent[i].searched === false){
                
                //let w = current.weight + current.distance(current.adjacent[i]);
                let w = astar_heuristic(current, current.adjacent[i], navmesh[0]);
                if (current.adjacent[i].weight > w){
                    current.adjacent[i].weight = w;
                    current.adjacent[i].prev = current
                    queue.enqueue(current.adjacent[i], w);
                }
            }
        }
        //do the player seperately because it is seperate. Here, that is annoying!
        if (current.player !== null && current.player !== undefined){
            //let w = current.weight + current.distance(current.player);
            let w = astar_heuristic(current, current.player, navmesh[0]);
            if (current.player.weight > w){   
                current.player.weight = w;
                current.player.prev = current;
                queue.enqueue(current.player, w);
            }
        }
        current.searched = true;
        while(current !== null && current.searched !== false){
            let q = queue.dequeue();
            if (q !== undefined){
                current = q.value;
            }else{
                current = null;
                break;
            }
        }
    }
    //ok, so, now the target is found. Backtrace to get array of the path
    let backtrace = [];
    current = navmesh[0]
    while(current !== navmesh[1]){
        if (current === undefined || current === null || current.weight === Infinity || current.prev === null){
            return [];
        }
        backtrace.push(current);
        current = current.prev;
    }
    //invert the order of the backtrace
    let trace = []
    for(let i = backtrace.length-1; i>= 0;i--){
        trace.push(backtrace[i]);
    }
    return trace;
}
//END ASTAR

//BEGIN checkpath
/* Check if a path is valid, returning its weight. Invalid paths return Infinity*/
function checkpath(map, start, end){
    //get the dir and len
    let dir = end.clone();
    dir.subtract(start);
    let len = dir.length();
    dir.normalize();
    let checklen = 0;
    let point = start.clone();
    //step through path
    while(checklen < len){
        let x = Math.round(point.x);
        let y = Math.round(point.y);
        if (isInTilesE(x, y)){
            if (map[x][y] > 0){
                return Infinity
            }
        }else{
            return Infinity
        }
        point.add(dir);
        checklen++;
    }
    return len;
}
//END checkpath

//END Navigation

//BEGIN triggers
//interactable trigger volume class
class Trigger{
    constructor(scene, tx, ty, width, height, label, callback_enter, callback_leave){
        this.scene = scene;
        this.label = label;
        this.call_b = callback_enter;
        this.call_bl = callback_leave;
        this.call_bt = null;
        this.enable_timer = false;
        this.activ_timer = 0;
        this.activ_timer_max = -1;
        this.lastPair = null;
        this.enabled = true;
        //the collision rect
        this.pos = new Phaser.Math.Vector2(tx, ty);
        this.wpos = new Phaser.Math.Vector2(
            (tx*TILE_SIZE+width*(TILE_SIZE/2))*2, 
            (ty*TILE_SIZE+height*(TILE_SIZE/2))*2
        );
        this.rect = this.scene.matter.add.rectangle(
            this.wpos.x, 
            this.wpos.y, 
            width*32, 
            height*32, 
            {
                label: label,
                isSensor: true,
                isStatic: true,
                onCollideCallback: this.callback,
                onCollideEndCallback: this.callback_leave
            }
        )
        this.rect.Trigger = this;
        //add to scene
        this.id = this.scene.Interactables.push(this);
    }
    update(time, delta){
        if (
            this.enable_timer && this.activ_timer_max > 0 &&
            this.call_bt !== undefined && this.Trigger.enabled
        )
        {
            this.activ_timer += delta;
            if (this.activ_timer >= this.activ_timer_max){
                this.lastPair = null;
                this.enable_timer = false;
                this.activ_timer = 0;
                this.call_bt(this.lastPair, this.scene, this.scene.player);
            }
        }
    }
    setTimer(time, callback_timer){
        this.activ_timer_max = time * 1000;
        this.call_bt = callback_timer;
    }
    callback(pair){
        if ((pair.bodyA.label === "player" || pair.bodyB.label === "player") && this.Trigger.enabled){
            this.Trigger.lastPair = pair;
            this.Trigger.enable_timer = true;
            this.Trigger.activ_timer = 0;
            if (this.Trigger.call_b !== undefined){
                this.Trigger.call_b(pair, this.Trigger.scene, this.Trigger.scene.player);
            }
        }
    }
    callback_leave(pair){
        if ((pair.bodyA.label === "player" || pair.bodyB.label === "player") && this.Trigger.enabled){
            this.Trigger.lastPair = null;
            this.Trigger.enable_timer = false;
            this.Trigger.activ_timer = 0;
            if (this.Trigger.call_bl !== undefined){
                this.Trigger.call_bl(pair, this.Trigger.scene, this.Trigger.scene.player);
            }
        }
    }
    destroy(){
        //this.rect.destroy();
        this.enabled = false;
    }
}
//END triggers

//BEGIN helpers
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

/* Convert bounds from a flood fill to room size param, using a specific direction*/
function clampBounds(pos, bounds, dir){
    switch(dir){
        case 0: bounds.maxy = pos.y; break;
        case 1: bounds.minx = pos.x; break;
        case 2: bounds.miny = pos.y; break;
        case 0: bounds.maxx = pos.x; break;
        default: break;
    }
}
//END helpers

//BEGIN floodfill
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
function isInTilesE(x, y){
    //console.log("isInTiles: "+VecToString(pos));
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT){
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
//END floodfill

//BEGIN rooms
/* Checks if a room is valid, and if not, prints a nice error message.*/
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

/* This method builds room data into the map, including logging new room positions.*/
function buildRoom(map, pos, bounds, dir, depth, navmesh){
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
    //add this door and room pos to the navmesh data
    navmesh.push(pos.clone());
    let center = new Phaser.Math.Vector2(
        bounds.minx + Math.floor((bounds.maxx-bounds.minx)/2),
        bounds.miny + Math.floor((bounds.maxy-bounds.miny)/2),
    );
    navmesh.push(center)
    
    //recursively generate more rooms
    if (depth < ROOM_DEPTH){
        let count = (Math.random()*8)+1
        for (let i = 0; i < count;i++){
            let dirOff = Math.floor(Math.random()*3)-1;
            if (dirOff == 2){dirOff = 1;}
            let d2 = turn(dir, dirOff);
            let newOrigin = new Phaser.Math.Vector2(0, 0);
            
            if (d2%2 == 0){
                //top / bottom wall
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
                //left and right walls
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
            buildRoom(map, newOrigin.clone(), newBounds, d2, depth+1, navmesh);
        }
    }
    
    //carve out the door
    map[pos.x][pos.y] = 0;
    return true
}

/* Add doors to the rooms by finding walls that should have doors*/
function addDoors(map, navmesh){
    //completely ignore the surrounding border, its pointless
    for (let x = 1;x < MAP_WIDTH-1; x++){
        for (let y = 1;y<MAP_HEIGHT-1;y++){
            //
            if (map[x][y] > 1){
                if (
                    (map[x+1][y]==0 && 
                    map[x-1][y]==0) ||
                    (map[x][y+1]==0 && 
                    map[x][y-1]==0)
                ){
                    if (Math.random() > 0.9){
                        map[x][y] = 0;
                        navmesh.push(new Phaser.Math.Vector2(x,y));
                    }
                }
            }
        }
    }
}
//END rooms


class MyScene extends Phaser.Scene {
    constructor() {
        super();
        //BEGIN controls
        this.left  = null;
        this.right = null;
        this.up    = null;
        this.down  = null;
        this.Kbutton = null;
        this.isKdown = false;
        //END controls
        
        //BEGIN player
        this.speed = 3;
        this.player = null;
        this.playing = true;
        //END player
        
        //BEGIN enemy
        this.espeed = 2;
        this.espeed_additional = 2/KEYCOUNT;
        this.enemy = null;
        this.enemy_prev_first_navpoint = null;
        this.enemy_navarray = null;
        //END enemy
        
        //BEGIN Interactables
        this.Interactables = [];
        this.keys = [];
        this.keys_found = 0;
        //END Interactables
        
        //BEGIN map
        this.mapdata = null;
        this.doorlocs = [];
        this.map = null;
        this.tiles = null;
        this.layer_floor = null;
        this.layer_props = null;
        this.layer_wall = null;
        //END map
        
        //BEGIN navmesh
        this.navmesh = [];
        this.navGraphics = null;
        //END navmesh
        
        //BEGIN sounds
        this.sound_key = null;
        this.sound_die = null;
        //END sounds
    }
    
    preload() {
        this.load.image("tiles", "assets/Tilemap.png");
        this.load.image("player", "assets/Player.png");
        this.load.image("key", "assets/Key.png");
        this.load.tilemapTiledJSON("map", "assets/mapTiles.json");
        this.load.spritesheet("player_animated", "assets/Player_Animated.png", {frameWidth: 16, frameHeight: 16});
        
        this.load.audio("key_click", "assets/Key_Click.wav");
        this.load.audio("wilhelm_scream", "assets/Wilhelm_Scream.ogg");
    }
    
    create() {
        //BEGIN input
        this.input.keyboard.addCapture('W,S,A,D,SPACE');
        this.left  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.up    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.down  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        
        this.Kbutton  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        //END input
        
        //BEGIN map creation
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
        //build the navigational mesh
        this.buildNavMesh();
        //END map creation
        
        //BEGIN key placement
        for (let i=0;i<KEYCOUNT;i++){
            let pos = new Phaser.Math.Vector2(0,0);
            let search = true;
            while(search){
                let rx = Math.floor(Math.random() * MAP_WIDTH) + 1
                if (rx >= MAP_WIDTH-1){rx = MAP_WIDTH-1;}
                let ry = Math.floor(Math.random() * MAP_HEIGHT) + 1
                if (ry >= MAP_HEIGHT-1){ry = MAP_HEIGHT-1;}
                if (this.mapdata[rx][ry] == 0){
                    search = false;
                    pos.setTo(rx, ry);
                }
            }
            this.keys[i] = new Trigger(this, pos.x, pos.y, 1, 1, "Key1", 
                function(pair, scene, player){
                    this.key_image.destroy();
                    this.destroy();
                    this.scene.keys_found++;
                    this.scene.sound_key.play();
                    this.scene.espeed += this.scene.espeed_additional; //speed up the enemy!
                },
            );
            this.keys[i].key_image = this.add.image(
                this.keys[i].wpos.x, 
                this.keys[i].wpos.y, 
                "key"
            );
        }
        //END key placement
        
        //BEGIN Player Animations
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player_animated', {frames: [0,1,2,3]}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_forward',
            frames: this.anims.generateFrameNumbers('player_animated', {frames:[4,5,6,7]}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_back',
            frames: this.anims.generateFrameNumbers('player_animated', {frames:[8,9,10,11]}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_right',
            frames: this.anims.generateFrameNumbers('player_animated', {frames:[12,13,14,15]}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'walk_left',
            frames: this.anims.generateFrameNumbers('player_animated', {frames:[16,17,18,19]}),
            frameRate: 10,
            repeat: -1
        });
        //END Player Animations
        
        //BEGIN player and camera
        //setup player
        let playerImage = this.add.sprite(
            25*TILE_SIZE*2, 
            2*TILE_SIZE*2
        ).setScale(2);
        playerImage.play("idle")
        
        this.player = this.matter.add.gameObject(playerImage);
        this.player.setScale(3);
        this.player.setFixedRotation();
        this.player.body.label = "player";
        this.player.setExistingBody(this.player.body);
        
        //setup camera
        this.cameras.main.setBounds(
            -TILE_SIZE, 
            -TILE_SIZE, 
            this.map.widthInPixels*2 + 2* TILE_SIZE, 
            this.map.heightInPixels*2 + 2 * TILE_SIZE
        );
        this.cameras.main.startFollow(this.player);
        //END player and camera
        
        //BEGIN enemy
        let pos = new Phaser.Math.Vector2(0,0);
        let search = true;
        while(search){
            let rx = Math.floor(Math.random() * MAP_WIDTH) + 1
            if (rx >= MAP_WIDTH-1){rx = MAP_WIDTH-1;}
            
            let ry = Math.floor(Math.random() * MAP_HEIGHT) + 1
            if (ry >= MAP_HEIGHT-1){ry = MAP_HEIGHT-1;}
            
            if (this.mapdata[rx][ry] == 0){
                search = false;
                pos.setTo(rx, ry);
            }
            
        }
        this.enemy = this.matter.add.image(
            pos.x*TILE_SIZE*2, 
            pos.y*TILE_SIZE*2, 
            "player",
            null,
            {
                isSensor: true, 
                onCollideCallback: function(pair){
                    if (pair.bodyA.label === "player" || pair.bodyB.label === "player") {
                        this.gameObject.scene.lose();
                    }
                }
            }
        );
        this.enemy.setScale(1.5);
        this.enemy.setFixedRotation();
        //END enemy
        
        //BEGIN random stuff
        //navigational graphics TODO: remove this
        this.navGraphics = this.add.graphics();
        
        //build sound
        this.sound_key = this.sound.add("key_click");
        this.sound_die = this.sound.add("wilhelm_scream");
        
        //build collision information for map
        this.map.setCollisionFromCollisionGroup(true, true);
        this.matter.world.convertTilemapLayer(this.layer_wall);
        //END random stuff
        
        
    }
    
    generate(){
        this.mapdata = [];
        let walls = this.mapdata;
        //BEGIN map precreation
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
        //END map precreation
        
        //BEGIN map generation
        //place the initial room
        let dir = 2;
        let p = new Phaser.Math.Vector2(25, 0);
        let bounds = FloodTraceRect(walls, p.clone(), {}, {});
        buildRoom(walls, p.clone(), bounds, dir, 0, this.doorlocs);
        //replace that empty wall on the border
        walls[25][0] = 2
        //add extra doors
        addDoors(walls, this.doorlocs)
        //END map generation
        
        //BEGIN map filling
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
        //END map filling
    }
    
    buildNavMesh(){
        this.navmesh[0] = new Phaser.Math.Vector2(0,0);
        this.navmesh[1] = new Phaser.Math.Vector2(0,0);
        this.navmesh[0].adjacent = [];
        this.navmesh[1].adjacent = [];
        this.navmesh[1].player = null;
        
        
        for(let i=1;i<this.doorlocs.length;i++){
            let tp = this.doorlocs[i];
            if (tp.adjacent === undefined){
                tp.adjacent = []
            }//build adjacency list
            tp.player = null; //player's node is seperate so its easier to change.
            let px = (tp.x*TILE_SIZE + TILE_SIZE/2)*2;
            let py = (tp.y*TILE_SIZE + TILE_SIZE/2)*2;
            //g.fillCircle(px, py, TILE_SIZE/2);
            
            for (let j=i+1;j<this.doorlocs.length;j++){
                let op = this.doorlocs[j]
                let rx = (op.x*TILE_SIZE + TILE_SIZE/2)*2;
                let ry = (op.y*TILE_SIZE + TILE_SIZE/2)*2;
                if (checkpath(this.mapdata, tp, op) !== Infinity){
                    //g.lineBetween(px, py, rx, ry);
                    tp.adjacent.push(op);
                    if (op.adjacent === undefined){
                        op.adjacent = []
                    }
                    op.adjacent.push(tp);
                }

            }
            this.navmesh[i+1] = tp; //this.navmesh[1] is the enemy, this.navmesh[0] is the player!
        }
        
    }
    
    update(time, delta) {
        //BEGIN playing check
        if (!this.playing){
            return;
        }
        //END playing check
        
        //BEGIN navmesh debug controls
        if (this.Kbutton.isDown){
            if (!this.isKdown){
                ENABLE_NAVGRAPHICS = !ENABLE_NAVGRAPHICS;
                this.navGraphics.clear();
            }
            this.isKdown = true;
        }else{
            this.isKdown = false;
        }
        
        //END navmesh devug controls
        
        //BEGIN Player Controls
        let v = new Phaser.Math.Vector2(0,0);
        if (this.left.isDown) {v.x -= this.speed;}
        if (this.right.isDown){v.x += this.speed;}
        if (this.up.isDown)   {v.y -= this.speed;}
        if (this.down.isDown) {v.y += this.speed;}
        this.player.setVelocity(v.x, v.y);
        if (v.y < 0){
            this.player.play("walk_forward", true);
        }else if (v.y > 0){
            this.player.play("walk_back", true);
        }else if (v.x < 0){
            this.player.play("walk_left", true);
        }else if(v.x > 0){
            this.player.play("walk_right", true);
        }else{
            this.player.play("idle", true);
        }
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
        //END Player Controls
        
        //BEGIN win condition
        if (this.keys_found >= 5){
            this.win();
        }
        //END win condition
        
        //BEGIN navigational stuff
        
        //BEGIN calculate navmesh
        if (ENABLE_NAVGRAPHICS){this.navGraphics.clear();}
        
        //set the player and enemy poitions in the navmesh
        this.navmesh[0].setTo(
            (this.player.x / TILE_SIZE / 2) - 0.5, 
            (this.player.y / TILE_SIZE / 2) - 0.5
        );
        this.navmesh[1].setTo(
            (this.enemy.x / TILE_SIZE / 2) - 0.5, 
            (this.enemy.y / TILE_SIZE / 2) - 0.5
        )
        //trace the path from each to the player.
        for (let i = 1;i<this.navmesh.length;i++){
            if (checkpath(this.mapdata, this.navmesh[i], this.navmesh[0]) !== Infinity){
                this.navmesh[i].player = this.navmesh[0];
            }else{
                this.navmesh[i].player = null;
            }
        }
        //trace the path from the enemy to each (NOTE: player is not neede to be in seperate varaible because adjacency list is completely cleared.)
        this.navmesh[1].adjacent = []; //reset adjacency list
        for (let i=2;i<this.navmesh.length;i++){
            if (checkpath(this.mapdata, this.navmesh[1], this.navmesh[i]) !== Infinity){
                this.navmesh[1].adjacent.push(this.navmesh[i]);
            }
        }
        
        if (ENABLE_NAVGRAPHICS){
            this.navGraphics.lineStyle(1, 0x008f00);
            this.navGraphics.fillStyle(0x00ffff);
            for(let i=0;i<this.navmesh.length;i++){
                let p1 = this.navmesh[i].clone();
                p1.x = (p1.x*TILE_SIZE + TILE_SIZE/2)*2;
                p1.y = (p1.y*TILE_SIZE + TILE_SIZE/2)*2;
                this.navGraphics.fillCircle(p1.x, p1.y, TILE_SIZE/4);
                
                for (let j=0;j<this.navmesh[i].adjacent.length;j++){
                    let p2 = this.navmesh[i].adjacent[j].clone();
                    p2.x = (p2.x*TILE_SIZE + TILE_SIZE/2)*2;
                    p2.y = (p2.y*TILE_SIZE + TILE_SIZE/2)*2;
                    this.navGraphics.lineBetween(p1.x, p1.y, p2.x, p2.y);
                }
                if (this.navmesh[i].player !== null && this.navmesh[i].player !== undefined){
                    let p2 = this.navmesh[i].player.clone();
                    p2.x = (p2.x*TILE_SIZE + TILE_SIZE/2)*2;
                    p2.y = (p2.y*TILE_SIZE + TILE_SIZE/2)*2;
                    this.navGraphics.lineBetween(p1.x, p1.y, p2.x, p2.y);
                }
            }
        }
        //END calculate navmesh
        
        //BEGIN path trace
        //perform A* pathfinding
        let trace = astar(this.navmesh, this.navGraphics);
        
        //graphical drawing of the new path
        if (ENABLE_NAVGRAPHICS){
            this.navGraphics.lineStyle(1, 0x8f0000);
            this.navGraphics.fillStyle(0x0000ff);
            for(let i=0;i<trace.length;i++){
                let p1 = trace[i].clone();
                p1.x = (p1.x*TILE_SIZE + TILE_SIZE/2)*2;
                p1.y = (p1.y*TILE_SIZE + TILE_SIZE/2)*2;
                this.navGraphics.fillCircle(p1.x, p1.y, TILE_SIZE/6);
                if (i > 0){
                    let p2 = trace[i-1].clone();
                    p2.x = (p2.x*TILE_SIZE + TILE_SIZE/2)*2;
                    p2.y = (p2.y*TILE_SIZE + TILE_SIZE/2)*2;
                    this.navGraphics.lineBetween(p2.x, p2.y, p1.x, p1.y);
                }
            }
        }
        
        //use the new trace path or the old one? 
        //This prevents "path jittering" and the enemy getting stuck.
        if (
            this.enemy_prev_first_navpoint !== null && 
            trace[1] !== undefined && 
            this.enemy_navarray !== null && 
            this.enemy_navarray[0] !== undefined
        ){
            if (
                (trace[1].x !== this.enemy_prev_first_navpoint.x || 
                trace[1].y !== this.enemy_prev_first_navpoint.y) && 
                (trace[1].x !== this.enemy_navarray[0].x || 
                trace[1].y !== this.enemy_navarray[0].y)
            ){
                this.enemy_navarray = trace;
            }
        }else{
            this.enemy_navarray = trace;
        }
        
        //move the enemy along the trace path
        if (this.enemy_navarray.length > 0){
            //this whole while loop deal lets the enemy teleport to the closest offscreen vertex to the player. Thus, he will never get too far behind.
            let i = -1;
            let dir = null;
            do {
                i++
                dir = this.enemy_navarray[i].clone();
                dir.x = (dir.x*TILE_SIZE + TILE_SIZE/2)*2;
                dir.y = (dir.y*TILE_SIZE + TILE_SIZE/2)*2;
            }while(!this.isPointVisibileV(dir));
            if (i > 0){
                let pos = this.enemy_navarray[i-1].clone();
                pos.x = (pos.x*TILE_SIZE + TILE_SIZE/2)*2;
                pos.y = (pos.y*TILE_SIZE + TILE_SIZE/2)*2;
                this.enemy.setPosition(pos.x, pos.y);
            }
            
            dir.subtract(new Phaser.Math.Vector2(this.enemy.x, this.enemy.y));
            dir.normalize();
            dir.scale(this.espeed);
            this.enemy.setVelocity(dir.x, dir.y);
            //set the remembered first point
            this.enemy_prev_first_navpoint = this.enemy_navarray[i].clone();
        }
        //END path trace
        
        //END navigational stuff
    }
    
    win(){
        if (!this.playing){return;}
        let winText = this.add.text(300, 128, "You Win!", {
            fontSize: '40px',
            padding: {x: 10, y: 5},
            fill: "#ffffff",
            backgroundColor: "#000000"
        });
        winText.setScrollFactor(0);
        this.player.setVelocity(0, 0);
        this.enemy.setVelocity(0, 0);
        this.playing = false;
    }
    
    lose(){
        if (!this.playing){return;}
        let winText = this.add.text(290, 128, "You Lose", {
            fontSize: '40px',
            padding: {x: 10, y: 5},
            fill: "#ffffff",
            backgroundColor: "#000000"
        });
        winText.setScrollFactor(0);
        this.player.setVelocity(0, 0);
        this.enemy.setVelocity(0, 0);
        this.playing = false;
        this.sound_die.play();
    }
    
    isPointVisibileV(point){
        let cam = this.cameras.main;
        if (
            point.x > cam.scrollX + (cam.displayWidth) || 
            point.x < cam.scrollX || 
            point.y > cam.scrollY + (cam.displayHeight) || 
            point.y < cam.scrollY 
        ){
            return false;
        }else{
            return true;
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
        /*arcade: {
            debug: true,
            gravity: {x:0,y:0}
        },*/
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
