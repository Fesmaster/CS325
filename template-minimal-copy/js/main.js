import "./phaser.js";

// You can copy-and-paste the code from any of the examples at https://examples.phaser.io here.
// You will need to change the `parent` parameter passed to `new Phaser.Game()` from
// `phaser-example` to `game`, which is the id of the HTML element where we
// want the game to go.
// The assets (and code) can be found at: https://github.com/photonstorm/phaser3-examples
// You will need to change the paths you pass to `this.load.image()` or any other
// loading functions to reflect where you are putting the assets.
// All loading functions will typically all be found inside `preload()`.

// The simplest class example: https://phaser.io/examples/v3/view/scenes/scene-from-es6-class

class MyScene extends Phaser.Scene {
    
    constructor() {
        super();
        
        this.bouncy = null;
    }
    
    preload() {
        // Load an image and call it 'logo'.
        this.load.image( 'logo', 'assets/FesmasterLogo.jpg' );
    }
    
    create() {
        
        // Create a sprite at the center of the screen using the 'logo' image.
        this.bouncy = this.matter.add.image(this.cameras.main.centerX, this.cameras.main.centerX, 'logo');
        this.bouncy.setScale(0.25);
        
        
        // Make it bounce off of the world bounds.
        this.matter.world.setBounds().disableGravity();
        this.bouncy.setFriction(0.1,0.1,0.1);
        this.bouncy.setBounce(1);
        //this.bouncy.setVelocity(3, 1);
        
        // Make the camera shake when clicking/tapping on it.
        this.bouncy.setInteractive();
        this.bouncy.on( 'pointerdown', function( pointer ) {
            this.scene.cameras.main.shake(500);
        });
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        let style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        let text = this.add.text( this.cameras.main.centerX, 15, "Hello, from Stephen Kelly.", style );
        text.setOrigin( 0.5, 0.0 );
    }
    
    update() {
        // Accelerate the 'logo' sprite towards the cursor,
        // accelerating at 500 pixels/second and moving no faster than 500 pixels/second
        // in X or Y.
        // This function returns the rotation angle that makes it visually match its
        // new trajectory.

        let angle = Phaser.Math.Angle.Between(this.bouncy.x, this.bouncy.y, this.game.input.activePointer.x + this.cameras.main.scrollX, this.game.input.activePointer.y + this.cameras.main.scrollY);
        
        let targetAngle = (360 / (2 * 3.13159)) * angle + 90;
        
        let bpos = new Phaser.Math.Vector2(this.bouncy.x, this.bouncy.y);
        let dist = bpos.distanceSq(new Phaser.Math.Vector2(this.input.activePointer.x, this.input.activePointer.y));
        if(targetAngle < 0)
            targetAngle += 360;
        this.bouncy.setAngle(targetAngle);
        if (dist > 10)
            this.bouncy.thrustLeft(0.1);
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
                showStaticBody: true
            }
        }
    },
});
