import "./style.css";
import "phaser";

//Game configuration, will probably be placing in another file in the future
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "app",
    backgroundColor: "dda059", // changed background color to adhere to farmland color scheme
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    }
};

//Game variables
let player: Phaser.GameObjects.Rectangle;
let cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
//continuous movement key
let fKey!: Phaser.Input.Keyboard.Key;
//sowing plants key
let xKey!: Phaser.Input.Keyboard.Key;
const GRID_SIZE = 32;
const MOVE_SPEED = 200;
//const CONTINUOUS_MOVE_SPEED = 400;
let isMoving = false;
let targetX = 0;
let targetY = 0;
let keyPressed = false;
let continuousMode = false;
let hasMovedThisTurn = false;

//New data struct for accessing tiles
const gridTiles: { // changed "let" to "const" to remove error
    sun: number;
    water: number;
    tile: Phaser.GameObjects.Rectangle;
    sunText: Phaser.GameObjects.Text;
    waterText: Phaser.GameObjects.Text;
}[][] = []; 

//Grid dimentions, use these when accessing the grid
const GAME_WIDTH = config.width as number;
const GAME_HEIGHT = config.height as number;
const GRID_COLS = Math.floor(GAME_WIDTH / GRID_SIZE);
const GRID_ROWS = Math.floor(GAME_HEIGHT / GRID_SIZE);

//Creating game instance
new Phaser.Game(config);

function preload(this: Phaser.Scene) {
    //Can load assets here when we get to it
}

function create(this: Phaser.Scene) {
    //Ensuring a keyboard is present
    if (!this.input.keyboard) {
        console.error('Keyboard input not available');
        return;
    }

    for (let row = 0; row < GRID_ROWS; row++) {
        gridTiles[row] = [];
        for (let col = 0; col < GRID_COLS; col++) {
            const x = col * GRID_SIZE;
            const y = row * GRID_SIZE;
            // Create a transparent rectangle for each grid tile
            const tile = this.add.rectangle(
                x + GRID_SIZE / 2, 
                y + GRID_SIZE / 2, 
                GRID_SIZE - 1, 
                GRID_SIZE - 1, 
                0x000000, 
                0
            );

            // Add sun and water text objects
            const sunText = this.add.text(tile.x, tile.y - GRID_SIZE / 4, '0', { fontSize: '16px', color: '#FFFFFF' });
            const waterText = this.add.text(tile.x, tile.y + GRID_SIZE / 4, '0', { fontSize: '16px', color: '#FFFFFF' });

            gridTiles[row][col] = {
                sun: 0, // initial sun lvl
                water: 0, // initial water lvl
                tile: tile, // store phaser rectangle
                sunText: sunText,
                waterText: waterText
            };
        }
    }

    //Grid lines
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333);
    
    //Vertical lines
    for (let x = 0; x < GAME_WIDTH; x += GRID_SIZE) {
        graphics.moveTo(x, 0);
        graphics.lineTo(x, GAME_HEIGHT);
    }
    
    //Horizontal lines
    for (let y = 0; y < GAME_HEIGHT; y += GRID_SIZE) {
        graphics.moveTo(0, y);
        graphics.lineTo(GAME_WIDTH, y);
    }
    graphics.strokePath();

    //Creating and placing the character on the 2D grid
    player = this.add.rectangle(GRID_SIZE-16, GRID_SIZE-16, GRID_SIZE-4, GRID_SIZE-4, 0x00ff00);
    targetX = player.x;
    targetY = player.y;

    //Simple way of setting up inputs for arrow keys, can be changed later
    cursors = this.input.keyboard.createCursorKeys();
    //F key toggles continuous movement
    fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    //X key toggles plant sowing
    xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
}

function nearestBox(playerX: number, playerY: number): { row: number; col: number } {
    const col = Math.floor(playerX / GRID_SIZE);
    const row = Math.floor(playerY / GRID_SIZE);
    
    //Making sure we stay within playable area
    return {
        row: Math.max(0, Math.min(row, GRID_ROWS - 1)),
        col: Math.max(0, Math.min(col, GRID_COLS - 1))
    };
}

function update(this: Phaser.Scene) {
    //If there arent arrow keys, return. Simply an error managing measure
    if (!cursors) {
        return;
    }

    if (hasMovedThisTurn) {
        // only regen sun and accumulate water when player has moved
        generateSunWaterLevels();
        accumulateWater();
        hasMovedThisTurn = false; // reset flag after completing turn
    }

    // Display sun and water levels on each tile
    gridTiles.forEach(row => {
        row.forEach(tile => {
            tile.sunText.setText(`${tile.sun}`);
            tile.waterText.setText(`${tile.water}`);
        });
    });

    //X key input for plant sowing
    if (Phaser.Input.Keyboard.JustDown(xKey)) {
        const { row, col } = nearestBox(player.x, player.y);
        const tile = gridTiles[row][col];
        tile.tile.setFillStyle(0x8B4513, 1); //Color
        checkPlantGrowth(row, col);
    }

    //Continuous movemeent when F is pressed
    if (Phaser.Input.Keyboard.JustDown(fKey)) {
        continuousMode = !continuousMode;
        //Reset movement state when switching modes
        isMoving = false;
        keyPressed = false;
        //Snap to grid when switching to grid based movement
        if (!continuousMode) {
            player.x = Math.round(player.x / GRID_SIZE) * GRID_SIZE - 16;
            player.y = Math.round(player.y / GRID_SIZE) * GRID_SIZE - 16;
            targetX = player.x;
            targetY = player.y;
        }
    }

    if (continuousMode) {
        //Continuous movement
        //const speed = CONTINUOUS_MOVE_SPEED * (this.game.loop.delta / 1000);
        
        if (cursors.left.isDown && player.x > GRID_SIZE-16) {
            player.x -= MOVE_SPEED * (this.game.loop.delta / 1000);
            hasMovedThisTurn = true;
        }
        if (cursors.right.isDown && player.x < GAME_WIDTH - GRID_SIZE+16) {
            player.x += MOVE_SPEED * (this.game.loop.delta / 1000);
            hasMovedThisTurn = true;
        }
        if (cursors.up.isDown && player.y > GRID_SIZE-16) {
            player.y -= MOVE_SPEED * (this.game.loop.delta / 1000);
            hasMovedThisTurn = true;
        }
        if (cursors.down.isDown && player.y < GAME_HEIGHT - GRID_SIZE+16) {
            player.y += MOVE_SPEED * (this.game.loop.delta / 1000);
            hasMovedThisTurn = true;
        }
    } else {
        //Checking to see if any keys are currently being pressed
        const anyKeyDown = cursors.left.isDown || cursors.right.isDown || 
                          cursors.up.isDown || cursors.down.isDown;

        //If no keys are being pressed, reset keyPressed
        if (!anyKeyDown) {
            keyPressed = false;
        }

        //Ensures that the player is only able to move one square at a time and that there isnt already a key being pressed.
        //This is helpful for early stages to have explicit stop and start points.
        //Can be changed later to accomodate smoother movement.
        if (!isMoving && !keyPressed) {
            if (cursors.left.isDown && targetX > GRID_SIZE) {
                targetX -= GRID_SIZE;
                isMoving = true;
                keyPressed = true;
            }
            else if (cursors.right.isDown && targetX < GAME_WIDTH - GRID_SIZE) {
                targetX += GRID_SIZE;
                isMoving = true;
                keyPressed = true;
            }
            else if (cursors.up.isDown && targetY > GRID_SIZE) {
                targetY -= GRID_SIZE;
                isMoving = true;
                keyPressed = true;
            }
            else if (cursors.down.isDown && targetY < GAME_HEIGHT - GRID_SIZE) {
                targetY += GRID_SIZE;
                isMoving = true;
                keyPressed = true;
            }
        }

        //Moves the player towards target position
        if (isMoving) {
            const dx = targetX - player.x;
            const dy = targetY - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 1) {
                //Snap to grid when very close
                player.x = targetX;
                player.y = targetY;
                isMoving = false;
            } else {
                //Speed at which the player approaches the next space
                //MOVE_SPEED on its own is instant movement, the additional math is for more visually appealing character movement
                const speed = MOVE_SPEED * (this.game.loop.delta / 1000);
            
                //If dx is 0, the character is already in the correct position
                //if dx is positive, character needs to move to the right
                //if dx is negative, character needs to move to the left
                if (dx !== 0) {
                    //Horizontal
                    //Math.sign(dx): Determines movement direction
                    //Math.min(Math.abs(dx), speed): Distance required and how far we can move in a given frame (speed)
                    player.x += Math.sign(dx) * Math.min(Math.abs(dx), speed);
                }
                if (dy !== 0) {
                    //Vertical
                    player.y += Math.sign(dy) * Math.min(Math.abs(dy), speed);
                }
            }
        }
    }
}

// function to generate sun and water levels for each grid tile
// call this function each turn ??
function generateSunWaterLevels() {
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const tile = gridTiles[row][col];
            tile.sun = Phaser.Math.Between(0, 100); // rando val btwn 0-100
            //tile.water = Phaser.Math.Between(0, 50); // rando val btwn 0-50 but can accumulate
        }
    }
}

// accumulate water (over multiple turns)
// modify tile.water values over time
function accumulateWater() {
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const tile = gridTiles[row][col];
            // add random water btwn 0-10 but cap at max 100
            tile.water = Math.min(tile.water + Phaser.Math.Between(0,10), 100);
        }
    }
}

// check plant growth
function checkPlantGrowth(row: number, col: number) {
    const tile = gridTiles[row][col];
    if (tile.sun >= 50 && tile.water >= 30) { // then plant can grow
        gridTiles[row][col].tile.setFillStyle(0x228B22); // change color to rep plant growth
    } else { // plant can't grow
        gridTiles[row][col].tile.setFillStyle(0x8B4513); // change color to rep dry a$$ land
    }
}