GAME = (function() {
    /**
     * Private
     */
    var WIDTH = 300;
    var HEIGHT = 360;
    var timer = new TimerClass( 40, run);
    var visual = new VisualClass('screen', WIDTH, HEIGHT);
    var input = new InputClass();
    var tetris = new TetrisGame();
    function TetrisGame() {
        /**
         * Private
         */
        //Game state
        var gamePaused = false;
        // Level and blocks
        var levelWidth = 10;
        var levelHeight = 24;
        var blocks = [
            [1, 1,
             1, 1],

            [1, 1, 0,
             0, 1, 1],

            [0, 1, 0,
             1, 1, 1],

            [0, 0, 1,
             1, 1, 1],

            [0, 0, 0, 0,
             1, 1, 1, 1],
            
            [0, 1, 1,
             1, 1, 0],
             
            [1, 0, 0,
             1, 1, 1]];
        var colors = ['red', 'green', 'blue', 'orange', 'yellow','brown','lightblue'];
        var playfield = [];
        var block = newBlock();
        var nextBlock = newBlock();
        // Timing
        var moveInterval = 500;
        var tMove = performance.now() + moveInterval;
        var tBlink;
        // Score and level
        var score = 0;
        var level = 1
        //Clear animation
        var clearRows = [];
        var clearBlink = true;
        var tBlink = 0;
        var clearBlinkCount = 0;
        /**
         * Public
         */
        /**
         * Methods
         */
        // Returns binary 4x4 array for a block of 'type' at 'angle'
        function getBlock( type, angle){ 
            var result = [ [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
            //var result = [];
            var width = blocks[ type].length / 2 - 1;
            var rx,ry;
            for (var y = 0; y<2; ++y) {
                for (var x = 0; x<=width; ++x) {
                    rx = x;
                    ry = y;
                    if (blocks[ type][x + y*(width+1)] != 1){
                        continue;
                    }
                    if (angle == 1){
                        rx = y;
                        ry = width-x;
                    }else if( angle == 2){
                        rx = width-x;
                        ry = width-y;
                    }else if (angle == 3){
                        rx = width-y;
                        ry = x;
                    }
                    // Read block into result
                    result[ry][rx] = 1;
                }
            }
            return result;
        };
        function newBlock() {
            var t = Math.floor( Math.random() * 7);
            return {
                    x: 4,
                    y: 0,
                    angle: 0,
                    type: t,
                    color: colors[t]
                };
        }
        // Checks playfield for whole full rows and returns their indices
        function checkRows() {
            var result = [];
            //Check for Full row
            for (var y = 0; y<levelHeight; y++) {
                for (var x = 0; x<=levelWidth; x++){
                    if (playfield[y][x] == undefined){
                        break;
                    }
                    //We actualle have full row
                    if (x == levelWidth-1){
                        result.push(y);
                    }
                }
            }
            return result;
        }

        // Checks for current block hit at x,y
        function checkHit( bx, by) {
            //Argument check
            if ( bx == undefined){
                bx = block.x;
                by = block.y;
            }
            var blk = getBlock( block.type, block.angle);
            for (var y = 0; y<blk.length; ++y){
                for (var x = 0; x<4; ++x) {
                    if (blk[y][x] == 1){
                        var tx = bx + x;
                        var ty = by + y;
                        if (ty >= levelHeight) //past level floor
                            return true;
                        if (tx < 0) //past left edge
                            return true;
                        if (tx >= levelWidth) //past right edge
                            return true;
                        if (playfield[ty][tx] != undefined) //hits block
                            return true;
                    }
                }
            }
            return false;
        };
        function freezePlayfield() {
            var blk = getBlock( block.type, block.angle);
            for (var y = 0; y<blk.length; ++y){
                for (var x = 0; x<4; ++x) {
                    if (blk[y][x] == 1){
                        var tx = block.x + x;
                        var ty = block.y + y;
                        playfield[ty][tx] = block.color;
                    }
                }
            }
        }
        this.render = function() {
            //Background
            visual.color('black');
            visual.rectangle( 0, 0, WIDTH, HEIGHT);
            //HUD
            visual.color('gray');
            visual.rectangle( 150, 0, 150, HEIGHT);
            visual.color('black');
            visual.rectangle( 180, 65, 15*6,15*4);
            //Score
            visual.color('white');
            visual.text( 'SCORE: '+score, 180,30);
            visual.text( 'LEVEL: '+level, 180,45);
            visual.text( 'NEXT BLOCK: ', 180,60);
            //Playfield
            for (var y = 0; y<levelHeight; ++y){
                for (var x = 0; x<levelWidth; ++x){
                    if (playfield[y][x] != undefined){
                        visual.color( playfield[y][x]);
                        visual.rectangle( x*15, y*15,15,15);
                    }
                }
            }
            //Current Block
            visual.color( block.color);
            var blk = getBlock( block.type, block.angle);
            for (var y = 0; y<blk.length; ++y){
                for (var x = 0; x<4; ++x) {
                    if (blk[y][x] == 1){
                        visual.rectangle( block.x*15 + x*15, block.y*15 + y*15, 15, 15);
                    }
                }
            }
            //Check for full rows and initiate clear animation
            var rows = checkRows();
            if ( rows.length != 0 && clearRows.length == 0) {
                clearRows = rows;
                tBlink = performance.now() + 30;
            }
            //Check clear animation timing
            if (clearRows.length != 0) {
                if (performance.now() > tBlink) {
                    clearBlink = !clearBlink;
                    clearBlinkCount++;
                    tBlink = performance.now() + 30;
                    if (clearBlinkCount > 10){ // time to stop blinkin'
                        //Add score
                        score += clearRows.length * 50 + clearRows.length*clearRows.length*25;
 
                        //Clear rows
                        for (var i = 0; i < clearRows.length; i++) {
                            playfield.splice( clearRows[i], 1);
                            playfield.unshift([]); //add new row at first index
                        }
                        //Stop blinking
                        clearRows = [];
                        clearBlink = true;
                        clearBlinkCount = 0;
                    }
                }
            }
            //Clear animation
            if (clearRows.length != 0 && clearBlink == true){
                for (var i = 0; i<clearRows.length; i++) {
                    visual.color('white');
                    visual.rectangle( 0, clearRows[i]*15, levelWidth*15, 15);
                }
            }
            //Next block
            visual.color( nextBlock.color);
            var blk = getBlock( nextBlock.type, nextBlock.angle);
            for (var y = 0; y<blk.length; ++y){
                for (var x = 0; x<4; ++x) {
                    if (blk[y][x] == 1){
                        visual.rectangle( 195 + x*15, 80 + y*15, 15, 15);
                    }
                }
            }

            //Game Over text
            if (gamePaused) {
                visual.color( 'white');
                visual.rectangle( 75-50, 150,100,35);
                visual.color( 'gray');
                visual.rectangle( 75-45, 155,90,25);
                visual.color( 'white');
                visual.text( 'GAME OVER', 45, 171);
            }

        };
        this.update = function() {
            //Check for paused/game Over
            if (gamePaused)
                return;
            //Check score and level
            if (score > level*100+level*level*50) {
                level++;
            }
            
            // Block movement
            var tNow = performance.now();
            if (tNow > tMove) {
                tMove += moveInterval;
                 if (checkHit( block.x, block.y+1) == true){
                    //Freeze game
                    freezePlayfield();
                    // Are we at the top?
                    if (block.y == 0)
                        gamePaused = true;
                    //Spawn new block
                    block = nextBlock;
                    nextBlock = newBlock();
                }else{
                    block.y++;
                }
            }
            // Input
            var inputs = input.pollKeys();
            while ( inputs.length != 0) {
                var key = inputs.pop();
                if ( key == 38){ // Up key (rotation)
                    block.angle++;
                    // Hit prevents angling
                    if ( checkHit() == true) {
                        block.angle--;
                    }else{ // No hit
                        // Angle Limitations
                        if (block.angle > 3)
                            block.angle = 0;
                        if (block.type == 1 || block.type == 5 || block.type == 4){
                            //Certain blocks can oly rotate once
                            if (block.angle > 1){
                                block.angle = 0;
                            }
                        //}else if (block.type == 0){
                            //block.angle = 0; 
                        }
                    }
                }else if (key == 37) { // Left key (move left)
                    if (checkHit( block.x-1, block.y) == false) {
                        block.x--;
                    }
                }else if( key == 39){ // Right key (move right)
                    if (checkHit( block.x+1, block.y) == false) {
                        block.x++;
                    }
                }else if( key == 40) { // Down key (move faster down)
                    if (checkHit( block.x, block.y+1) == true) {
                        //Freeze game
                        freezePlayfield();
                        //Spawn new block
                        block = nextBlock;
                        nextBlock = newBlock();
                    }else{ // Move faster down
                        block.y++;
                        moveInterval = 100;
                        tMove = tNow + moveInterval;
                    }
                }else if( key == -40) { // Release Down key (move normal speed)
                    moveInterval = 500;
                }
            }
        };
        /**
         * Constructor
         */
        // Allocate 2d array for playfield (placed blocks)
        for (var i = 0; i<levelHeight; ++i) {
            playfield.push( new Array());
        }
    }
    /**
     * Public
     */
    this.init = function() {
        visual.init();
        visual.rectangle(0, 0, 90, 90);
        console.log('Game Initialized');
    };
    /**
     * Methods
     */
    // MAIN LOOP
    function run() {
        timer.update();
		for (var f = 0; f < timer.logicFrames; ++f){
            tetris.update();
        }
        tetris.render();
    };
    /**
     * Constructor & wrapped return object
     */
    timer.start();
    return {
        init: this.init
    };
}());

window.onload = GAME.init();
