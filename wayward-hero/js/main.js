//BEGIN basic stuff
const DIV = document.getElementById('game');
function print(text){
    //t = text.replace(/\s[*][*]/g, " <b>");
    //t = t.replace(/[*][*]\s/g, "</b> ");
    //t = t.replace(/\s[*]/g, " <em>");
    //t = t.replace(/[*]\s/g, "</em> ");
    let t = text.replace(/#C=/g, "<span style=\"color:");
    t = t.replace(/#C!/g, "</span>");
    t = t.replace(/#C/g, "\">");
    t = t.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
    t = t.replace(/\n/g, "<br>");
    t = t.replace(/_/g, "&nbsp;");
    //TODO: add length limits, removing elements by paragraph
    //TODO: add parsing to allow auto-insert of span elements to color text
    DIV.innerHTML += ("<p>" + t + "</p>");
}
print("Beginning game ... ");
function findword(args, word, startindex){
    if (startindex === undefined){startindex=0;}
    for(let i=startindex;i<args.length;i++){
        if (args[i] === word){
            return i;
        }
    }
    return -1;
}
function getDictElements(args, dict, startindex){
    if (startindex === undefined){startindex=0;}
    elms = [];
    for(let i=startindex;i<args.length;i++){
        if (dict[args[i]] !== undefined){
            elms.push(dict[args[i]]);
        }
    }
    return elms
}
function valid(obj){
    return (obj !== undefined && obj !== null);
}
function choose(list){
    return list[Math.floor(Math.random() * list.length)];
}
function chance(i){
    return (Math.floor(Math.random() * i) === 0)?true:false
}
function rand(a, b){
    if (a === undefined){
        return Math.random();
    }else if (b === undefined){
        return Math.floor(Math.random * a);
    }else{
        b++;
        return (Math.floor(Math.random() * (b-a))) + a;
    }
}
function depluralize(s){
    return s.replace(/s\b/, "");
}
function objEqual(a, b){
    JSON.stringify(a); //these check for looping structures
    JSON.stringify(b); //these check for looping structures
    if (typeof a === typeof b){
        if (typeof a === "object"){
            let fla = Object.keys(a);
            let flb = Object.keys(b);
            if (fla.length !== flb.length){return false;}
            for(let i=0;i<fla.length;i++){
                if (b[fla[i]] === undefined){return false;}
                if (!objEqual(a[fla[i]], b[fla[i]])){return false;}
            }
            return true;
        }else{
            return (a === b);
        }
    }else{
        return false;
    }
}
function removeIndex(array, index){
    if (index < 0 || index >= array.length){return undefined;}
    let rval = array[index];
    array.splice(index, 1);
    return rval
}
function clearArray(array){
    let i = array.length
    array.splice(0, i);
}
//closure-operating counter
function counter(){
    let i = 0;
    return function(){
        return i++;
    }
}
let UID = counter(); //UID is a function. Each time it is called, it returns a new, incrementally higher number.
//END basic stuff

//BEGIN types
//weaponRanged, healing, damage,
function USE_VOID_FUNC(item, user){
    print("This item cannot be used like this!");
    return item.count;
}
function USE_EAT_FUNC(item, user){
    let hp = item.getFlag("healing");
    if (hp !== undefined){
        hp += user.hp;
        if (hp > user.getMaxHP()){
            hp = user.getMaxHP();
        }
        print("you eat the " + item.name + ", gaining " + (hp-user.hp) + " hp.");
        user.hp = hp;
        return item.count - 1;
    }else{
        print("unable to eat the " + item.name);
    }
    return item.count;
    
}
class Item{
    constructor(name, count, take_msg, drop_msg, look_msg, flags){
        this.name = (valid(name) ? name : "Unknown-Item");
        this.count = (valid(count) ? count : 1);
        this.take_msg = (valid(take_msg) ? take_msg : "You take a "+this.name+".");
        this.drop_msg = (valid(drop_msg) ? drop_msg : "You drop a "+this.name+".");
        this.look_msg = (valid(look_msg) ? look_msg : "You tool at a generic "+this.name+".");
        //other stuff
        this.flags = (valid(flags) ? flags : {});
        //management stuff
        this.currowner = null;
        this.use_func = USE_VOID_FUNC;
    }
    //BEGIN Item Contents
    clone(){
        let c = new Item(this.name, this.count, this.take_msg, this.drop_msg, this.look_msg);
        c.setUseFunction(this.use_func);
        //flags is manually copied so it is not the same object!
        let f = this.getFlagsList();
        for(let i=0;i<f.length;i++){
            c.setFlag(f[i], this.getFlag(f[i]));
        }
        return c;
    }
    equals(other){
        if (other.name !== this.name){return false;}
        return objEqual(this.flags, other.flags);
    }
    getFlag(flag){
        if (this.flags[flag] !== undefined && this.flags[flag] !== null){
            return this.flags[flag];
        }else{
            return undefined;
        }
    }
    setFlag(flag, value){
        this.flags[flag] = value;
    }
    getFlagsList(){
        return Object.keys(this.flags);
    }
    take(count){
        if (this.count > count){
            this.count -= count;
            let c= this.clone();
            c.count = count;
            return c;
        }else{
            //remove from current owner
            if (this.currowner !== null){
                this.currowner[this.name] = null;
            }
            this.currowner = null;
            return this;
        }
    }
    use(user){
        console.log(this);
        return this.use_func(this, user);
    }
    setUseFunction(func){
        if (typeof func === "function"){
            this.use_func = func;
        }else{
            consle.log("invalid param to setUseFunction in Item");
            console.log(func);
        }
    }
    toString(){
        let s= ""+this.name+" (" + this.count + ")";
        if (this.flags.consumable){s+= " Consumable";}
        if (this.flags.damage){s+= " Damageing for " + this.flags.damage;}
        if (this.flags.healing){s+= " Healing for " + this.flags.healing;}
        return s;
    }
    //END Item Contents
}

class Inventory{
    constructor(){
        this.items = [];
    }
    //BEGIN Inventory Contents
    getCount(name){
        //get the name from item if item is passed
        if (typeof name === "object"){
            name = name.name;
        }
        let c = 0;
        for(let i=0;i<this.items.length;i++){
            if (this.items[i].name === name){
                c += this.items[i].count;
            }
        }
        return c;
    }
    getIndex(name){
        //get the name from item if item is passed
        if (typeof name === "object"){
            name = name.name;
        }
        for(let i=0;i<this.items.length;i++){
            if (this.items[i].name === name){
                return i;
            }
        }
        return -1;
    }
    addItem(item){
        for(let i=0;i<this.items.length;i++){
            if (this.items[i].equals(item)){
                this.items[i].count += item.count;
                return;
            }
        }
        this.items.push(item);
    }
    takeItem(name, count){
        //get the name from item if item is passed
        if (typeof name === "object"){
            name = name.name;
        }
        let currHiCount = 0;
        let currHiIndex = -1;
        for(let i=0;i<this.items.length;i++){
            if (this.items[i].name === name){
                if (this.items[i].count == count){
                    //remove this item
                    let p = removeIndex(this.items, i);
                    return p;
                }else if (this.items[i].count >= count){
                    //remove some of these
                    let p = this.items[i].clone();
                    p.count = count;
                    this.items[i].count -= count;
                    return p;
                }else{
                    if (this.items[i].count > currHiCount){
                        currHiCount = this.items[i].count;
                        currHiIndex = i;
                    }
                }
            }
        }
        if (currHiIndex === -1){
            return null;
        }else{
            //remove highest count item and return it.
            let p = removeIndex(this.items, currHiIndex);
            return p;
        }
    }
    setCount(index, count){
        if (typeof index === "object"){
            index = this.getIndex(index.name);
        }else if (typeof index === "string"){
            index = this.getIndex(index);
        }
        if (index < 0 || index >= this.items.length){
            return;
        }
        if (count === 0){
            //remove
            removeIndex(this.items, index);
        }else{
            this.items[index].count = count;
        }
    }
    getItem(index){
        if (typeof index === "number"){
            if (index >= 0 && index < this.items.length){
                return this.items[index];
            }else{
                return undefined;
            }
        }else{
            let name = ""
            if (typeof index === "object"){
                name = index.name;
            }else if(typeof index === "string"){
                name = index;
            }else{
                return undefined;
            }
            for(let i=0;i<this.items.length;i++){
                if (this.items[i].name === name){
                    return this.items[i];
                }
            }
            return undefined
        }
    }
    toString(){
        var s = "";
        for(let i=0;i<this.items.length;i++){
            s += this.items[i].toString();
            if (i+1 < this.items.length){
                s += "\n";
            }
        }
        return s
    }
    searchFor(str){
        names = [];
        for(let i=0;i<this.items.length;i++){
            if (this.items[i].name.search(str) !== -1){
                names.push(this.items[i].name);
            }
        }
        return names;
    }
    //END Inventory Contents
}

//BEGIN battlefield
let BATTLEFIELD = [];
let COMBAT_MODE = false;
let NEW_COMBAT = false;
//END battlefield
//hostile
class Creature{
    constructor(name, hp, ac, level, stats, flags){
        this.uid = UID(); //generate each creature a unique ID
        this.name = (valid(name) ? name : "creature");
        this.level = (valid(level) ? level : 1);
        this.stats = {};
        this.setStats(stats);
        this.hp = (valid(hp) ? hp : this.getMaxHP());
        if (this.hp < 0){this.hp = this.getMaxHP();}
        this.ac = (valid(ac) ? ac : 10+this.stats.DEX);
        this.inventory = new Inventory();
        this.heldIndex = -1; //nothing held
        this.lastAttacker = null;
        this.flags = (valid(flags)?flags:{});
        this.isPlayer = false;
    }
    //BEGIN Creature Contents
    equals(other){
        return this.uid === other.uid;
    }
    getFlag(flag){
        if (this.flags[flag] !== undefined && this.flags[flag] !== null){
            return this.flags[flag];
        }else{
            return undefined;
        }
    }
    setFlag(flag, value){
        this.flags[flag] = value;
    }
    getFlagsList(){
        return Object.keys(this.flags);
    }
    setStats(stats){
        if (valid(stats)){
            this.stats.STR = (valid(stats.STR) ? stats.STR : 10);
            this.stats.DEX = (valid(stats.DEX) ? stats.DEX : 10);
            this.stats.CON = (valid(stats.CON) ? stats.CON : 10);
        }else{
            this.stats.STR = 10;
            this.stats.DEX = 10;
            this.stats.CON = 10;
        }
    }
    makeCheck(type){
        if (type === "STR" || type === "DEX" || type === "CON"){
            return rand(1, 20)+ this.stats[type];
        }else{
            console.log("INVALID CHECK: " + type);
            return 0;
        }
    }
    getProfBonus(){
        return Math.ceil(this.level/5) + 1;
    }
    getMaxHP(){
        return this.level * 20;
    }
    attack(target){
        let attack = {atk:0,dmg:0,attacker:this,text:""}
        if (this.heldIndex >= 0){
            //we have an item
            let stat = "STR";
            if (this.inventory.items[this.heldIndex].getFlag("weaponRanged") !== undefined){
                stat = "DEX"
            }
            attack.atk = this.makeCheck(stat) + this.getProfBonus();
            attack.dmg += this.stats[stat];
            let d = this.inventory.items[this.heldIndex].getFlag("damage")
            if (d !== undefined){
                attack.dmg += rand(1, d);
            }
            attack.text = "" + this.inventory.items[this.heldIndex].name;
        }else{
            attack.atk = this.makeCheck("STR");
            attack.dmg = 1;
            attack.text = "fist";
        }
        target.recieveAttack(attack)
    }
    recieveAttack(attack){
        console.log(attack);
        if (attack.atk >= this.ac){
            this.hp -= attack.dmg;
            this.lastAttacker = attack.attacker;
            console.log("here")
            print("" + attack.attacker.name + " attacked " + this.name + " with " + attack.text + " for " + attack.dmg + " damage.");
            if (this.hp <= 0){
                if (attack.attacker.isPlayer){
                    player.xp += player.xpPerKill;
                    if (player.xp >= player.maxXP){
                        //PLAYER LEVEL UP!
                        player.level++;
                        player.hp = player.getMaxHP();
                        player.ac = 10 + player.level;
                        player.xp = 0;
                    }
                }
                this.die();
            }
        }else{
            print("" + attack.attacker.name + " attacked " + this.name + " with " + attack.text + " but missed.");
        }
    }
    die(){
        console.log("Creature Died: " + this.name);
        this.hp = 0;
        this.removeFromBattlefield();
        for(let i=0;i<this.inventory.items.length;i++){
            CURRENT_WORLDCHUNK.inventory.addItem(this.inventory.getItem(i))
        }
    }
    isAlive(){
        return (this.hp > 0);
    }
    addToBattlefield(){
        //first, check if already in battefield
        for (let i=0;i<BATTLEFIELD.length;i++){
            if (this.equals(BATTLEFIELD[i])){
                return;
            }
        }
        BATTLEFIELD.push(this);
    }
    removeFromBattlefield(){
        for (let i=0;i<BATTLEFIELD.length;i++){
            if (this.equals(BATTLEFIELD[i])){
                removeIndex(BATTLEFIELD, i);
            }
        }
        return; //returns all the way down here in case somehow there are multiple copies
    }
    toString(){
        let s = "Name: "+this.name + "\tLevel: " + this.level + "" +
            "\nHP: "+ this.hp + "\tAC: "+ this.ac +
            "\nStats: STR: "+ this.stats.STR + 
            "\tDEX: " + this.stats.DEX + "\tCON: " + this.stats.CON +
            "\nInventory:\n" + this.inventory.toString();
        return s;
    }
    //END Creature Contents
}

//BEGIN world
let WORLD = []
for(let x = 0;x<128;x++){
    WORLD[x] = [];
}
let CURRENT_WORLDCHUNK = null;

const ENVIROMENT_LIST = [
    "flatlands", 
    "hills", 
    "mountains", 
    "wetlands", 
    "tundra", 
    "desert", 
    "savana", 
    "lakeshore"
];
const ENEMY_NAME_LIST = ["skeleton", "goblin", "bandit", "brigand", "jelly", "kobald", "gnoll", "spirit", "disaster-on-legs"];
const MELEE_WEAPON_NAME_LIST = ["spear", "sword", "axe", "knife", "dagger", "broadsword", "rapier", "claymore", "dirk", "greataxe", "greatsword", "pike", "halberd"];
//END world

class WorldChunk{
    constructor(px, py){
        //BEGIN location
        px = px%128;
        py = py%128;
        if (WORLD[px][py] !== null && WORLD[px][py] !== undefined){
            new Error("World part at " + px + ", " + py + " is already generated.")
        }
        this.coords = {x:px,y:py};
        //END location
        
        //BEGIN enviroment
        this.enviroment = choose(ENVIROMENT_LIST);
        this.features = {
            trees: chance(2),
            rocks: chance(2),
            herbs: chance(3),
            animals: chance(3),
            structures: chance(7),
            enemies: chance(8)
        }
        //specific filtering
        if (this.enviroment === "desert" && this.features.trees){
            this.features.trees = false;
        }
        //END enviroment
        
        //BEGIN items
        this.inventory = new Inventory();
        
        if (this.features.trees){
            this.inventory.addItem(new Item("wood", rand(1, 5)));
            //TODO: harvestable
        }
        if (this.features.rocks){
            //new Item("rock", rand(1, 5)).addToInventory(w.items);
            this.inventory.addItem(new Item("stone", rand(1, 5)));
        }
        if (this.features.herbs){
            let item = new Item("herbs", rand(1, 3), null, null, null, {healing:2, edible:true})
            item.setUseFunction(USE_EAT_FUNC)
            this.inventory.addItem(item);
        }
        
        //END items
        
        //BEGIN creatures
        this.creatures = []
        if (this.features.animals){
            //TODO: critters!
        }
        
        if (this.features.enemies){
        //if (true){
            let s = rand(1, 4);
            for (let i=0;i<s;i++){
                this.creatures.push(this.getRandomEnemy());
            }
        }
        
        //END creatures
        //TODO: More Generation!!!
        
        //send to the WORLD global
        WORLD[px][py] = this;
    }
    
    getRandomEnemy(){
        let name = choose(ENEMY_NAME_LIST);
        let level = rand(1,player.level);
        let hp = level*20;
        hp = rand(hp/4, hp);
        let ac = 10 + rand(level/2, level);
        let c = new Creature(
            name, 
            hp, 
            ac, 
            level, 
            {STR:rand(1, 4),DEX:rand(1, 4),CON:rand(1, 4)},
            {hostile:true}
        )
        let item = this.getRandomWeapon();
        c.inventory.addItem(item);
        let index = c.inventory.getIndex(item.name)
        c.heldIndex = index;
        return c;
    }
    
    getRandomWeapon(){
        let n = choose(MELEE_WEAPON_NAME_LIST);
        let item = new Item(n, 1);
        item.setFlag("damage", rand(3, 8));
        return item;
    }
    
    toString(){
        let s = "An area of " + this.enviroment;
        if (this.features.trees || this.features.rocks){
            s += " with some ";
            if (this.features.trees){
                s += "trees"
                if (this.features.rocks){
                    s += " and "
                }
            }
            if (this.features.rocks){
                s += "rocks"
            }
            s += " around."
        }else{
            s += ".";
        }
        if (this.features.herbs || this.features.animals){
            s += " There are "
            if (this.features.herbs){
                s += "various herbs growing nearby"
                if (this.features.animals){
                    s += " and "
                }
            }
            if (this.features.animals){
                s += "various animals living in the area"
            }
            s += "."
        }
        
        if (this.inventory.items.length !== 0){
            s += "<br>You spot some items in the area:<br>" + this.inventory.toString();
        }
        
        return s;
    }
}

//END types

//BEGIN Global Stuff

const HELP_STR = "Commands are phrased as basic imperitive sentances, such as <b>go north</b>. There are a number of verbs that are recognized, namely:<ul><li><b>go, move, walk, travel</b> for movement.</li><li><b>look, examine, perceive, view, find, search</b> for looking around and searching.</li><li><b>take, pickup, pick, grab, gather</b> for collecting items</li><li><b>draw, hold</b> for selecting the wielded item</li><li><b>attack, hit</b> for attacking enemies</li><li><b>use, eat, burn, ignite, light</b> for using and consuming items</li><li><b></b></li></ul>Besides these, there are a few special commands, prefixed with a \"!\". Some of these are for development debug, others are for players.<ul><li><b>!help</b>  prints this help message.</li><li><b>!clean</b> and <b>!clear</b> clear the screen</li><li><b>!name [newname]</b> sets the player name</li><li><b>!whoami</b> prints the player's information</li><li><b>!inv</b> and <b>!inventory</b> prints the player's inventory</li><li><b>!details</b> prints the details of the enviroment. This is intended for debugging.</li><li><b>!battle</b> prints the battlefield, as if combat was underway. It is intended for debugging.</li></ul>";

//BEGIN player
let player = new Creature(
    "Burk", 
    -1, 
    12, 
    1,
    {
        STR: Math.floor(Math.random()*4)+2,
        DEX: Math.floor(Math.random()*4)+2,
        CON: Math.floor(Math.random()*4)+2,
    }
)
player.xp = 0;
player.maxXP = 2;
player.xpPerKill = 1;
player.isPlayer = true;
{
    //scope so these are not global
    let sword = new Item("sword", 1);
    sword.setFlag("damage", 10);
    player.inventory.addItem(sword);
}

//END player

//BEGIN extra dicts
const dictDirections = {
    north:0,
    east:1,
    south:2,
    west:3,
    up:0,
    right:1,
    down:2,
    left:3,
}

const dictFindables = {
    food:"animals herbs",
    game:"animals",
    animals:"animals",
    friends:"animals",
    vegtables:"herbs",
    herbs:"herbs",
    plants:"herbs",
    edible:"animals herbs",
    medicine:"herbs",
    wood:"trees",
    trees:"trees",
    tree:"trees",
    bushes:"trees",
    bush:"trees",
    branches:"trees",
    branch:"trees",
    stick:"trees",
    sticks:"trees",
    rocks:"rocks",
    rock:"rocks",
    stones:"rocks",
    stone:"rocks"
}

//END extra dicts


//BEGIN game progression constants

let __HAS_MOVED = false;

//END game progression constants


//END Global Stuff

//helper functions

//BEGIN world funcs
function getWorldChunk(x, y){
    x = x%128;
    y = y%128;
    let w = WORLD[x][y];
    if (w === null || w === undefined){
        console.log("LOG: unbuilt part of the world. Building...");
        w = new WorldChunk(x, y);
    }
    return w;
}
function moveToWorldChunk(x, y){
    if (typeof x === "object"){
        y = x.y;
        x = x.x;
    }
    //clear BATTLEFIELD
    clearArray(BATTLEFIELD);
    //set CURRENT_WORLDCHUNK 
    CURRENT_WORLDCHUNK = getWorldChunk(x, y);
    if (CURRENT_WORLDCHUNK.creatures.length > 0){
        for(let i=0;i<CURRENT_WORLDCHUNK.creatures.length;i++){
            let c = CURRENT_WORLDCHUNK.creatures[i];
            if (c.flags.hostile){
                removeIndex(CURRENT_WORLDCHUNK.creatures, i);
            }
            c.addToBattlefield();
        }
        COMBAT_MODE = true;
        NEW_COMBAT = true;
        print("#C=#FF0000#CEnemies are around you. You are in Combat!#C!")
    }
}
//END world funcs

//BEGIN combat funcs
function displayCombatBoard(){
    let sName = "|#C=#008F00#CPlayer#C!|"
    let c = "_"+player.hp;
    let k = 6-c.length;
    for(let i=0;i<k;i++){c += "_";}
    let sHP =   "|#C=#008F00#C"+c+"#C!|"
    
    for(let i=0;i<BATTLEFIELD.length;i++){
        let creature = BATTLEFIELD[i];
        let name = creature.name;
        let hp = "_"+creature.hp;
        while(hp.length < name.length){
            hp+="_";
        }
        sName += "#C=#FF0000#C"+name+"#C!|";
        sHP += "#C=#FF0000#C"+hp+"#C!|";
    }
    
    print(sName + "\n" + sHP);
}

function getFirstEnemyByName(name){
    for(let i=0;i<BATTLEFIELD.length;i++){
        if (BATTLEFIELD[i].name === name){
            return BATTLEFIELD[i];
        }
    }
    return undefined;
}

function executeEnemyTurn(){
    for(let i=0;i<BATTLEFIELD.length;i++){
        if (BATTLEFIELD[i].isAlive()){
            BATTLEFIELD[i].attack(player);
        }
    }
}

//END combat funcs

//BEGIN actions
/* Command ideas:
 * interaction with objects (take, drop, examine, use)
 * attack
 * recall (prophecy)
 * craft
 */

//movement
function move(args, startindex){
    if (COMBAT_MODE){
        print("You cannot travel when in combat!");
        return;
    }
    let dirs = getDictElements(args, dictDirections)
    if (dirs.length == 0){
        print("You travel aimlessly.");
        return;
    }
    let s = "You travel ";
    let words = ["north", "east", "south", "west"]
    let offs = [{x:0,y:1}, {x:1,y:0}, {x:0,y:-1}, {x:-1,y:0}]
    for(let i=0;i<dirs.length;i++){
        let k = dirs[i];
        let c = CURRENT_WORLDCHUNK.coords;
        moveToWorldChunk(c.x + offs[k].x, c.y+offs[k].y)
        s += words[dirs[i]];
        if (i+1 < dirs.length){
            s += " then ";
        }
    }
    print(s + ".");
    if (!__HAS_MOVED){
        __HAS_MOVED = true;
        print("As you walk, you <b>recall</b> the prophecy you had heard, the fate that waites for you.")
    }
}

//looking
function look(args, startindex){
    //"look for" is a find command so redirect
    if (args[startindex+1] == "for"){
        find(args, startindex+1);
        return;
    }
    let s = CURRENT_WORLDCHUNK.toString();
    print(s);
}

//find
function find(args, startindex){
    let elms = getDictElements(args, dictFindables, startindex);
    if (elms.length < 0){
        print("Unable to find that item!");
        return;
    }
    let found = {}
    for(let i=0;i<elms.length;i++){
        let e = elms[i].split(" ");
        if (typeof str == "string"){
            if (CURRENT_WORLDCHUNK.features[e]){
                found[e] = true;
            }
        }else{
            for(let j=0;j<e.length;j++){
                if (CURRENT_WORLDCHUNK.features[e[j]]){
                    found[e[j]] = true;
                }
            }
        }
    }
    found = Object.keys(found);
    let s = "You find "
    if (found.length === 0){
        s += "nothing you are looking for"
    }else{
        for(let i=0;i<found.length;i++){
            console.log("Found:" + found[i])
            switch(found[i]){
                case "animals": 
                    s += "various wild <b>animals</b> living in the area"
                    break;
                case "herbs":
                    s += "various growing <b>herbs</b>, possibly good for food and medicine"
                    break
                case "rocks":
                    s += "natural rocks and <b>stones</b>"
                    break
                case "trees":
                    s += "various trees and their <b>wood</b>"
                    break
                default:
                    s += found[i]
            }
            if (i+2 < found.length){
                s += ", ";
            }else if (i+1 < found.length){
                if (found.length > 2){
                    s += ",";
                }
                s += " and ";
            }
        }
    }
    print(s + ".");
}

//take
function take(args, startindex){
    let items = [];
    for(let i=startindex+1;i<args.length;i++){
        items.push(args[i]);
        let dp = depluralize(args[i]);
        if (dp !== args[i]){items.push(dp);}
    }
    //console.log(items)
    s = ""
    for (let i=0;i<items.length;i++){
        let c = CURRENT_WORLDCHUNK.inventory.getCount(items[i]);
        //console.log("Item: " + items[i] + " count: " + c);
        if (c > 0){
            let item = CURRENT_WORLDCHUNK.inventory.takeItem(items[i], 1);
            player.inventory.addItem(item);
            s += item.take_msg;
            if (i+1 < items.length){
                s += "<br>";
            }
        }
    }
    print(s);
}

//draw
function draw(args, startindex){
    for(let i=startindex+1; i<args.length;i++){
        let index = player.inventory.getIndex(args[i])
        if (index >= 0){
            let item = player.inventory.getItem(index)
            player.heldIndex = index;
            if (item.getFlag("damage") !== undefined){
                print("You draw your " + item.name + ".");
            }else{
                print("You take your " + item.name + " in hand.");
            }
            break;
        }
    }
}

//attack
function attack(args, startindex){
    if (!COMBAT_MODE){
        print("You cannot attack outside of combat!");
        //TODO: replace
        return
    }
    let attacked = false;
    for(let i=startindex+1; i<args.length;i++){
        let target = getFirstEnemyByName(args[i]);
        if (target !== undefined){
            player.attack(target);
            attacked = true;
            break;
        }
    }
    if (!attacked){
        print("Unable to find that enemy.");
    }
}

//use
const SPECIAL_USE_FLAGS = {
    eat: "edible",
    burn: "flamible",
    ignite: "flamible",
    light: "flamible"
    
}
function use(args, startindex){
    let f = null;
    if (valid(SPECIAL_USE_FLAGS[args[startindex]])){
        f = SPECIAL_USE_FLAGS[args[startindex]];
    }
    for (let i=startindex+1;i<args.length;i++){
        for (let index = 0;index < player.inventory.items.length; index++){
            let item = player.inventory.getItem(index);
            if (item.name === args[i]){ //TODO: add flag checking for special types
                if (f === null || item.getFlag(f)!== undefined){
                    let nc = item.use(player);
                    player.inventory.setCount(index, nc);
                    break;
                }else{
                    console.log("item does not have nesecary flags!");
                    console.log(item);
                }
            }
        }
    }
}

//action dictionary
const dictActions = {
    go: move,
    move: move,
    walk: move,
    travel: move,
    look: look,
    examine: look,
    perceive: look,
    view: look,
    find: find,
    search: find,
    take: take,
    pickup: take,
    pick: take,
    grab: take,
    gather: take,
    draw: draw,
    hold: draw,
    attack: attack,
    hit: attack,
    use: use,
    eat: use,
    burn: use,
    ignite: use,
    light: use
}

//END actions

//builtins
const dictBuiltings = {
    help: function(args){print(HELP_STR);return;},
    clean:function(args){DIV.innerHTML = "";print(">>clean");},
    clear: function(args){DIV.innerHTML = "";print(">>clear");},
    name: function(args){player.name = args[1];print("Name Changed");},
    whoami: function(args){print(player.toString() + "\nEXP: " + player.xp);},
    inv: function(args){print(player.inventory.toString());},
    inventory: function(args){print(player.inventory.toString());},
    details: function(args){
        let s = CURRENT_WORLDCHUNK.toString();
        s += " at {" + CURRENT_WORLDCHUNK.coords.x + ", " + CURRENT_WORLDCHUNK.coords.y + "}"
        s += "<br> Features:"+
            "<br>Trees:" + CURRENT_WORLDCHUNK.features.trees + 
            "<br>Rocks:"+ CURRENT_WORLDCHUNK.features.rocks +
            "<br>Herbs:" + CURRENT_WORLDCHUNK.features.herbs +
            "<br>Animals: "+ CURRENT_WORLDCHUNK.features.animals +
            "<br>Structures: "+ CURRENT_WORLDCHUNK.features.structures;
        
        s += "<br> Items:<br>"+ (CURRENT_WORLDCHUNK.inventory.toString());
        
        s += "\n BATTLEFIELD: " + BATTLEFIELD.toString();
        print(s);
    },
    battle: function(args){displayCombatBoard();}
}

//this function is called from the HTML page events. Well, indirectly!
function recieve_command(command){
    if (!player.isAlive()){return;}
    //console.log("COMMAND: [" + command + "]");
    print(">>" + command);
    let words = command.split(" ");
    
    //BUILTIN SPECIAL COMMANDS
    if (words[0][0] == "!"){
        words[0] = words[0].replace("!", "");
        if (dictBuiltings[words[0]] !== undefined){
            dictBuiltings[words[0]](words);
            return;
        }
    }
    
    for(let i=0;i<words.length;i++){
        words[i] = words[i].replace(/[.,!?]/g, ""); //remove puncuation
    }
    //console.log(words);
    let done = false;
    for(let i=0;i<words.length;i++){
        if (dictActions[words[i]] !== undefined){
            done = true;
            dictActions[words[i]](words, i);
            break;
        }
    }
    if (!done){
        print("Unable to parse sentance. Use !help for info on writing sentances that are more likely to be parsed.");
    }
    
    if (COMBAT_MODE){
        
        if (BATTLEFIELD.length === 0){
            COMBAT_MODE = false;
            print("#C=#008F00#CCombat Is Over!#C!");
        }else{
            if (!NEW_COMBAT){
                executeEnemyTurn();
            }else{
                NEW_COMBAT = false;
            }
            displayCombatBoard();
        }
    }
    if (!player.isAlive()){
        print("#C=#FF0000#CYou Have Died!#C!\nRefresh the page to play again!");
    }
}


//down here so everything else is defined
//CURRENT_WORLDCHUNK = getWorldChunk(64, 64);
moveToWorldChunk(64, 64);

print("Ready to play!");
print("You are a wandering adventurer, with the memorable name of John Burkins. Most people call you Burk. You are sitting on a rock, and look down at your foodbag. It's empty. You harden yourself for another day without lunch. Unless you can <b>find</b> somthing to eat?");
