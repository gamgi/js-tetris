//** A simple game engine **
function TimerClass( targetFPS, updateFunction) {
    /**
     * Private
     */
    // Animationrequests
    var requestId;
    // Timing
    var tFrame = 1000 / targetFPS;
    var tLeftover = 0;
    var tLast = performance.now();
    /**
      * Public
      */
    this.logicFrames = 0;
    /**
     * Methods
     */
    function requestHandler() {
        requestAnimationFrame( requestHandler);
        updateFunction.call();
    }
    this.update = function() {
        var tNow = performance.now();
        var tSinceUpdate = tNow - tLast + tLeftover;
        // Amount of frames to calculate this pass
        this.logicFrames = Math.floor( tSinceUpdate / tFrame);
        // Leftover due to fractional amount of frames
        tLeftover = tSinceUpdate - this.logicFrames * tFrame;
        tLast = performance.now();
    }
    this.start = function() {
        tLast = performance.now();
        requestId = requestAnimationFrame( requestHandler);
    }
}

function VisualClass(canvasId, width, height) {
    /**
     * Private
     */
    var display = { canvas: undefined,
                    ctx: undefined};
    /**
     * Methods
     */
    this.init = function() {
        display.canvas = document.getElementById(canvasId);
        display.ctx = display.canvas.getContext('2d');
        display.canvas.width = width; // this sets pixel amount to correct
        display.canvas.height = height; // no blurring
        //display.width = display.canvas.width;
        //display.height = display.canvas.height;
    }
    this.clear = function() {
        display.ctx.clearRect( 0, 0, display.width, display.height);
    }
    this.color = function( fillstyle){
        display.ctx.fillStyle = fillstyle;
    };
    this.rectangle = function( x, y, w, h) {
        var vertexArray = [[x,y],[x+w,y],[x+w,y+h],[x, y+h]];
        display.ctx.beginPath();
        display.ctx.moveTo(vertexArray[0][0], vertexArray[0][1]);
        for (var i=1; i<vertexArray.length; i++){
            display.ctx.lineTo(vertexArray[i][0], vertexArray[i][1]);
        }
        display.ctx.closePath();
        display.ctx.fill();
    };
    this.text = function( text, x, y) {
        display.ctx.fillText( text, x, y);
    }
    /**
     * Constructor
     */
    //this.init();
}

function InputClass() {
    /**
     * Private
     */
    var pressed = {};
    var released = {};
    /**
     * Methods
     */
    this.pollKeys = function() {
        //var result = [];
        var keys = Object.keys( pressed);
        //var keysR = Object.keys( released);
        /*for (var i = pressed.length; i>0; --i) {
            if (keysR.indexOf(keysP[i]) == -1) {
                result.push( keysP[i]);
                keysP.splice( i, 1);
                keysP.splice( i, 1);
            }
        }*/
        pressed = {};
        return keys;
    }
    function onKeyDown( event) {
        if (pressed[ event.keyCode] == undefined && released[ event.keyCode] != false){
            pressed[ event.keyCode] = true;
            released[ event.keyCode] = false;
        }
    }
    function onKeyUp( event) {
        delete pressed[ event.keyCode];
        pressed[ -event.keyCode] = true; //Key "ups" denoted with negative code
        released[ event.keyCode] = true; //By keeping track of this, a long press will not result in an autofeed of characters
    }
    /**
     * Constructor
     */
    window.addEventListener('keyup', function(event) { onKeyUp(event); }, false);
    window.addEventListener('keydown', function(event) { onKeyDown(event); }, false);
};
