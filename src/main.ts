import "./style.css";
import "phaser";

//Game configuration, will probably be placing in another file in the future
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: "app",
    backgroundColor: "#2d2d2d",
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
const GRID_SIZE = 32;
const MOVE_SPEED = 200;
let isMoving = false;
let targetX = 0;
let targetY = 0;
let keyPressed = false;

//Grid dimentions, use these when accessing the grid
const GAME_WIDTH = config.width as number;
const GAME_HEIGHT = config.height as number;

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
}

function update(this: Phaser.Scene) {
    //if there arent arrow keys, return. Simply a error managing measure
    if (!cursors) {
        return;
    }

    //Checking to see if any keys are currently being pressed
    const anyKeyDown = cursors.left.isDown || cursors.right.isDown || cursors.up.isDown || cursors.down.isDown;

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