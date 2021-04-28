//BEGIN basic stuff
const DIV = document.getElementById('game');
let OUT_LEN = 0;
const OUT_LEN_MAX = 15;
function validateOutputSize(){
    while (OUT_LEN > OUT_LEN_MAX){
        OUT_LEN--;
        let s = DIV.innerHTML.search("</p>") + 4;
        DIV.innerHTML = DIV.innerHTML.slice(s);
    }
}
function print(text){
    OUT_LEN++;
    let t = text.replace(/#C=/g, "<span style=\"color:");
    t = t.replace(/#C!/g, "</span>");
    t = t.replace(/#C/g, "\">");
    t = t.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
    t = t.replace(/\n/g, "<br>");
    t = t.replace(/_/g, "&nbsp;");
    DIV.innerHTML += ("<p>" + t + "</p>");
    validateOutputSize();
}
print("Beginning game ... ");
function findword(args, word, startindex){
    if (startindex === undefined){startindex=0;}
    for(let i=startindex; i<args.length; i++){
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
        if (user.hp === user.getMaxHP()){
            print("You are already at full health!");
            return;
        }
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
        if (!valid(flag)){return true;} //if not a valid flag, return true
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
    enhance(user){
        let damage = this.getFlag("damage");
        if (valid(damage)){
            if (user.inventory.getCount("wood") < 1 || user.inventory.getCount("stone") < 1){
                print(user.name + " does not have enough wood and stone to enhance " + this.name + "!");
                return false;
            }
            user.inventory.takeItem("wood", 1);
            user.inventory.takeItem("stone", 1);
            this.setFlag("damage", damage+1);
            print(user.name + " enhanced " + this.name);
        }else{
            print(this.name + " cannot be enhanced!");
            return false;
        }
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
    getCount(name, flag){
        //get the name from item if item is passed
        if (typeof name === "object"){
            name = name.name;
        }
        let c = 0;
        for(let i=0;i<this.items.length;i++){
            if (this.items[i].name === name){
                if (!valid(flag)){
                    c += this.items[i].count;
                }else{
                    if(valid(this.items[i].getFlag(flag))){
                        c += this.items[i].count;
                    }
                }
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
    takeItem(name, count, flag){
        //get the name from item if item is passed
        if (typeof name === "object"){
            name = name.name;
        }
        let currHiCount = 0;
        let currHiIndex = -1;
        for(let i=0;i<this.items.length;i++){
            if (this.items[i].name === name && valid(this.items[i].getFlag(flag))){
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
const RANGED_WEAPON_NAME_LIST = ["shortbow", "sling", "longbow", "crossbow", "dartgun", "boltcaster"];

let INTEREST_POINTS = [
    "There is a hill with two peaks, a lone pine tree growing on one, a large bolder on the other.",
    "A brook sparkles in the sunlight, and presently flows over a cliff making a majestic waterfall.",
    "A large standing stone covered with mysterious runes reminds you of a bygone age.",
    "A pile of boulders looks mysteriously like a large fist rising from the ground.",
    "A rough circle of moss-covered stones marks the site of an ancient ritual grounds.",
    "A half-burned palisade fort reminds you of the troubles of the land.",
    "A large, fresh crater in the ground indicates wizardry in the area. Or angery moles.",
    "The massive, frozen carcass of a spider, nearly five feet tall, stuns you. It does not seem to be melting.",
    "As you walk along, you realize you are following an ancient paved road, long since lost to time, only this section still in tact, though covered with dirt and debris.",
    "Thick mists cover the land, and many small hills make you think of barrows and burial mounds.",
    "A large hill with a ruined tower atop stand as a reminder to the elvish emipre that once ruled these lands.",
    "A natural freshwater pool forms a perfect mirror, and, at night, reflects the moon like nothing you have seen. It positively glows!",
    "A trail of torn-up ground catches your attention, and, following it, you find the rotting carcass of a large boar, seeming to have died in battle. The victor does not seem to be around.",
    "You find an arrow stuck in the ground, no rust or weathering, but no owner around.",
    "A massive quartz crystal forms a natural outcropping, sticking nearly nine feet out of the ground and around three in diameter. You don't know how deep it goes. Smaller ones surround it, making it look like a nest.",
    "You come across an area where a number of bolders float in the air. They resist being pushed around and spun, but they do not fall, nor are they supported by anything invisible.",
    "You find a standing stone surrounded by smaller ones, in an open area. Butterflies and other insects fly around them. Try as you might, you cannot move past the ring of smaller stones.",
    "You come across a large statue of a man with a horned helmet and a large, double-bit axe. The statue is carved from a hard rock and is twenty feet tall.",
    "",
];
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
            intrest: chance(5),
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
        
        //BEGIN intrest
        this.interest = ""
        if (this.features.intrest && INTEREST_POINTS.length > 0){
            let index = Math.floor(Math.random() * INTEREST_POINTS.length);
            this.interest = INTEREST_POINTS[index];
            removeIndex(INTEREST_POINTS, index);
        }
        else if (this.features.interest){
            console.log("No more features to add")
        }
        //END intrest
        
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
        let ranged = false;
        if (Math.random() > 0.5){
            n = choose(RANGED_WEAPON_NAME_LIST);
            ranged = true;
        }
        let item = new Item(n, 1);
        item.setFlag("damage", rand(3, 8));
        if (ranged){
            item.setFlag('weaponRanged', true);
        }
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
        s += "\n\t" + this.interest; //interest points
        if (this.inventory.items.length !== 0){
            s += "\nYou spot some items in the area:\n" + this.inventory.toString();
        }
        
        return s;
    }
}

let CRAFTS = {};
class Craft{
    constructor(result, recpie){
        if (!valid(result) || !valid(recpie)){
            console.log("ERROR: invalid result/recpie in craft!");
            return;
        }
        if (valid(CRAFTS[result])){
            console.log("ERROR: cannot have two recipes with same result!")
            return;
        }
        if (typeof result === "string"){
            result = new Item(result, 1);
        }
        this.result = result;
        this.recpie = recpie;
        CRAFTS[result.name] = this;
    }
    execute(){
        //first, see if we CAN execute
        for (let i=0;i<this.recpie.length;i++){
            if (player.inventory.getCount(this.recpie[i]) <= 0){
                return false;
            }
        }
        //remove items from player inv
        for (let i=0;i<this.recpie.length;i++){
            player.inventory.takeItem(this.recpie[i], 1);
        }
        //clone result into player inv
        player.inventory.addItem(this.result.clone());
        print("You crafted a " + this.result.name + ".");
        return true;
    }
}

//END types

//BEGIN Global Stuff

//BEGIN Help String
const HELP_STR = "Commands are phrased as basic imperitive sentances, such as <b>go north</b>, <b>attack disaster-on-legs</b>, or <b>find food</b>. There are a number of verbs that are recognized, namely:<ul><li><b>go, move, walk, travel</b> for movement.</li><li><b>look, examine, perceive, view, find, search</b> for looking around and searching.</li><li><b>take, pickup, pick, grab, gather</b> for collecting items</li><li><b>draw, hold</b> for selecting the wielded item</li><li><b>attack, hit</b> for attacking enemies</li><li><b>use, eat, burn, ignite, light</b> for using and consuming items</li><li><b>craft, make, build</b> for crafting items. There are two items that can be crafted: trap and steak</li><li><b>enhance, upgrade, repair, fix</b> for upgrading weapons</li><li><b>drop, place</b> for removing items from your inventory</li></ul>Besides these, there are a few special commands, prefixed with a \"!\". Some of these are for development debug, others are for players.<ul><li><b>!help</b> prints this help message.</li><li><b>!clean</b> and <b>!clear</b> clear the screen</li><li><b>!name [newname]</b> sets the player name</li><li><b>!whoami</b> prints the player's information</li><li><b>!inv</b> and <b>!inventory</b> prints the player's inventory</li><li><b>!details</b> prints the details of the enviroment. This is intended for debugging.</li><li><b>!battle</b> prints the battlefield, as if combat was underway. It is intended for debugging.</li></ul>";
//END Help String

//BEGIN crafting recipes
{
    let trap = new Item("trap", 1, undefined, undefined, undefined, {consumable:true});
    trap.setUseFunction(function(item, user){
        let usedItem = item.clone();
        usedItem.count = 1;
        usedItem.setFlag("trapSet", true);
        CURRENT_WORLDCHUNK.inventory.addItem(usedItem);
        print("You set and bait the trap");
        return item.count - 1;
    })
    let steak = new Item("steak", 1, undefined, undefined, undefined, {healing:20, edible:true});
    steak.setUseFunction(USE_EAT_FUNC);
    
    new Craft(trap,["wood", "stone"])
    new Craft(steak,["herbs", "meat"])
}
let MEAT_TEMPLATE = new Item("meat", 1, undefined, undefined, undefined, {healing:5, edible:true});
MEAT_TEMPLATE.setUseFunction(USE_EAT_FUNC);

//END crafting recipes

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
    if (CURRENT_WORLDCHUNK.inventory.items.length > 0 && CURRENT_WORLDCHUNK.features.animals){
        let count = CURRENT_WORLDCHUNK.inventory.getCount("trap", "trapSet");
        if (count > 0){
            CURRENT_WORLDCHUNK.inventory.takeItem("trap", count, "trapSet");
            let meat = MEAT_TEMPLATE.clone();
            meat.count = count;
            CURRENT_WORLDCHUNK.inventory.addItem(meat);
        }
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

function craft(args, startindex){
    for(let i=startindex+1; i<args.length;i++){
        let craft = CRAFTS[args[i]];
        if (valid(craft)){
            craft.execute();
        }
    }
}

function upgrade(args, startindex){
    for(let i=startindex+1;i<args.length;i++){
        let item = player.inventory.getItem(args[i]);
        if (valid(item)){
            item.enhance(player);
        }
    }
}

function drop(args, startindex){
    let p = "";
    for(let i=startindex+1;i<args.length;i++){
        let count = player.inventory.getCount(args[i]);
        if (count > 0){
            let item = player.inventory.takeItem(args[i], count);
            CURRENT_WORLDCHUNK.inventory.addItem(item);
            p += item.name + ":" + item.count;
            if (i+1 < args.length){
                p +=", ";
            }
        }
    }
    print("Dropped Items: "+p);
}

//action dictionary
const dictActions = {
    go: move, move: move, walk: move, travel: move,
    look: look, examine: look, perceive: look, view: look,
    find: find, search: find,
    take: take, pickup: take, pick: take, grab: take, gather: take,
    draw: draw, hold: draw,
    attack: attack, hit: attack,
    use: use, eat: use, burn: use, ignite: use, light: use, set: use,
    craft: craft, make: craft, build: craft,
    enhance: upgrade, upgrade: upgrade, repair: upgrade, fix: upgrade,
    drop: drop, place: drop,
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
            "<br>Point of Interest: "+ CURRENT_WORLDCHUNK.features.intrest;
        
        s += "<br> Items:<br>"+ (CURRENT_WORLDCHUNK.inventory.toString());
        
        s += "\n BATTLEFIELD: " + BATTLEFIELD.toString();
        print(s);
    },
    battle: function(args){displayCombatBoard();},
    newitem: function(args){
        if (args.length < 2){
            return
        }
        let item = new Item(args[1]);
        
        for(let i=2;i<args.length;i+=2){
            let f = args[i];
            let v = args[i+1];
            if (v === "true"){ v = true;}
            if (v === "false"){ v = false;}
            if (!isNaN(parseFloat(v))){v = parseFloat(v);}
            item.setFlag(f, v);
        }
        
        player.inventory.addItem(item);
    },
    crafts: function(args){
        console.log(CRAFTS);
    },
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
