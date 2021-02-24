import "./phaser.js";

const GRAVITY = 0.001;

function getObjectPos(sprite){
    return new Phaser.Math.Vector2(sprite.x, sprite.y);
}

class Enemy{
    constructor(scene, x, y){
        this.scene = scene;
        this.sprite = this.scene.physics.add.sprite(x, y, "enemy");
        this.sprite.setFriction(0.9,0.9,0.9);
        this.sprite.setBounce(0);
        this.sprite.setCollideWorldBounds(false);
        //add collisions
        //this.scene.physics.add.collider(this.sprite, this.scene.ground);
        for(let i = 0;i<this.scene.platforms.length;i++){
            this.scene.physics.add.collider(this.sprite, this.scene.platforms[i]);
        }
        //add to the scene
        this.scene.enemies.push(this);
    }
    destroy(){
        this.sprite.destroy();
    }
    kill(){
        this.scene.points++;
        this.sprite.setPosition(-1000, -1000); //well into the kill zone.
    }
    update(){
        //?
    }
}

class MyScene extends Phaser.Scene {
    
    constructor() {
        super();
        
        this.points = 0;
        
        this.left  = null;
        this.right = null;
        this.up = null;
        this.down = null;
        this.space = null;
        
        this.speed = 250;
        this.jump_vel = 800;
        
        this.player = null;
        
        this.ground = null;
        
        this.platforms = [];
        this.platformTimer = 0;
        this.platformTimerNext = 0
        
        this.enemies = [];
        this.enemyTimer = 0;
        this.enemyTimerNext = 1000
        
    }
    
    preload() {
        // Load an image and call it 'logo'.
        this.load.image( 'ground', 'assets/TestGround.png' );
        this.load.spritesheet("player", "assets/Player.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet("enemy", "assets/Enemy.png", {frameWidth: 64, frameHeight: 64});
    }
    
    create() {
        
        //setup physics world
        this.physics.world.setBounds(0, 0, 800, 600);
        this.physics.world.setBoundsCollision(true, true, true, true);
        
        
        //create the ground and platforms
        this.ground = this.physics.add.staticGroup();
        
        this.ground.create(400, 568, 'ground'); //.setScale(2).refreshBody();
        
        //create the moving invader platforms
        
        
        //create the player sprite and setup its physics.
        this.player = this.physics.add.sprite(850, 150, "player");
        
        this.player.setFriction(0.9,0.9,0.9);
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);
        this.player.setInteractive();
        
        //create physics collisions
        this.physics.add.collider(this.player, this.ground);
        
        
        
        
        //create animations
        this.anims.create({
            key: "WalkRight",
            frame: this.anims.generateFrameNumbers("player", {start: 0, end: 8}),
            frameRate: 10,
            repeat: -1,
        });
        this.anims.create({
            key: "WalkLeft",
            frame: this.anims.generateFrameNumbers("player", {start: 9, end: 17}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: "AttackRight",
            frame: this.anims.generateFrameNumbers("player", {start: 18, end: 23}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: "AttackLeft",
            frame: this.anims.generateFrameNumbers("player", {start: 27, end: 32}),
            frameRate: 10,
            repeat: -1
        });
        
        //setup keyboard input events
        this.input.keyboard.addCapture('W,S,A,D,SPACE');
        this.left  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.up    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        this.input.on("pointerdown", function(){
            this.scene.mousePress();
        })
    }
    
    mousePress(){
        let ppos = getObjectPos(this.player);
        for(let i =0;i<this.enemies.length;i++){
            let epos = getObjectPos(this.enemies[i].sprite);
            epos.subtract(ppos);
            if (epos.lengthSq() < 2500){ // 50 * 50
                this.enemies[i].kill();
            }
        }
    }
    
    update(time, delta) {
        
        //movement controls
        let vx = 0;
        if (this.left.isDown){
            vx -= this.speed;
            //console.log("LEFT");
            //this.player.anims.play("WalkLeft", true);
        }
        if (this.right.isDown){
            vx += this.speed;
            //console.log("RIGHT");
            //this.player.anims.play("WalkRight", true);
        }
        this.player.setVelocityX(vx);
        //jump
        if ((this.space.isDown || this.up.isDown) && this.player.body.touching.down){// && this.player.body.touching.down
            this.player.setVelocityY(-this.jump_vel);
        }
        
        //kill enemies that are at the same position as the player
        /*if (this.space.isDown){
            let ppos = getObjectPos(this.player);
            for(let i =0;i<this.enemies.length;i++){
                let epos = getObjectPos(this.enemies[i].sprite);
                epos.subtract(ppos);
                if (epos.lengthSq() < 2500){ // 50 * 50
                    this.enemies[i].kill();
                }
            }
        }*/
            
        
        
        //Moving Platform Stuff
        this.platformTimer += delta;
        if (this.platformTimer >= this.platformTimerNext){
            this.createPlatform();
            this.platformTimer = 0;
            this.platformTimerNext = 2000 + Math.floor(Math.random() * 4000);
        }
        
        if (this.platforms.length > 0){
            //destroy left-most platform, if off the screen
            if (this.platforms[0].x < -200){
                this.platforms[0].destroy();
                this.platforms.shift();
            }
            //make sure they stay moving!
            for(let i=0;i<this.platforms.length; i++){
                this.platforms[i].setVelocityX(this.platforms[i].velx);
            }
        }
        
        
        //update enemies
        this.enemyTimer += delta;
        if (this.enemyTimer >= this.enemyTimerNext){
            //this.createPlatform();
            new Enemy(this, 700, 100);
            console.log(this.enemies.length);
            this.enemyTimer = 0;
            this.enemyTimerNext = 2000 + Math.floor(Math.random() * 4000);
        }
        for (let i = 0;i<this.enemies.length;i++){
            this.enemies[i].update(time, delta);
        }
        if (this.enemies.length > 0){
            if (this.enemies[0].sprite.x < -100 || this.enemies[0].sprite.y > 1000){
                this.enemies[0].destroy();
                this.enemies.shift(); //remove first if it is rightmost.
            }
        }
        
    }
    
    createPlatform(){
        //console.log(this.platforms.length);
        let h = 200 + Math.floor(Math.random() * 200);
        let p = this.physics.add.image(1000, h, "ground").setScale(0.5).refreshBody();
        let v = 50+Math.floor(Math.random() * 50);
        p.setImmovable(true);
        p.body.allowGravity = false;
        p.velx = -v
        p.setVelocityX(-v);
        this.physics.add.collider(this.player, p);
        for(let i = 0;i<this.enemies.length;i++){
            this.physics.add.collider(this.enemies[i], p);
        }
        
        this.platforms.push(p);
    }
}

const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 800,
    height: 600,
    scene: MyScene,
    physics: { 
        default: 'arcade',
        arcade: {
            //debug: true,
            gravity: {y:1600}
            /*{
                
                showBody: true,
                showStaticBody: true,
                showVelocity: true,
            }*/
        }
    },
});
