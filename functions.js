// Fix modulo negative number bug
// http://javascript.about.com/od/problemsolving/a/modulobug.htm
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}



var GAME = (function(){
	if (!flx.init('screen', 300, 360))
		console.error('failed init');
	else
		console.log('inited');
	//--- private of game---//
    // The tetris handler
    function tetrisHandler() {
        //Level
        var levelWidth = 10;
        var levelHeight = 24;
        //Blocks
        var blockModels = [
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
                             1, 1, 1] ];
        var blocks = [];
        var colors = ['red', 'green', 'blue', 'orange', 'yellow','brown','lightblue'];
        var moveTime = 0;
        var moveInterval = 500;
        //Current Block
        var blockPosition = [4,0];
        var blockAngle = 0;
        var blockType = Math.floor(Math.random() * 7);
        var blockColor = colors[blockType];
        var moved = false;
        var drop = false;
        var angled  = false; //angle changend
        //Animations and row blow stuff
        var clearRows = [];
        var clearTime = 0;
        var clearBlinkTime = 0;
        var clearBlinkState = 0;
        //Game related
        var gamePaused = false;
        var score = 0;
        var nextBlock = Math.floor(Math.random() * 7);
        var level = 1;
        this.init = function() {
            // Allocate 2d array for "placed" blocks
            for (var i = 0; i<levelHeight; ++i) {
                blocks.push( new Array());
            }
        }
        this.update = function() {
            if (gamePaused) {
                return;
            }
            //Freeze while clearing blocks
            if (clearRows.length != 0){
                moveTime = performance.now() + moveInterval/2;
            }
            //Move
            var currentTime = performance.now();
            if ( currentTime > moveTime) {
                moveTime = (currentTime) + moveInterval;
                //Collision
                if (checkHit( blockPosition[0], blockPosition[1]+1) == true){
                    //Freeze game
                    freezeScene();
                    // Are we at the top?
                    if (blockPosition[1] == 0)
                        gamePaused = true;
                    //Spawn new block
                    blockPosition = [6,0];
                    blockType = nextBlock;
                    nextBlock = Math.floor(Math.random() * 7);
                    blockAngle = Math.floor(Math.random() * 3);
                    blockPosition[0] = 1+Math.floor(Math.random() * 5);
                    blockColor = colors[blockType];
                }else{
                    blockPosition[1]++;
                }
            }
            //Move
            if (moved == false){
                if (keyH.keyDown( 37)){ //Left
                    if ( checkHit( blockPosition[0]-1, blockPosition[1]) == false){
                        blockPosition[0]--;
                        moved = true;
                    }
                }else if (keyH.keyDown( 39)){ //Right
                    if ( checkHit( blockPosition[0]+1, blockPosition[1]) == false){
                        blockPosition[0]++;
                        moved = true;
                    }
                }
            }
            //Drop
            if (keyH.keyDown( 40) && drop == false){ //Down
                if (checkHit( blockPosition[0], blockPosition[1]+1) == true){
                    freezeScene();
                    //Spawn new block
                    blockPosition = [6,0];
                    blockType = nextBlock;
                    nextBlock = Math.floor(Math.random() * 7);
                    blockAngle = Math.floor(Math.random() * 3);
                    blockPosition[0] = 1+Math.floor(Math.random() * 5);
                    blockColor = colors[blockType];
                }else{
                    blockPosition[1]++;
                    moveInterval = 100;
                    moveTime = performance.now() + moveInterval;
                }
                drop = true;
            }
            //Angle change
            if (angled == false) {
                if (keyH.keyDown( 38)){ //Up
                    blockAngle++;
                    if ( checkHit( blockPosition[0], blockPosition[1]) == true){
                        //Something went wrong
                        blockAngle--;
                    }else{
                        angled = true;
                        if (blockAngle>3)
                            blockAngle = 0;
                    }
                }
            }
            //Angle limitations
            if (blockType == 1 || blockType == 5 || blockType == 4){
                if (blockAngle > 1){
                    blockAngle = 0;
                }
            }else if (blockType == 0){
                blockAngle = 0; 
            }
            //Keys up
            if (keyH.keyUp(37)|| keyH.keyUp(39) ){
                moved = false;
            }
            if (keyH.keyUp(40)){ //down key released
                moveInterval = (10-level)*50+50;
                drop = false;
            }
            if (keyH.keyUp(38)){
                angled = false;
            }
            keyH.flush();
            //Clear row check and animation
            var rows = checkRows();
            if (rows.length > 0 && clearRows.length == 0) {
                clearRows = rows;
                clearTime = performance.now()+500;
                clearBlinkTime = performance.now()+30;
                clearBlinkState = 1
            }
            //if there is something to clear
            if (clearRows.length > 0) {
                if (currentTime > clearBlinkTime ){
                    clearBlinkTime = performance.now() + 30;
                    clearBlinkState = !clearBlinkState;
                }
                if (currentTime > clearTime) {
                    //Add score
                    score += clearRows.length * 50 + clearRows.length*clearRows.length*25;
                    if (score > level*100+level*level*50) {
                        level++;

                    }
                    //Shift rows
                    for (var i = 0; i < clearRows.length; i++) {
                        blocks.splice( clearRows[i], 1);
                        blocks.unshift([]); //add new row at first index
                    }
                    clearRows = [];
                    clearBlinkState = 0;
                }
            }
        }
        this.render = function() {
            //Background
            viH.setFillStyle('black');
            viH.box( 0, 0, screenW, screenH);
            //Hud
            viH.setFillStyle('gray');
            viH.box( 150, 0, 150, screenH);
            viH.setFillStyle('black');
            viH.box( 180, 65, 15*6,15*4);
            //texts
            viH.setFillStyle( 'white');
            viH.text( 'LEVEL:  '+level, 160, 8);
            viH.text( 'SCORE: '+score+"/"+(level*100+level*level*80), 160, 20);
            viH.text( 'Arrow keys to play', 183, 330);
            //Next block
            viH.text( 'Next Block', 160, 35);
            var hudblock = getBlock( nextBlock, 0);
            viH.setFillStyle( colors[nextBlock]);
            for (var y = 0; y<hudblock.length; ++y){
                for (var x = 0; x<4; ++x) {
                    if (hudblock[y][x] == 1){
                        viH.box( 195 + x*15, 80 + y*15, 15, 15);
                    }
                }
            }
            //Blocks
            for (var y = 0; y<levelHeight; ++y){
                for (var x = 0; x<levelWidth; ++x){
                    if (blocks[y][x] != undefined){
                        viH.setFillStyle( blocks[y][x]);
                        viH.box( x*15, y*15,15,15);
                    }
                }
            }
            //Moving block
            viH.setFillStyle( blockColor);
            var block = getBlock( blockType, blockAngle);
            for (var y = 0; y<block.length; ++y){
                for (var x = 0; x<4; ++x) {
                    if (block[y][x] == 1){
                        viH.box( blockPosition[0]*15 + x*15, blockPosition[1]*15 + y*15, 15, 15);
                        //viH.box( x*15, y*15, 15, 15);
                    }
                }
            }
            //Paused
            if (gamePaused) {
                viH.setFillStyle( 'white');
                viH.box( 75-50, 150,100,35);
                viH.setFillStyle( 'gray');
                viH.box( 75-45, 155,90,25);
                viH.setFillStyle( 'white');
                viH.text( 'GAME OVER', 45, 156);
            }
            //row 'clear' blinking
            if (clearRows.length > 0 && clearBlinkState == 1) {
                for (var i = 0; i<clearRows.length; i++) {
                    viH.setFillStyle('white');
                    viH.box( 0, clearRows[i]*15, levelWidth*15, 15);
                }
            }
        }
        function getBlock( type, angle){ 
            var result = [ [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]];
            //var result = [];
            var width = blockModels[ type].length / 2 - 1;
            var rx,ry;
            for (var y = 0; y<2; ++y) {
                for (var x = 0; x<=width; ++x) {
                    rx = x;
                    ry = y;
                    if (blockModels[ type][x + y*(width+1)] != 1){
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
            //dump( result[ry]+" \n"); 
            /*for (var i = 0; i<blockModels[ type].length; ++i) {
                var x,y;
                if (blockModels[ type][i] == 1){
                    x = i.mod( 4);
                    y = Math.floor( i/4) ;
                    if (angle == 1){
                        var tmp = x;
                        x = y;
                        y = 2-tmp;
                    }else if( angle == 2){
                        x = 2-x;
                        y = 2-y;
                    }else if (angle == 3){
                        var tmp = x;
                        x = y;
                        y = tmp;
                        x = 2-x;
                    }
                    if (type == 1 && angle ==1){
                        x++;
                    }
                    if (type == 4 && angle ==1){
                        x++;
                    }
                    else if (type == 5 && angle ==1){
                        x++;
                    }
                    result[y+1][x] = 1;
                }
            }
            //delete empty rows
            for (var i = 3; i>=0 ;i--) {
                var sum = 0;
                for (var j = 0; j<4; j++){
                    sum += result[i][j];
                }
                if (sum == 0) //empty row
                    result.splice(i,1);
            }*/
            return result;
        }
        function checkHit( bx, by) {
            //passed block coords?
            if (bx == undefined){
                bx = blockPosition[0];
                by = blockPosition[1];
            }
            var block = getBlock( blockType, blockAngle);
            for (var y = 0; y<block.length; ++y){
                for (var x = 0; x<4; ++x) {
                    if (block[y][x] == 1){
                        var tx = bx + x;
                        var ty = by + y;
                        if (ty >= levelHeight) //past level floor
                            return true;
                        if (tx < 0) //past left edge
                            return true;
                        if (tx >= levelWidth) //past right edge
                            return true;
                        
                        if (blocks[ty][tx] != undefined) //hits block
                            return true;
                    }
                }
            }
            return false;
        }
        function freezeScene() {
            var block = getBlock( blockType, blockAngle);
            for (var y = 0; y<block.length; ++y){
                for (var x = 0; x<4; ++x) {
                    if (block[y][x] == 1){
                        var tx = blockPosition[0] + x;
                        var ty = blockPosition[1] + y;
                        blocks[ty][tx] = blockColor;
                    }
                }
            }
        }
        function checkRows() {
            var result = [];
            //Check for Full row
            for (var y = 0; y<levelHeight; y++) {
                for (var x = 0; x<=levelWidth; x++){
                    if (blocks[y][x] == undefined){
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

    }
	// screen properties
	var screenW;
	var screenH;
	/* constructor */
	var tiH = new flx.timer( 1000/60, run); // time Handler
	var viH = new flx.visuals(); // visual handler
	var keyH = new flx.keys();
	var mouseH = new flx.mouse();
	var imgH = new flx.image();
    var tetH = new tetrisHandler();
	function run(){
		//viH.clear();
		tiH.update();
		for (var f = 0;f<tiH.updateFrames;f++){
            tetH.update();
        }
        render();
        viH.update();
	};
	function render() {
        //Draw bumpmap
        tetH.render();
        //Draw FPS
        //viH.setFillStyle( "white");
        //viH.text( "FPS: "+tiH.fps, 160, -4);
	};
	
		

	//--- public of game---//	
	return {
		init: function(){
            viH.setFillStyle( "white");
            viH.text("Loading", viH.screenWidth()/2, viH.screenHeight()/2 );
            viH.update();
			screenW = viH.screenWidth();
			screenH = viH.screenHeight();
            //Start timer
            var tiHhandle = tiH; 
            imgH.preLoad( function(){
                tetH.init();
                tiH.start();
            });
			
		},
        screenExpand: viH.screenExpand,
        screenContract: viH.screenContract,
	}
}());

window.onload = GAME.init();

