import "./phaser.js";

const INTERACTABLE_RANGE = 32 * 32; //distance sqared

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
        //the collision rect
        this.rect = this.scene.matter.add.rectangle(tx*32+width*16, ty*32+height*16, width*32, height*32, {
            label: label,
            isSensor: true,
            isStatic: true,
            onCollideCallback: this.callback,
            onCollideEndCallback: this.callback_leave
        })
        this.rect.Trigger = this;
        //add to scene
        this.scene.Interactables.push(this);
    }
    update(time, delta){
        if (
            this.enable_timer && this.activ_timer_max > 0 &&
            this.call_bt !== undefined
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
        if (pair.bodyA.label === "player" || pair.bodyB.label === "player"){
            this.Trigger.lastPair = pair;
            this.Trigger.enable_timer = true;
            this.Trigger.activ_timer = 0;
            if (this.Trigger.call_b !== undefined){
                this.Trigger.call_b(pair, this.Trigger.scene, this.Trigger.scene.player);
            }
        }
    }
    callback_leave(pair){
        if (pair.bodyA.label === "player" || pair.bodyB.label === "player"){
            this.Trigger.lastPair = null;
            this.Trigger.enable_timer = false;
            this.Trigger.activ_timer = 0;
            if (this.Trigger.call_bl !== undefined){
                this.Trigger.call_bl(pair, this.Trigger.scene, this.Trigger.scene.player);
            }
        }
    }
}

class Interactable{
    constructor(scene, x, y, image, cb){
        this.scene = scene;
        this.callback = cb;
        
        //image creation
        this.image = this.scene.add.image(x*32, y*32, image);
        this.image.setInteractive();
        this.image.Interactable = this;
        
        //callbacks
        this.image.on("pointerover", function(){
            this.Interactable.enableDraw = true;
        });
        this.image.on("pointerout", function(){
            this.Interactable.enableDraw = false;
        });
        this.image.on("pointerup", function(){
            this.Interactable.drawScale = 1;
        });
        this.image.on("pointerdown", function(){
            let iact = this.Interactable;
            let scene = iact.scene;
            let player = scene.player;
            let pos  = new Phaser.Math.Vector2(this.x, this.y);
            let ppos = new Phaser.Math.Vector2(player.x, player.y);
            if (
                iact.callback !== undefined &&
                pos.distanceSq(ppos) <= INTERACTABLE_RANGE
            )
            {
                iact.drawScale = 0.9;
                iact.callback(iact, scene, player);
            }
        });
        
        //outline drawing when hovered and clicked
        if (this.scene.buttonGraphics === undefined){
            this.scene.buttonGraphics = this.scene.add.graphics();
        }
        this.graphics = this.scene.buttonGraphics;
        this.enableDraw = false;
        this.drawScale = 1;
        
        this.scene.Interactables.push(this);
    }
    update(time, delta){
        if (this.enableDraw){
            let player = this.scene.player;
            let pos  = new Phaser.Math.Vector2(this.image.x, this.image.y);
            let ppos = new Phaser.Math.Vector2(player.x, player.y);
            
            if (pos.distanceSq(ppos) <= INTERACTABLE_RANGE){
                this.graphics.lineStyle(3, 0x00FFFF);
            }else{
                this.graphics.lineStyle(3, 0xFF0000);
            }
            
            let sx = this.image.displayWidth * this.drawScale;
            let sy = this.image.displayHeight * this.drawScale;
            this.graphics.strokeRect(
                this.image.x - sx/2, 
                this.image.y - sy/2, 
                sx, 
                sy
            );
        }
    }
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
        
        this.map = null;
        this.tiles = null;
        this.layer_floor = null;
        this.layer_props = null;
        this.layer_wall = null;
        
        this.anim_tile_timer = 0;
        //this.buttonGraphics = null;
        this.lava_toggle = null;
        
        this.Interactables = [];
        this.killtypes = {};
        this.kills = 0;
        this.scream = null;
    }
    
    preload() {
        this.load.image("player", "assets/Player.png");
        this.load.image("tiles", "assets/Tilemap.png");
        this.load.tilemapTiledJSON("map", "assets/map1.json");
        
        this.load.image("leverRight", "assets/Lever_Right.png");
        this.load.image("leverLeft", "assets/Lever_Left.png");
        this.load.image("wallTrap", "assets/Wall_Trap.png");
        
        this.load.audio("Wilhelm_Scream", "assets/Wilhelm_Scream.ogg");
    }
    
    create() {
        //create input
        this.input.keyboard.addCapture('W,S,A,D,SPACE');
        this.left  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.up    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.down  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        
        //create sound
        this.scream = this.sound.add("Wilhelm_Scream");
        
        //create map
        this.map = this.make.tilemap({key: "map"});
        this.tiles = this.map.addTilesetImage("maze_trap_set", "tiles");
        this.layer_floor = this.map.createLayer(0, this.tiles, 0, 0);
        this.layer_props = this.map.createLayer(1, this.tiles, 0, 0);
        this.layer_wall  = this.map.createLayer(2, this.tiles, 0, 0);
        this.map.setCollisionFromCollisionGroup(true, true);
        this.matter.world.convertTilemapLayer(this.layer_wall);
        
        
        //kills text:
        this.kills_test = this.add.text(
            10, 620,
            "Unique Deaths: "+this.kills
        );
        
        //create map objects
        
        //moving pathway and its spikes
        new Trigger(this, 22, 3, 1, 8, "accelerator", 
            function(pair, scene, player){
                //console.log("ENTER");
                if (player !== null && player !== undefined){
                    player.extraV.y = -7;
                }
            },
            function(pair, scene, player){
                //console.log("EXIT");
                if (player !== null && player !== undefined){
                    player.extraV.y = 0;
                }
            },
        )
        new Trigger(this, 21, 4, 1, 6, "acc_spikes_left", 
            function(pair, scene, player){
                scene.kill("Died to spikes on the accelerator!", "acc_spikes");
            }
        )
        new Trigger(this, 23, 4, 1, 6, "acc_spikes_left", 
            function(pair, scene, player){
                scene.kill("Died to spikes on the accelerator!", "acc_spikes");
            }
        )
        
        //pit 7,5
        new Trigger(this, 7, 5, 1, 1, "pit_spikes", 
            function(pair, scene, player){
                scene.kill("Died to a pit full of spikes!", "pit_spikes");
            }
        )
        //poison 12,16 - 17,18 (1/2 at edge)
        new Trigger(this, 12.5, 16.5, 5, 2, "poison_gas").setTimer(1.2, 
            function(pair, scene, player){
                scene.kill("Breathing poison gas is not good for your health.", "gas");
            }
        )
        //collaping floor 4, 2
        new Trigger(this, 4, 2, 1, 1, "pit_floor").setTimer(0.5, 
            function(pair, scene, player){
                scene.layer_props.putTileAt(20, 4, 2);
                scene.time.addEvent({
                    delay: 0.01,
                    loop: false,
                    callbackScope: this.scene,
                    args: ["Died to a weak floor!", "pit_floor"],
                    callback: scene.kill
                });
            }
        )
        //Wall Axe 15, 5
        new Trigger(this, 15, 5.5, 2, 1.5, "wall_axe",
            function(pair, scene, player){
                scene.layer_props.putTileAt(34, 16, 5);
                scene.layer_props.putTileAt(35, 17, 5);
                scene.layer_props.putTileAt(41, 16, 6);
                scene.layer_props.putTileAt(42, 17, 6);
                scene.time.addEvent({
                    delay: 0.01,
                    loop: false,
                    callbackScope: this.scene,
                    args: ["Died to a weak floor!", "wall_axe"],
                    callback: scene.kill
                });
            }
        )
        
        //Lava //8,5, 8,5
        this.lava_toggle = new Interactable(this, 8.5, 8.5, "leverLeft", 
            function(interactable, scene, player){
                if (interactable.enabled === undefined){
                    interactable.enabled = true;
                }else{
                    interactable.enabled = !interactable.enabled;
                }
                if (interactable.enabled){
                    interactable.image.setTexture("leverRight");
                    //display the lava 2, 14 - 5, 14 (26, 27, 27, 28)
                    scene.layer_props.putTileAt(26, 2, 14);
                    scene.layer_props.putTileAt(27, 3, 14);
                    scene.layer_props.putTileAt(27, 4, 14);
                    scene.layer_props.putTileAt(28, 5, 14);
                }else{
                    interactable.image.setTexture("leverLeft");
                    //hide the lava
                    scene.layer_props.putTileAt(0, 2, 14);
                    scene.layer_props.putTileAt(0, 3, 14);
                    scene.layer_props.putTileAt(0, 4, 14);
                    scene.layer_props.putTileAt(0, 5, 14);
                }
                
            }
        )
        this.lava_toggle.image.setScale(1.5);
        new Trigger(this, 2, 14, 4, 1, "lava",
            function(pair, scene, player){
                console.log(scene.lava_toggle.enabled);
                if (scene.lava_toggle.enabled === true){
                    scene.kill("Burned alive in lava!", "lava");
                }
            }
        )
        
        //wall trap 8.5, 10.6
        new Interactable(this, 8.5, 10.8, "wallTrap", 
            function(interactable, scene, player){
                scene.kill("Ouch! You got sucked into a wall full of spikes!", "wall_trap");
            }
        )
        
        //winstar 19,2
        
        //interactiable graphics
        //this.buttonGraphics = this.add.graphics();
        
        //create player
        this.player = this.matter.add.image(400, 300, "player");
        this.player.setInteractive();
        this.player.on("pointerdown", function(){
            this.scene.kill("You impailed yourself!", "selfclick");
        });
        this.player.setFixedRotation();
        this.player.body.label = "player";
        this.player.setExistingBody(this.player.body);
        this.player.extraV = new Phaser.Math.Vector2(0,0);
        
        
        this.matter.world.on('collisionstart', this.collision);
        //run game setup
        this.setup();
    }
    setup(){
        this.left.isDown  = false;
        this.right.isDown = false;
        this.up.isDown    = false;
        this.down.isDown  = false;
        this.player.setPosition(400, 300)
        this.player.prevPos = new Phaser.Math.Vector2(this.player.x, this.player.y);
        this.player.nomove = 0;
        
        //toggles
        this.lava_toggle.enabled = false;
        if (this.lava_toggle.image !== undefined){
            this.lava_toggle.image.setTexture("leverLeft");
        }
        
        
        //fix the tiles...
        //hole
        this.layer_props.putTileAt(0, 4, 2);
        //axe
        this.layer_props.putTileAt(0, 16, 5);
        this.layer_props.putTileAt(0, 17, 5);
        this.layer_props.putTileAt(0, 16, 6);
        this.layer_props.putTileAt(0, 17, 6);
        //lava
        this.layer_props.putTileAt(0, 2, 14);
        this.layer_props.putTileAt(0, 3, 14);
        this.layer_props.putTileAt(0, 4, 14);
        this.layer_props.putTileAt(0, 5, 14);
    }
    
    update(time, delta) {
        if (this.buttonGraphics !== undefined){
            this.buttonGraphics.clear();
        }
        
        
        
        if (this.player.prevPos.x === this.player.x && this.player.prevPos.y === this.player.y){
            this.player.nomove += delta;
            if (this.player.nomove > (300000)){
                this.kill("You died from old age, standing around like that!", "oldage");
            }
        }else{
            this.player.nomove = 0;
        }
        //update player velocity
        let v = new Phaser.Math.Vector2(0,0);
        if (this.player.extraV !== undefined){
            v.x += this.player.extraV.x;
            v.y += this.player.extraV.y;
        }
        if (this.left.isDown) {v.x -= this.speed;}
        if (this.right.isDown){v.x += this.speed;}
        if (this.up.isDown)   {v.y -= this.speed;}
        if (this.down.isDown) {v.y += this.speed;}
        this.player.setVelocity(v.x, v.y);
        
        //Interactables and Triggers
        for(let i=0;i<this.Interactables.length;i++){
            this.Interactables[i].update(time, delta);
        }
        
        //Animated Tiles
        this.anim_tile_timer += delta;
        let d = this.anim_tile_timer / 50; 
        if (d < 1){
            if (this.layer_props.getTileAt(22, 3, true) !== 21){
                for (let i=3;i<11;i++){
                    this.layer_props.putTileAt(21, 22, i);
                }
            }
        } else if (d < 2){
            if (this.layer_props.getTileAt(22, 3, true) !== 14){
                for (let i=3;i<11;i++){
                    this.layer_props.putTileAt(14, 22, i);
                }
            }
        } else if (d < 3){
            if (this.layer_props.getTileAt(22, 3, true) !== 7){
                for (let i=3;i<11;i++){
                    this.layer_props.putTileAt(7, 22, i);
                }
            }
        } else{
            this.anim_tile_timer = 0;
            for (let i=3;i<11;i++){
                this.layer_props.putTileAt(21, 22, i);
            }
        }
        
        //update Player Prevpos
        this.player.prevPos.setTo(this.player.x, this.player.y);
    }
    
    collision(event){
        /*
        let pairs = event.pairs;
        for(let i=0;i<pairs.length;i++){
            console.log("[" + i + "]: " + 
                pairs[i].bodyA.label + 
                "<->" + pairs[i].bodyB.label + 
                " : " + pairs[i].isSensor
            );
        }
        */
    }
    
    //kill the player
    kill(message, type){
        this.scream.play();
        if (this.killtypes[type] === undefined){
            this.killtypes[type] = true;
            alert("You Have Died!\n"+message);
            this.kills++;
            this.kills_test.setText( "Unique Deaths: "+this.kills);
            //console.log("Kills: "+ this.kills);
        }
        else{
            alert("Dying twice the same way does not count!");
        }
        this.setup();
    }
}

const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 800,
    height: 640,
    scene: MyScene,
    pixelArt: true,
    physics: { 
        default: 'matter',
        arcade: {
            debug: true,
            gravity: {x:0,y:0}
        },
        matter: {
            //debug: {
            //    showBody: true,
            //    showStaticBody: true
            //},
            gravity: {x:0,y:0}
        }
    },
});
