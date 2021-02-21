import "./phaser.js";

const GRAVITY = 0.001;


class PhysicsBody{
    constructor(scene, x, y, image){
        this.vel = new Phaser.Math.Vector2(0, 0);
        this.acc = new Phaser.Math.Vector2(0, GRAVITY);
        this.scene = scene;
        this.maxVelX = -1;
        this.maxVelY = -1;
        this.newvel = false;
        this.image = scene.matter.add.sprite(x, y, image);
        this.image.setIgnoreGravity(true);
        
        this.lastPos = null;
        this.lastDelta = 1;
        
        //add this to the list of bodies
        //tries to add to the first possible index if there is a hole, so that adding and removing bodies is kind of smooth.
        if (this.scene.bodies === undefined){
            this.scene.bodies = [];
        }
        if (this.scene.bodies_hole === undefined){
            this.scene.bodies_hole = false;
        }
        if (scene.body_hole){
            let added = false;
            for (let i = 0;i<scene.bodies.length;i++){
                if (scene.bodies[i] === undefined){
                    scene.bodies[i] = this;
                    this.index = i;
                    added = true;
                    break;
                }
            }
            if (added === false){
                this.index = scene.bodies.push(this)-1;
                scene.body_hole = false;
            }
        }
        this.index = scene.bodies.push(this)-1;
    }
    
    update(time, delta){
        //fix weird rotating bugs
        this.image.setAngle(0);
        
        //update velocity Information
        //if the object has barely moved, then set velocity to 0
        
        if (this.lastPos !== null && !this.newvel){
            //console.log("UPDATE")
            let p = this.calcVelocity()
            if (Math.abs(p.x) < 0.1){
                this.vel.x = 0;
            }
            if (Math.abs(p.y) < 0.1){
                this.vel.y = 0;
            }
        }
        if (this.newvel){this.newvel = false;}
        
        //this.vel.add(this.acc.clone().multiply(delta/1000));
        let vx = this.vel.x;
        if (this.acc.x != 0){
            vx +=  this.acc.x * (delta / 1000);
        }
        this.vel.x = vx;
        
        let vy = this.vel.y;
        if (this.acc.y != 0){
            vy += this.acc.y * (delta / 1000);
        }
        this.vel.y = vy;
        
        //if (this.maxVel >= 0){
        //    this.vel.limit(this.maxVel);
        //}
        if (Math.abs(this.vel.x) > this.maxVelX && this.maxVelX !== -1){
            if (this.vel.x < 0){
                this.vel.x = -this.maxVelX;
            }else{
                this.vel.x = this.maxVelX;
            }
        }
        if (Math.abs(this.vel.y) > this.maxVelY && this.maxVelY !== -1){
            if (this.vel.y < 0){
                this.vel.y = -this.maxVelY;
            }else{
                this.vel.y = this.maxVelY;
            }
        }
        
        //final update steps
        this.image.setVelocity(this.vel.x, this.vel.y);
        this.lastPos = new Phaser.Math.Vector2(this.image.x, this.image.y);
        this.lastDelta = delta;
    }
    
    destroy(){
        //remove the body from the list in the scene.
        if (this.index+1 === scene.bodies.length){
            scene.bodies.pop(); //no delete if this is the last element. simple pop, so future adds are faster
        }else{
            delete scene.bodies[this.index]; //yes, yes, leaves an undefined hole... I don't care
            scene.body_hole = true;
        }
        
        this.image.destroy();
        
    }
    calcVelocity(){
        if (this.lastPos != null){
            //console.log("TEST")
            let p = new Phaser.Math.Vector2(this.image.x, this.image.y);
            p.subtract(this.lastPos);
            p.x *= 1/(this.lastDelta/1000);
            p.y *= 1/(this.lastDelta/1000);
            return p;
        }else{
            return new Phaser.Math.Vector2(0,0);
        }
    }
    
    //these SMALL functions are missing from ALL of phaser's physics assets. Its really absurd.
    getVelocity(){return this.vel.clone();}
    setVelocity(x, y){this.vel.setTo(x, y);this.newvel = true;}
    setVelocityX(x){this.vel.x = x;this.newvel = true;}
    setVelocityY(y){this.vel.y = y;this.newvel = true;}
    setVelocityVec(v){this.vel.setTo(v.x, v.y);this.newvel = true;}
    getAcceleration(){return this.acc.clone();}
    setAcceleration(x, y){this.acc.setTo(x, y);}
    setAccelerationX(x){this.acc.x = x;}
    setAccelerationY(y){this.acc.y = y;}
    setAccelerationVec(v){this.acc.setTo(v.x, v.y);}
    getPosition(){return new Phaser.Math.Vector2(this.image.x, this.image.y);}
    setPosition(x, y){this.image.setPosition(x, y);}
    setPositionVec(v){this.image.setPosition(v.x, v.y);}
}

class MyScene extends Phaser.Scene {
    
    constructor() {
        super();
        
        this.left  = null;
        this.right = null;
        this.up = null;
        this.down = null;
        this.space = null;
        
        this.acc_speed = 500;
        this.break_speed = 5000;
        this.jump_vel = 350;
        
        this.player = null;
        this.platforms = [];
        this.platformCount = 3;
        this.platformSpeed = 20;
        
        this.body_hole = false;
        this.bodies = [];
    }
    
    preload() {
        // Load an image and call it 'logo'.
        this.load.image( 'logo', 'assets/FesmasterLogo.jpg' );
        this.load.spritesheet("player", "assets/Player.png", {frameWidth: 64, frameHeight: 64});
        
    }
    
    create() {
        
        // Create a sprite at the center of the screen using the 'logo' image.
        //this.player = this.matter.add.image(this.cameras.main.centerX, this.cameras.main.centerX, 'logo');
        this.player = new PhysicsBody(this, this.cameras.main.centerX, this.cameras.main.centerX, 'player');
        //this.player.image.setScale(2);
        this.player.maxVelX = 100;
        this.player.maxVelY = 500;
        this.player.setAccelerationY(980);
        
        // Make it bounce off of the world bounds.
        this.matter.world.setBounds();
        this.player.image.setFriction(0.9,0.9,0.9);
        this.player.image.setBounce(0);
        //this.player.setVelocity(3, 1);
        
        // Make the camera shake when clicking/tapping on it.
        this.player.image.setInteractive();
        //this.player.on( 'pointerdown', function( pointer ) {
        //    this.scene.cameras.main.shake(500);
        //});
        
        this.generatePlatform();
        
        
        //load animations
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
        
        
        this.input.keyboard.addCapture('W,S,A,D,SPACE');
        this.left  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.up    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    }
    
    update(time, delta) {
        
        //movement controls
        let acc = 0;
        if (this.left.isDown){
            acc -= this.acc_speed;
            //this.player.image.anims.play("WalkLeft", true);
        }
        if (this.right.isDown){
            acc += this.acc_speed;
            //this.player.image.anims.play("WalkRight", true);
        }
        if (!(this.right.isDown || this.left.isDown)){
            let v = this.player.getVelocity();
            if (Math.abs(v.x) < this.break_speed*(delta/1000)){
                //this.player.setAccelerationX(0);
                if (this.player.getVelocity().x !== 0){
                    this.player.setVelocityX(0);
                }
            }else if (v.x > 0){
                acc -= this.break_speed;
            }else if (v.x < 0){
                acc += this.break_speed;
            }
            //this.player.image.anims.play("WalkRight", true);
        }
        this.player.setAccelerationX(acc);
        if (this.up.isDown){
            //console.log(this.player.calcVelocity().y);
            if (Math.abs(this.player.calcVelocity().y) < 0.1){
                this.player.setVelocityY(-this.jump_vel);
            }
        }
        
        
        //move the platforms
        for (let i = 0;i<this.platforms.length;i++){
        //    this.platforms[i].x -= this.platformSpeed * (delta / 1000);
            //this.platforms[i].setVelocityY(0);
        }
        if (this.platforms[0].x < 0){
            this.platforms.shift();
            this.generatePlatform();
        }
        
        
        //update all physics bodies
        for(let i=0;i<this.bodies.length;i++){
            this.bodies[i].update(time, delta);
        }
        
    }
    
    generatePlatform(){
        //let width = 200 + Math.floor(Math.random() * 400);
        //let posy = 200 + Math.floor(Math.random() * 300);
        let width = 400;
        let posy = 450;
        
        let p = this.matter.add.rectangle(400 + (width/2), posy, width, 50, {isStatic: true});//{isStatic: true}
        this.matter.add.rectangle((width/2), posy - 200, width, 50, {isStatic: true})
        //p.setIgnoreGravity(true);
        //p.setVelocityX(-this.platformSpeed);
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
        default: 'matter',
        matter: {
            debug: {
                showBody: true,
                showStaticBody: true,
                showVelocity: true,
            }
        }
    },
});
