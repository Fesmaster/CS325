import "./phaser.js";


const TILE_SIZE = 32;
const PLAY_WIDTH = 21;
const PLAY_HEIGHT = 17;
const MENU_WIDTH = 300;
const BORDER_SIZE = 20;
const TURRET_COST = 20;
const ENEMY_COST = 5;
const TURRET_ATTACK_MILLS = 500;
const ENEMY_ATTACK_MILLS = 700;
const ENEMY_SPEED = 20;
const RAD2DEG = (360 / (2 * 3.13159));

function PosToLoc(pos){
    let p = pos.clone();
    p.x = Math.floor((p.x-BORDER_SIZE) / TILE_SIZE);
    p.y = Math.floor((p.y-BORDER_SIZE) / TILE_SIZE);
    if (p.x <  PLAY_WIDTH && p.x >= 0 && 
        p.y < PLAY_HEIGHT && p.y >= 0
    ){
        return p;
    } else {
        return null;
    }
}

function UpdateProgressBarH(graphics, x, y, w, h, percent, color_f, color_b){
    if (percent > 1){percent = 1;}
    if (color_b === undefined){color_b = 0x666666;}
    graphics.fillStyle(color_b);
    graphics.fillRect(x-2, y-2, w+4, h+4);
    if (percent != 0){
        if (color_f == undefined){color_f = 0x00FF00;}
        graphics.fillStyle(color_f);
        graphics.fillRect(x, y, w*percent, h);
    }
}

class Button{
    constructor(Scene, ID, x, y, scale_base, image){ //TODO: replace color with Image
        this.background = Scene.add.image(
            x + TILE_SIZE * PLAY_WIDTH + BORDER_SIZE * 2, 
            y + BORDER_SIZE, 
            "button_off"
        );
        this.foreground = Scene.add.image(
            x + TILE_SIZE * PLAY_WIDTH + BORDER_SIZE * 2, 
            y + BORDER_SIZE, 
            image
        )
        //scale
        this.background.setScale(scale_base);
        this.foreground.setScale(scale_base);
        //custom properties
        this.foreground.scale_base = scale_base;
        this.foreground.bg = this.background;
        this.foreground.ID = ID;
        
        this.foreground.setInteractive();
        this.foreground.on("pointerover", function(){
            this.setScale(1.1 * this.scale_base);
            this.bg.setScale(1.1 * this.scale_base);
        });
        this.foreground.on("pointerout", function(){
            this.setScale(1 * this.scale_base);
            this.bg.setScale(1 * this.scale_base);
        });
        this.foreground.on("pointerup", function(){
            this.setScale(1.1 * this.scale_base);
            this.bg.setScale(1.1 * this.scale_base);
        });
        this.foreground.on("pointerdown", function(){
            this.setScale(0.9 * this.scale_base);
            this.bg.setScale(0.9 * this.scale_base);
            this.scene.buttonPress(this.ID);
        });
    }
    setActive(v){
        if (v || v === undefined){
            this.background.setTexture("button_on");
        }else{
            this.background.setTexture("button_off");
        }
    }
    destroy(){
        this.foreground.destroy();
        this.background.destroy();
    }
}

class Turret{
    constructor(Scene, x, y){
        this.type = "Turret";
        this.scene = Scene;
        this.loc = new Phaser.Math.Vector2(x, y);
        this.pos = new Phaser.Math.Vector2(
            x * TILE_SIZE + BORDER_SIZE + TILE_SIZE/2,
            y * TILE_SIZE + BORDER_SIZE + TILE_SIZE/2
        );
        
        this.body = Scene.add.image(
            this.pos.x,
            this.pos.y,
            "turret_body"
        );
        this.gun = Scene.add.image(
            this.pos.x,
            this.pos.y,
            "turret_gun"
        );
        this.graphics = Scene.add.graphics();
        this.sound = Scene.sound.add("laser_blast");
        
        //damage and leveling
        this.level = 1;
        this.damage = 1;
        this.range = TILE_SIZE * 3;
        
        //health
        this.hp_max = 10;
        this.hp = 10;
        
        //attacker
        this.attack_timer = TURRET_ATTACK_MILLS;
        this.targetingPos = new Phaser.Math.Vector2(this.pos.x,this.pos.y-10);
        
        //add to scene
        Scene.turrets[y][x] = this;
    }
    destroy(soft){
        this.body.destroy();
        this.gun.destroy();
        this.graphics.destroy();
        this.sound.destroy();
        //destroy upgrade parts
        if (soft) {return;}
        for (let y = this.loc.y;y<this.loc.y+this.level;y++){
            for (let x = this.loc.x;x<this.loc.x + this.level;x++){
                if (!(y === this.loc.y && x === this.loc.x) && y < PLAY_HEIGHT && x < PLAY_WIDTH){
                    if (this.scene.turrets[y][x] !== null){
                        this.scene.turrets[y][x].destroy(true);
                    }
                }
                this.scene.turrets[y][x] = null
            }
        }
    }
    update(time, delta){
        this.graphics.clear();
        //health bar
        if (this.hp !== this.hp_max){
            UpdateProgressBarH(
                this.graphics, 
                this.pos.x - TILE_SIZE/2 + 2, 
                this.pos.y + TILE_SIZE/2 - 5, 
                TILE_SIZE-4, 
                3, 
                this.hp / this.hp_max, 
                0xFF0000
            );
        }
        
        //attack
        if (this.attack_timer <= 0){
            this.attack_timer = TURRET_ATTACK_MILLS;
            let e = null;
            let d = 1000000;
            for(let i = 0;i<this.scene.enemies.length;i++){
                let e2 = this.scene.enemies[i];
                let d2 = e2.pos.distance(this.pos);
                if (d2 < d){
                    e = e2;
                    d = d2;
                }
            }
            if (e != null && d < this.range){
                e.attack(this.damage);
                this.targetingPos = e.pos.clone();
                this.graphics.lineStyle(1, 0x00c2ff);
                this.graphics.lineBetween(this.pos.x, this.pos.y, e.pos.x, e.pos.y);
                this.sound.play();
            }
        }else{
            this.attack_timer -= delta;
        }
        
        //gun
        let angle = Phaser.Math.Angle.Between(this.pos.x, this.pos.y, this.targetingPos.x, this.targetingPos.y);
        this.gun.setAngle(RAD2DEG * angle + 90);

    }
    attack(damage){
        this.hp -= damage;
        if (this.hp <= 0){
            this.destroy();
        }
    }
    applyLevel(){
        if (this.level < 1){this.level = 1;}
        //increase max HP
        this.hp = 10*Math.pow(this.level, 2) + 10*this.level;
        this.hp_max = this.hp;
        //update the damage
        this.damage = this.level;
        //increase Range()
        this.range = TILE_SIZE * (3*this.level);
        //increase Scale
        this.body.setScale(this.level);
        this.gun.setScale(this.level);
        this.pos.setTo(
            this.loc.x * TILE_SIZE + BORDER_SIZE + (TILE_SIZE/2*this.level),
            this.loc.y * TILE_SIZE + BORDER_SIZE + (TILE_SIZE/2*this.level)
        );
        this.body.setPosition(this.pos.x, this.pos.y);
        this.gun.setPosition(this.pos.x, this.pos.y);
    }
    levelup(){
        //increase the level
        this.level++;
        
        this.applyLevel();
        
        for (let y = this.loc.y;y<this.loc.y+this.level;y++){
            for (let x = this.loc.x;x<this.loc.x + this.level;x++){
                if (!(y === this.loc.y && x === this.loc.x) && y < PLAY_HEIGHT && x < PLAY_WIDTH){
                    let t = this.scene.turrets[y][x];
                    if (t !== null){
                        //console.log(this.scene.turrets[y][x]);
                        if (t.type != "TurretPart"){
                            t.destroy();
                        }else{
                            t.owner = this;
                            continue;
                        }
                    }
                    this.scene.turrets[y][x] = new TurretPart(this, x, y);
                    //console.log(this.scene.turrets[y][x]);
                } //end if this is not corner or out of bounds
            }
        }
    }
    leveldown(){
        this.level--;
        
        this.applyLevel();
        
        let xx = this.loc.x + this.level;
        let yy = this.loc.y + this.level;
        
        for (let y = this.loc.y;y<=yy;y++){
            if (y < PLAY_HEIGHT){
                let t = this.scene.turrets[y][xx];
                if (t !== null){
                    t.destroy(true);
                }
                new Turret(this.scene, xx, y);
            }
        }
        for (let x = this.loc.x;x<xx;x++){
            if (x < PLAY_WIDTH){
                let t = this.scene.turrets[yy][x];
                if (t !== null){
                    t.destroy(true);
                }
                new Turret(this.scene, x, yy);
            }
        }
    }
    canlevelup(){
        for (let y = this.loc.y;y<this.loc.y+this.level+1;y++){
            for (let x = this.loc.x;x<this.loc.x + this.level+1;x++){
                if (!(y === this.loc.y && x === this.loc.x)){
                    if (x >= PLAY_WIDTH || y >= PLAY_HEIGHT){
                        console.log("Out of bounds - No level up!");
                        return false;
                    }
                    if (this.scene.turrets[y][x] === null){
                        console.log("null position - No level up!");
                        return false;
                    }
                    let t = this.scene.turrets[y][x].type;
                    //console.log(t);
                    if (!(
                        (t == "Turret" && this.scene.turrets[y][x].level === 1)|| 
                        (t === 'TurretPart' && this.scene.turrets[y][x].owner === this)
                    )) {
                        console.log("not a valid level up turret! - No level up!");
                        return false;
                    }
                }
            }
        }
        return true;
    }
}

class TurretPart{
    constructor(Owner, x, y){
        this.type = "TurretPart";
        this.owner = Owner;
        this.loc = new Phaser.Math.Vector2(x, y);
        this.pos = new Phaser.Math.Vector2(
            x * TILE_SIZE + BORDER_SIZE + TILE_SIZE/2,
            y * TILE_SIZE + BORDER_SIZE + TILE_SIZE/2
        );
        this.level = Owner.level;
    }
    update(time, delta){
        this.level = this.owner.level;
    }
    destroy(soft){
        //?
        
        if (!soft || soft === undefined){
            //console.log("Hard destroy of turret part");
            this.owner.destroy();
        }//else{
        //    console.log("Soft destroy of turret part");
        //}
    }
    attack(damage){
        console.log("Pass Attack!");
        this.owner.attack(damage);
    }
    levelup(){
        this.owner.levelup();
    }
    canlevelup(){
        return this.owner.canlevelup();
    }
}

class OasisTurret{
    constructor(Scene, x, y){
        this.type = "Oasis";
        this.scene = Scene;
        this.loc = new Phaser.Math.Vector2(x, y);
        this.pos = new Phaser.Math.Vector2(
            x * TILE_SIZE + BORDER_SIZE + TILE_SIZE/2,
            y * TILE_SIZE + BORDER_SIZE + TILE_SIZE/2
        );
        this.body = Scene.add.image(
            this.pos.x,
            this.pos.y,
            "oasis"
        );
        this.graphics = Scene.add.graphics();
        this.hp_max = 500
        this.hp = 500;
        Scene.turrets[y][x] = this;
    }
    destroy(soft){
        this.body.destroy();
        this.graphics.destroy();
    }
    update(time, delta){
        this.graphics.clear();
        //health bar
        UpdateProgressBarH(
            this.graphics, 
            this.pos.x - TILE_SIZE/2 + 2, 
            this.pos.y + TILE_SIZE/2 - 5, 
            TILE_SIZE-4, 
            3, 
            this.hp / this.hp_max, 
            0xFF0000
        );
    }
    attack(damage){
        this.hp -= damage;
        if (this.hp <= 0){
            this.scene.turrets[this.loc.y][this.loc.x] = null;
            this.destroy();
            //loose the game!
        }
    }
    canlevelup(){
        return false;
    }
}

class Enemy{
    constructor(Scene, x, y){
        this.scene = Scene;
        this.pos = new Phaser.Math.Vector2(x, y);
        this.body = Scene.add.image(
            x, y,
            "enemy1"
        );
        this.body.setScale(3);
        this.speed = ENEMY_SPEED; //pixels per second
        this.target = new Phaser.Math.Vector2(
            BORDER_SIZE + (TILE_SIZE * PLAY_WIDTH  / 2),
            BORDER_SIZE + (TILE_SIZE * PLAY_HEIGHT / 2)
        );
        this.target_loc = new Phaser.Math.Vector2(10, 8);
        this.target_radius = (TILE_SIZE/1.5);
        
        this.attack_timer = ENEMY_ATTACK_MILLS;
        this.hp = 3;
        this.hp_max = 3;
        
        Scene.enemies.push(this);
    }
    destroy(){
        this.body.destroy();
    }
    update(time, delta){
        //get the closest turret to be the target
        let d = 100000;
        let p = new Phaser.Math.Vector2(-1,-1);
        let l = new Phaser.Math.Vector2(-1,-1);
        for(let y = 0;y<PLAY_HEIGHT;y++){
            for(let x = 0;x<PLAY_WIDTH;x++){
                let t = this.scene.turrets[y][x];
                if (t != null){
                    let d2 = t.pos.distance(this.pos);
                    if (d2 < d){
                        d = d2;
                        p = t.pos.clone();
                        l = t.loc.clone();
                    }
                }
            }
        }
        if (p.x !== -1 && p.y !== -1){
            this.target = p;
            this.target_loc = l;
        }else{
            this.target.setTo(
                 BORDER_SIZE + (TILE_SIZE * PLAY_WIDTH  / 2),
                BORDER_SIZE + (TILE_SIZE * PLAY_HEIGHT / 2)
            );
            this.target_loc.setTo(10, 8);
        }
        
        //move to the target
        let movment = this.target.clone();
        movment.subtract(this.pos);
        movment.setLength(this.speed * (delta/1000));
        let dist = this.target.distance(this.pos);
        
        if (dist > this.target_radius){
            this.pos.add(movment);
            this.body.setPosition(this.pos.x, this.pos.y);
        } else{
            //attack target
            //let loc = PosToLoc(this.target);
            let t = this.scene.turrets[this.target_loc.y][this.target_loc.x];
            if (t !== null){
                if (this.attack_timer <= 0){
                    t.attack(1);
                    this.attack_timer = ENEMY_ATTACK_MILLS;
                }else{
                    this.attack_timer -= delta;
                }
            }
        }
        
    }
    attack(damage){
        this.hp -= damage;
        if (this.hp == 2){
            this.body.setTexture("enemy2");
        }
        if (this.hp == 1){
            this.body.setTexture("enemy3");
        }
        if (this.hp <= 0){
            this.scene.removeEnemy(this);
        }
    }
}

//const colors for the selectionbox
const SELECT_NULL = 0xC0C0C0;
const SELECT_PLACE = 0x039a00;
const SELECT_REMOVE = 0xc20000;
const SELECT_UPGRADE = 0xffcc00;
const SELECT_DOWNGRADE = 0x0050ff;


class MyScene extends Phaser.Scene {
    
    constructor() {
        super();
        
        this.selectBox = null;
        this.background = null;
        //this.turret_graphics = null;
        this.clickMode = 0;
        this.selectColor = SELECT_NULL;
        
        //create the turrets array.
        this.turrets = [];
        for(let y = 0;y<PLAY_HEIGHT;y++){
            this.turrets[y] = [];
            for(let x = 0;x<PLAY_WIDTH;x++){
                this.turrets[y][x] = null;
            }
        }
        
        this.resource_text = null;
        this.resource = 100; //change back to 100
        this.btn_add = null;
        this.btn_del = null;
        this.btn_upg = null;
        this.dwn_upg = null;
        
        this.attacking = false;
        this.attackTimer = 10; //change back to 10
        this.attackTimerMax = 10;
        
        this.enemies_per_wave = 20;
        this.enemies_per_wave_mult = 1.2;
        this.wave = 1;
        this.enemies = ["fake"];
        this.enemies.length = 0;
        
        this.restartedSound = false;
    }
    
    preload() {
        //"turret_body"
        this.load.image("turret_body", "assets/Turret_Body.png");
        this.load.image("turret_gun", "assets/Turret_Gun.png");
        this.load.image("oasis", "assets/Oasis.png");
        this.load.image("enemy1", "assets/Enemy_1.png");
        this.load.image("enemy2", "assets/Enemy_2.png");
        this.load.image("enemy3", "assets/Enemy_3.png");
        
        this.load.image("button_on", "assets/Button_On.png");
        this.load.image("button_off", "assets/Button_Off.png");
        
        this.load.image("button_add", "assets/Button_Add.png");
        this.load.image("button_remove", "assets/Button_Remove.png");
        this.load.image("button_upgrade", "assets/Button_Upgrade.png");
        this.load.image("button_downgrade", "assets/Button_Downgrade.png");
        
        this.load.audio("laser_blast", "assets/Laser_Blast.wav");
    }
    
    create() {
        //build the background
        //this is first to make it on bottom
        this.background = this.add.graphics();
        
        
        //this.turret_graphics = this.add.graphics();
        
        new OasisTurret(this, Math.floor(PLAY_WIDTH/2),Math.floor(PLAY_HEIGHT/2))
        
        this.resource_text = this.add.text(
            TILE_SIZE * PLAY_WIDTH + BORDER_SIZE*2 + 20, 
            60, 
            "Res:"+this.resource.toString()
        );
        
        this.btn_add = new Button(this, "add", 70,  120,  3.125, "button_add");
        this.btn_del = new Button(this, "del", 230, 120,  3.125, "button_remove");
        this.btn_upg = new Button(this, "upg", 70,  280, 3.125, "button_upgrade");
        this.btn_dwg = new Button(this, "dwg", 230, 280, 3.125, "button_downgrade");
        
        //the secetionbox is one of the last to be added, so as to make it on top
        this.selectBox = this.add.graphics();
        this.input.on("pointerdown", function(){
            let l = this.scene.SelecctedLoc();
            if (l !== null){
                this.scene.mousePress(l);
            }
        })
        //hold and drag to place turrets
        this.input.on("pointermove", function(){
            if (this.scene.input.mousePointer.buttons & 0b0001 > 0 && this.scene.clickMode !== 3){
                let l = this.scene.SelecctedLoc();
                if (l !== null){
                    this.scene.mousePress(l);
                }
            }
        })
    }
    
    buttonPress(bID){
        if (!this.restartedSound){
            this.sound.context.resume();
            this.restartedSound = true;
        }
        
        //console.log(bID);
        if (bID == "add"){
            if (this.clickMode === 1){
                this.clickMode = 0;
                this.btn_add.setActive(false);
                this.selectColor = SELECT_NULL;
            }else{
                this.btn_add.setActive(true);
                this.clickMode = 1;
                this.selectColor = SELECT_PLACE;
                
                this.btn_del.setActive(false);
                this.btn_upg.setActive(false);
                this.btn_dwg.setActive(false);
            }
        }else if (bID == "del"){
            if (this.clickMode === 2){
                this.clickMode = 0;
                this.btn_del.setActive(false);
                this.selectColor = SELECT_NULL;
            }else{
                this.btn_del.setActive(true);
                this.clickMode = 2;
                this.selectColor = SELECT_REMOVE;
                this.btn_add.setActive(false);
                this.btn_upg.setActive(false);
                this.btn_dwg.setActive(false);
            }
        }else if (bID == "upg"){
            if (this.clickMode === 3){
                this.clickMode = 0;
                this.btn_upg.setActive(false);
                this.selectColor = SELECT_NULL;
            }else{
                this.btn_upg.setActive(true);
                this.clickMode = 3;
                this.selectColor = SELECT_UPGRADE;
                this.btn_add.setActive(false);
                this.btn_del.setActive(false);
                this.btn_dwg.setActive(false);
            }
        }else if (bID == 'dwg'){
            if (this.clickMode === 4){
                this.clickMode = 0;
                this.btn_dwg.setActive(false);
                this.selectColor = SELECT_NULL;
            }else{
                this.btn_dwg.setActive(true);
                this.clickMode = 4;
                this.selectColor = SELECT_DOWNGRADE;
                this.btn_add.setActive(false);
                this.btn_del.setActive(false);
                this.btn_upg.setActive(false);
            }
        }
    }
    
    mousePress(loc){
        //console.log(""+ loc.x + ","+loc.y);
        if (!this.restartedSound){
            this.sound.context.resume();
            this.restartedSound = true;
        }
        
        if (
            this.clickMode === 1 && 
            this.turrets[loc.y][loc.x] === null && 
            this.resource >= TURRET_COST
        ){
            new Turret(this, loc.x, loc.y);
            this.resource -= TURRET_COST;
            //this.clickMode = 0;
            //this.selectColor = SELECT_NULL;
        }else if (this.clickMode === 2 && this.turrets[loc.y][loc.x] !== null && (loc.y!== 8 || loc.x !== 10)){
            this.resource += TURRET_COST* Math.pow(this.turrets[loc.y][loc.x].level, 2);
            this.turrets[loc.y][loc.x].destroy();
            
            //this.clickMode = 0;
            //this.selectColor = SELECT_NULL;
        }else if (this.clickMode === 3 && this.turrets[loc.y][loc.x] !== null && (loc.y!== 8 || loc.x !== 10)){
            if (this.turrets[loc.y][loc.x].canlevelup()){
                this.turrets[loc.y][loc.x].levelup();
            }
        }else if (this.clickMode === 4 && this.turrets[loc.y][loc.x] !== null && (loc.y!== 8 || loc.x !== 10)){
            if (this.turrets[loc.y][loc.x].level > 1){
                this.turrets[loc.y][loc.x].leveldown();
            }
        }
    }
    
    update(time, delta) {
        //
        this.background.clear();
        this.selectBox.clear();
        //this.turret_graphics.clear();
        
        this.resource_text.setText("Res:"+this.resource.toString());
        
        //draw the background
        this.background.fillStyle(0xF0F0F0);
        this.background.fillRect(
            BORDER_SIZE, 
            BORDER_SIZE,  
            TILE_SIZE * PLAY_WIDTH,  
            TILE_SIZE * PLAY_HEIGHT
        );
        this.background.fillStyle(0x707070);
        this.background.fillRect(
            TILE_SIZE * PLAY_WIDTH + BORDER_SIZE * 2,
            BORDER_SIZE, 
            MENU_WIDTH, 
            TILE_SIZE * PLAY_HEIGHT
        );
        
        
        //update the attack timer
        if (!this.attacking){
            this.attackTimer -= (delta / 1000);
            if (this.attackTimer <= 0){
                this.executeAttack();
                this.attackTimer = this.attackTimerMax;
                this.attacking = true;
            }
            UpdateProgressBarH(
                this.background, 
                TILE_SIZE * PLAY_WIDTH + BORDER_SIZE * 2 +5, 
                BORDER_SIZE+5, 
                (MENU_WIDTH) - 10, 
                20, 
                this.attackTimer / this.attackTimerMax,  
                0x00FFFF,
                0x0A0A0A
            );
        }else{
            //check for all enemies dead.
            if (this.enemies.length === 0){
                this.attacking = false;
                this.wave++;
                this.enemies_per_wave *= this.enemies_per_wave_mult;
            }
        }
        
        //update the turrets
        for(let y = 0;y<PLAY_HEIGHT;y++){
            for(let x = 0;x<PLAY_WIDTH;x++){
                if (this.turrets[y][x] !== null){
                    this.turrets[y][x].update(time, delta);
                }
            }
        }
        
        //update the enemies
        for(let i = 0; i<this.enemies.length;i++){
            this.enemies[i].update(time, delta);
        }
        
        //collect mouse location, and clamp to the nearest tile Upper Left corner
        var pos = this.SelectedPos()
        if (pos !== null){
            //draw the selectionBox
            this.selectBox.fillStyle(this.selectColor, 0.5);
            this.selectBox.fillRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
            this.selectBox.lineStyle(2, this.selectColor);
            this.selectBox.strokeRect(pos.x, pos.y, TILE_SIZE, TILE_SIZE);
        }
        
        
    }
    
    executeAttack(){
        for(let i=0;i<this.enemies_per_wave;i++){
            new Enemy(
                this, 
                40 + Math.floor((Math.random()-0.5)*80), 
                40 + Math.floor((Math.random()-0.5)*80)
            );
        }
    }
    
    removeEnemy(enemy){
        var m = 0;
        for(let i = 0;i<this.enemies.length;i++){
            if (m == 0 && this.enemies[i] === enemy){
                this.enemies[i].destroy();
                m = 1;
            }else if (m == 1){
                this.enemies[i-1] = this.enemies[i];
            }
        }
        this.enemies.pop();
        this.resource += ENEMY_COST;
    }
    
    SelectedPos(){
        // This method gets the selected pos, or null if none is selected.
        var pos = this.input.mousePointer.position.clone();
        pos.x = Math.floor((pos.x-BORDER_SIZE) / TILE_SIZE) * TILE_SIZE + BORDER_SIZE;
        pos.y = Math.floor((pos.y-BORDER_SIZE) / TILE_SIZE) * TILE_SIZE + BORDER_SIZE;
        if (pos.x < TILE_SIZE * PLAY_WIDTH + BORDER_SIZE && pos.x > 0 && 
            pos.y < TILE_SIZE * PLAY_HEIGHT + BORDER_SIZE && pos.y > 0
        ){
            return pos;
        } else {
            return null;
        }
    }
    SelecctedLoc(){
        var pos = this.input.mousePointer.position.clone();
        pos.x = Math.floor((pos.x-BORDER_SIZE) / TILE_SIZE);
        pos.y = Math.floor((pos.y-BORDER_SIZE) / TILE_SIZE);
        if (pos.x <  PLAY_WIDTH && pos.x >= 0 && 
            pos.y < PLAY_HEIGHT && pos.y >= 0
        ){
            return pos;
        } else {
            return null;
        }
    }
}


const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: TILE_SIZE * PLAY_WIDTH + MENU_WIDTH + BORDER_SIZE*3,
    height: TILE_SIZE * PLAY_HEIGHT + BORDER_SIZE*2,
    pixelArt: true,
    scene: MyScene,
    physics: { 
        default: 'matter',
        matter: {
            debug: {
                showBody: true,
                showStaticBody: true
            }
        }
    },
});
