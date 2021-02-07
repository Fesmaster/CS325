import "./phaser.js";

/* This function makes a percent bar using a graphics object
 * that is dedicated to that purpose. 
 */
function UpdateProgressBarH(graphics, x, y, w, h, percent, ticks, color_f, color_t){
    if (percent > 1){percent = 1;}
    graphics.clear();
    if (percent != 0){
        if (color_f == undefined){color_f = 0x00FF00;}
        graphics.fillStyle(color_f);
        graphics.fillRect(x, y, w*percent, h);
    }
    if (percent != 1){
        graphics.fillStyle(0x666666);
        graphics.fillRect(x+w*percent, y, w - (w*percent), h);
    }
    
    if (ticks != undefined){
        if (color_t == undefined){color_t = 0xFF0000;}
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
    graphics.clear();
    if (percent != 0){
        if (color_f == undefined){color_f = 0x00FF00;}
        graphics.fillStyle(color_f);
        graphics.fillRect(x, y+ (h-(h*percent)), w, (h*percent));
    }
    if (percent != 1){
        graphics.fillStyle(0x666666);
        graphics.fillRect(x, y, w, h-(h*percent))
    }
    if (ticks != undefined){
        if (color_t == undefined){color_t = 0xFF0000;}
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
        
        this.ProgressBars = [];
        this.TargetBars = [];
        this.percents = [];
        this.percents_tv = [];
        
        this.targets = [];
        this.target_dev = [];
        for(var i=0;i<4;i++){
            this.targets[i] = lerp(0.25, 0.75, Math.random());
            this.target_dev[i] = lerp(0.05, 0.125, Math.random());
        }
        this.barLableList = ["Color", "Smell", "Acidity", "Viscosity"];
        
        
        this.FillBar = null;
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
        ]
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
        this.load.image("cauldron", "assets/Cauldron.png")
        this.load.image("fluid", "assets/Cauldron_Fluid.png")
        
        //load all the item images
        for(var i=0;i<this.Items.length;i++){
            this.load.image(this.Items[i].img, "assets/"+this.Items[i].img+".png")
        }
    }
    
    buttonPress(index){
        //disable input on win/loose
        if (!this.inputEnabled){return;}
        
        //get the item in the button, and modify the four bars to show it's changes
        //this.ButtonItems[index]
        for(var i = 0;i<4;i++){
            this.percents_tv[i] += 0.05 * this.Items[this.ButtonItems[index]][i];
        }
        
        
        //increase the fill on the fill percent bar
        this.FillPercent_tv += this.FillPerClick;
    }
    
    create() {
        
        //add the buttons
        for (var i = 0; i<4;i++){
            var b = this.add.image(125 + i*175, 475, this.Items[0].img);
            //this.ButtonItems[i] = i;
            //(125 + i*175, 475, 100, 100, 0x0077FF);
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
        for (var i = 0; i<4;i++){
            this.percents[i] = 0.0;
            this.percents_tv[i] = 0.0;
            
            this.add.text(425, 20+80*i, this.barLableList[i], {color : '#0f0'})
            
            var b = this.add.graphics();
            UpdateProgressBarH(b, 425, 40 + 80 * i, 335, 20, this.percents[i]);
            this.ProgressBars[i] = b;
            
            var t = this.add.graphics();
            UpdateProgressRangeBarH(t, 425, 30 + 80*i, 335, 40, 
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
        
        //add ProgressBar next to it
        this.FillBar = this.add.graphics();
        UpdateProgressBarV(this.FillBar, 
                           285, 50, 50, 250, 
                           this.FillPercent, 
                           8, 
                           this.fluid_color, 0xDDDDDD);
        //
        
        
        
    }
    
    update() {
        
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
                UpdateProgressBarH(this.ProgressBars[i], 425, 40 + 80 * i, 335, 20, this.percents[i]);
            }
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
        UpdateProgressBarV(this.FillBar, 285, 50, 50, 250, this.FillPercent, 8, this.fluid_color, 0xDDDDDD);
        
        
        //check loose condition
        if (this.FillPercent > 1){
            this.FillPercent = 1;
            this.add.text(35, 200, "YOU LOOSE!", {color: "#fff", fontSize: "128px"})
            this.add.text(90, 325, "Container Overflow gets the best of all of us!", 
                          {color: "#fff", fontSize: "24px"})
            this.inputEnabled = false;
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
            this.add.text(100, 200, "YOU WIN!", {color: "#fff", fontSize: "128px"})
            this.inputEnabled = false;
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
