import "./phaser.js";

/* This function makes a percent bar using a graphics object
 * that is dedicated to that purpose. 
 */
function UpdateProgressBarH(graphics, x, y, w, h, percent, ticks, color_f, color_t){
    if (percent > 1){percent = 1;}
    graphics.fillStyle(0x666666);
    graphics.fillRect(x-2, y-2, w+4, h+4);
    if (percent != 0){
        if (color_f == undefined){color_f = 0x00FF00;}
        graphics.fillStyle(color_f);
        graphics.fillRect(x, y, w*percent, h);
    }
    if (ticks != undefined){
        if (color_t == undefined){color_t = 0xDDDDDD;}
        var tickDist = 1.0 / ticks;
        graphics.lineStyle(1, color_t);
        for (var i = 0;i<ticks+1;i++){
            graphics.lineBetween(x + tickDist*i*w, y + h/2, x+tickDist*i*w, y + h);
        }
    }
}

function UpdateProgressRangeBarH(graphics, x, y, w, h, percent_low, percent_high, color){
    if (percent_low < 0){percent_low = 0;}
    if (percent_low > 1){percent_low = 1;}
    if (percent_high < 0){percent_high = 0;}
    if (percent_high > 1){percent_high = 1;}
    if (color == undefined){color = 0xFF0000;}
    graphics.lineStyle(2, color);
    graphics.strokeRect(x + w*percent_low, y, w * (percent_high - percent_low), h)
    
}

function UpdateProgressBarV(graphics, x, y, w, h, percent, ticks, color_f, color_t){
    if (percent > 1){percent = 1;}
    graphics.fillStyle(0x666666);
    graphics.fillRect(x-2, y-2, w+4, h+4)
    if (percent != 0){
        if (color_f == undefined){color_f = 0x00FF00;}
        graphics.fillStyle(color_f);
        graphics.fillRect(x, y+ (h-(h*percent)), w, (h*percent));
    }
    if (ticks != undefined){
        if (color_t == undefined){color_t = 0xDDDDDD;}
        var tickDist = 1.0 / ticks;
        graphics.lineStyle(1, color_t);
        for (var i = 0;i<ticks+1;i++){
            graphics.lineBetween(x + w/2 , y + + tickDist*i*h, x + w, y +tickDist*i*h);
        }
    }
}

function CheckTargetDev(check, target, dev){
    return check >= target - (dev/2) && check <= target + (dev/2)
}

function lerp(a, b, alpha){
    if (alpha > 1){alpha = 1;}
    if (alpha < 0){alpha = 0;}
    return a*alpha + b * (1-alpha)
}


class AlchemistScene extends Phaser.Scene {
    
    constructor() {
        super();
        //this.graphics = null;
        
        this.Buttons = [];
        this.ButtonItems = [];
        this.reloadButton = null;
        
        this.BAR = null; //this draws ALL the progressbars
        
        this.percents = [];
        this.percents_tv = [];
        this.percentPerClick = 0.05;
        
        this.targets = [];
        this.target_dev = [];
        this.barLableList = ["Color", "Smell", "Acidity", "Viscosity"];
        
        this.FillPercent = 0.0;
        this.FillPercent_tv = 0.0;
        this.FillPerClick = 0.01;
        
        this.fluid = null;
        this.fluid_color = 0x76E7FF;
        
        this.ProgressBarSpeed = 0.005;
        
        this.inputEnabled = true;
        
        this.Items = [
            //affects one
            {img: "item_00", 0: 1, 1: 0, 2: 0, 3: 0},
            {img: "item_01", 0: 0, 1: 0, 2: 0, 3: 1},
            {img: "item_02", 0: 0, 1: 1, 2: 0, 3: 0},
            {img: "item_03", 0: 0, 1: 0, 2: 1, 3: 0},
            //affects two
            {img: "item_04", 0: 1, 1: -1, 2: 0, 3: 0},
            {img: "item_05", 0: 0, 1: 0, 2: 1, 3: -1},
            {img: "item_06", 0: 0, 1: 1, 2: -1, 3: 0},
            {img: "item_07", 0: -1, 1: 0, 2: 0, 3: 1},
            //affects three
            {img: "item_08", 0: 0, 1: -1, 2: -1, 3: 2},
            {img: "item_09", 0: -1, 1: -1, 2: 2, 3: 0},
            {img: "item_10", 0: 2, 1: 0, 2: -1, 3: -1},
            {img: "item_11", 0: -1, 1: 2, 2: 0, 3: -1},
        ];
        
        this.audio_on = false;
        this.SoundSplash = null;
        this.SoundOverflow = null;
        
        this.winText = null;
        this.looseText = null;
    }
    
    resetGame(){
        //reset everythong
        
        for(var i=0;i<4;i++){
            this.percents[i] = 0.0;
            this.percents_tv[i] = 0.0;
            this.targets[i] = lerp(0.25, 0.75, Math.random());
            this.target_dev[i] = lerp(0.05, 0.125, Math.random());
        }
        this.FillPercent = 0;
        this.FillPercent_tv = 0.0;
        if (this.winText != null){
            this.winText.destroy();
        }
        if (this.looseText != null){
            this.looseText.destroy();
        }
        if (this.reloadButton != null){
            this.reloadButton.setVisible(false);
        }
        this.inputEnabled = true;
    }
    
    setButtonAttrib(id){
        if (id < 0 || id > 3){return;}
        var rand = -1;
        var check = false
        while(!check){
            rand = Math.floor(Math.random()*this.Items.length);
            check = true;
            for (var i=0;i<4;i++){
                if (this.ButtonItems[i] == rand){ //includes this current button, so no unchanging items
                    check = false;
                    continue;
                }
            }
        }
        this.Buttons[id].setTexture(this.Items[rand].img);
        this.ButtonItems[id] = rand;
    }
    
    preload() {
        this.load.image("cauldron", "assets/Cauldron.png");
        this.load.image("fluid", "assets/Cauldron_Fluid.png");
        this.load.image("reload", "assets/Reload.png");
        //load all the item images
        for(var i=0;i<this.Items.length;i++){
            this.load.image(this.Items[i].img, "assets/"+this.Items[i].img+".png");
        }
        
        this.load.audio("splash", "assets/Splash.wav");
        this.load.audio("overflow", "assets/Overflow.mp3");
    }
    
    buttonPress(index){
        if (!this.audio_on){
            this.sound.context.resume();
            this.audio_on = true;
        }
        
        //disable input on win/loose
        if (!this.inputEnabled){
            if (index == -1){//-1 is the index of the reload button
                this.resetGame();
            }
            return;
        }else if (index == -1){
            return; //the reload button was pressed 
        }
        
        //get the item in the button, and modify the four bars to show it's changes
        //this.ButtonItems[index]
        for(var i = 0;i<4;i++){
            this.percents_tv[i] += this.percentPerClick * this.Items[this.ButtonItems[index]][i];
        }
        
        //increase the fill on the fill percent bar
        this.FillPercent_tv += this.FillPerClick;
        
        //play sound
        this.SoundSplash.play();
    }
    
    create() {
        //reset the game
        this.resetGame();
        
        //add the buttons
        for (var i = 0; i<4;i++){
            var b = this.add.image(125 + i*175, 475, this.Items[0].img);
            b.setScale(3.125);
            b.setInteractive();
            b.buttonIndex = i;
            b.on("pointerover", function(){this.setScale(3.225);});
            b.on("pointerout", function(){this.setScale(3.125);});
            b.on("pointerup", function(){this.setScale(3.225);});
            b.on("pointerdown", function(){
                this.setScale(3.025);
                this.scene.buttonPress(this.buttonIndex);
                this.scene.setButtonAttrib(this.buttonIndex);
            });
            this.Buttons[i] = b;
            this.setButtonAttrib(i);
        }
        
        
        
        
        //add the progressbars
        this.BAR = this.add.graphics();
        for (var i = 0; i<4;i++){
            this.add.text(425, 20+80*i, this.barLableList[i], {color : '#0f0'})
            UpdateProgressBarH(this.BAR, 425, 40 + 80 * i, 335, 20, this.percents[i]);
            UpdateProgressRangeBarH(this.BAR, 425, 30 + 80*i, 335, 40, 
                this.targets[i] - (this.target_dev[i]/2),
                this.targets[i] + (this.target_dev[i]/2),
                0xFF0000
            )
            
        }
        
        //add cauldron fluid
        this.fluid = this.add.image(175, 175, 'fluid');
        this.fluid.setTint(this.fluid_color);
        //add cauldron on top 
        //(why? the cauldron has a hole to let the fluid be seen through, this grounds it well.)
        this.add.image(175, 175, 'cauldron');
        
        UpdateProgressBarV(this.BAR, 
            285, 50, 50, 250, 
            this.FillPercent, 
            8, 
            this.fluid_color, 0xDDDDDD
        );
        
        this.SoundSplash = this.sound.add("splash");
        this.SoundOverflow = this.sound.add("overflow");
        
        //reload button
        //last, so drawn on top!
        this.reloadButton = this.add.image(100, 100, "reload");
        this.reloadButton.setInteractive();
        this.reloadButton.buttonIndex = -1;
        this.reloadButton.on("pointerover", function(){this.setScale(1.1);});
        this.reloadButton.on("pointerout", function(){this.setScale(1);});
        this.reloadButton.on("pointerup", function(){this.setScale(1.1);});
        this.reloadButton.on("pointerdown", function(){
            this.setScale(0.9);
            this.scene.buttonPress(this.buttonIndex);
        });
        this.reloadButton.setVisible(false);
    }
    
    update() {
        
        this.BAR.clear(); //clear the graphics item
        
        //update the progressbars
        for (var i=0;i<4;i++){
            if (this.percents_tv[i] > 1){this.percents_tv[i] = 1;}
            if (this.percents_tv[i] < 0){this.percents_tv[i] = 0;}
            
            var diff = this.percents[i] - this.percents_tv[i]
            if (diff != 0){
                if (Math.abs(diff) < this.ProgressBarSpeed){
                    this.percents[i] = this.percents_tv[i];
                }else{
                    if (diff < 0){
                        this.percents[i] += this.ProgressBarSpeed;
                    }else{
                        this.percents[i] -= this.ProgressBarSpeed;
                    }
                }
                if (this.percents[i] > 1){this.percents[i] = 1;}
                if (this.percents[i] < 0){this.percents[i] = 0;}
            }
            UpdateProgressBarH(this.BAR, 425, 40 + 80 * i, 335, 20, 
                this.percents[i], 
                1/this.percentPerClick
            );
            UpdateProgressRangeBarH(this.BAR, 425, 30 + 80*i, 335, 40, 
                this.targets[i] - (this.target_dev[i]/2),
                this.targets[i] + (this.target_dev[i]/2),
                0xFF0000
            )
        }
        
        //COLOR CHANGING!
        const color = new Phaser.Display.Color();
        color.setFromHSV(this.percents[0]+0.5, 1, 1);
        this.fluid_color = color.color;
        
        //update the tint of the fluid in the cauldron
        this.fluid.setTint(this.fluid_color);
        
        //update the fill bar
        if (this.FillPercent_tv < 0){this.FillPercent_tv = 0;}
        var Filldiff = this.FillPercent - this.FillPercent_tv;
        if (Filldiff != 0){
            if (Math.abs(Filldiff) < this.ProgressBarSpeed){
                this.FillPercent = this.FillPercent_tv;
            }else{
                if (Filldiff < 0){
                    this.FillPercent += this.ProgressBarSpeed;
                }else{
                    this.FillPercent -= this.ProgressBarSpeed;
                }
            }
            if (this.FillPercent < 0){this.FillPercent = 0;}
        }
        UpdateProgressBarV(this.BAR, 285, 50, 50, 250, this.FillPercent, 8, this.fluid_color);
        
        if (this.inputEnabled){
            //check loose condition
            if (this.FillPercent > 1){
                this.FillPercent = 1;
                this.winText = this.add.text(35, 200, "YOU LOOSE!", {color: "#fff", fontSize: "128px"})
                this.looseText = this.add.text(90, 325, "Container Overflow gets the best of all of us!", 
                        {color: "#fff", fontSize: "24px"})
                this.SoundOverflow.play();
                this.inputEnabled = false;
                this.reloadButton.setVisible(true);
            }
            
            //check for win condition
            
            var win = true;
            for (var i=0;i<4;i++){
                if (!(CheckTargetDev(this.percents[i], this.targets[i], this.target_dev[i]))){
                    win = false;
                    break;
                }
            }
            if (win){
                this.winText = this.add.text(100, 200, "YOU WIN!", {color: "#fff", fontSize: "128px"})
                this.inputEnabled = false;
                this.reloadButton.setVisible(true);
            }
        }
        
        
    }
}

const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 800,
    height: 600,
    scene: AlchemistScene,
    pixelArt: true,
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
