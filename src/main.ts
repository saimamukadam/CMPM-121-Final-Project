import "./style.css";
import "phaser";

const APP_TITLE = "Game";

const canvasContainer = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_TITLE;


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

canvasContainer.innerHTML = `
  <h1>${APP_TITLE}</h1>
  
  
`;



const completedCrops: string[] = []; // This could be your crop data
const redoCropsStack: string[] = []; // Stack for redo



// create the instructions panel
function createInstructionsPanel() {
    const instructionsPanel = document.createElement('div');
    instructionsPanel.classList.add('game-instructions');
  
    
    const instructionsHeader = document.createElement('div');
    instructionsHeader.classList.add('game-instructions-header');
    instructionsHeader.textContent = 'GAME CONTROLS'; 
    instructionsPanel.appendChild(instructionsHeader);
  
    // content text
    const instructionsText = document.createElement('p');
    instructionsText.innerHTML = `
      <strong>Save Game (1-5 keys):</strong><br>
      1 | 2 | 3 | 4 | 5<br><br>
      <strong>Load Game (6-0 keys):</strong><br>
      6 | 7 | 8 | 9 | 0<br><br>
      <strong>Movement:</strong><br>
      ↑ ↓ ← → : Grid Movement<br>
      F : Toggle Continuous<br>
      U : Undo<br>
      R : Redo<br>
      <strong>Planting:</strong><br>
      Z : Garlic<br>
      X : Cucumber<br>
      C : Tomato
    `;
    instructionsPanel.appendChild(instructionsText);
  
    
    document.body.appendChild(instructionsPanel);
  
    instructionsPanel.style.position = 'absolute';
    instructionsPanel.style.bottom = '100px'; 
    instructionsPanel.style.left = '10px';
    instructionsPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    instructionsPanel.style.color = 'white';
    instructionsPanel.style.padding = '10px';
    instructionsPanel.style.borderRadius = '8px';
    instructionsPanel.style.fontSize = '12px';
    instructionsPanel.style.zIndex = '100';
    instructionsPanel.style.maxWidth = '250px';
    instructionsPanel.style.lineHeight = '2.5';
  
    instructionsHeader.style.fontWeight = 'bold';
    instructionsHeader.style.color = '#FFD700';
    instructionsHeader.style.marginBottom = '-5px'; 
  
    // instructions text
    instructionsText.style.fontSize = '14px';
    instructionsText.style.color = '#FFFFFF';
    instructionsText.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    instructionsText.style.padding = '10px';
    instructionsText.style.textAlign = 'center';
    instructionsText.style.marginTop = '10px';
}
  
// Call instructions panel
createInstructionsPanel();

function displayTurnCounter(this: Phaser.Scene) {
    const turnText = this.add.text(
        10, 
        10, 
        `Turn: ${currentTurn}`, 
        { 
            fontSize: '16px', 
            color: '#000000' 
        }
    );
    turnText.setScrollFactor(0);  // Makes text stay on screen
    turnText.setDepth(1);         // Ensures text is visible above other elements
    
    // Update the turn display each frame
    this.events.on('update', () => {
        turnText.setText(`Turn: ${currentTurn}`);
    });
}

//Grid dimentions, use these when accessing the grid
const GRID_SIZE = 32;
const GAME_WIDTH = config.width as number;
const GAME_HEIGHT = config.height as number;
const GRID_COLS = Math.floor(GAME_WIDTH / GRID_SIZE);
const GRID_ROWS = Math.floor(GAME_HEIGHT / GRID_SIZE);

interface GameState {
    gridTiles: {
        sun: number;
        water: number;
        plantType?: PlantType;
        growthStage?: number;
    }[][];
    playerPosition: {
        x: number;
        y: number;
    };
    continuousMode: boolean;
    playerHealth: number;
    playerScore: number;
}

class AutoSaveManager {
    private static autoSaveKey = "farmgame_autosave";
    private static autoSaveInterval = 5000; // 5 seconds
    private static intervalId: number | null = null;
    
    // Start auto save 
    static startAutoSave(gameManager: GameManager): void {
        if (this.intervalId === null) {
            this.intervalId = globalThis.setInterval(() => {
                gameManager.autoSave();
            }, this.autoSaveInterval);
        }
    }

    // End auto save
    static stopAutoSave(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    // Auto save
    static saveState(gameState: GameState): void {
        try {
            localStorage.setItem(this.autoSaveKey, JSON.stringify(gameState));
            console.log("Auto-save successful");
        } catch (error) {
            console.error("Auto-save failed:", error);
        }
    }

    // Load save sate
    static loadState(): GameState | null {
        const savedState = localStorage.getItem(this.autoSaveKey);
        return savedState ? JSON.parse(savedState) : null;
    }

    // Clear auto-save when the player manually saves or quits
    static clearState(): void {
        localStorage.removeItem(AutoSaveManager.autoSaveKey);
    }
}

interface GameAction {
    type: 'PLANT';
    row: number;
    col: number;
    plantedType: PlantType;
    previousState?: {
        plantType?: PlantType;
        growthStage?: number;
    };
    currentState?: {
        plantType: PlantType,
        growthStage: number,
    };
}

class ActionManager {
    private actionHistory: GameAction[] = [];
    private undoneActions: GameAction[] = [];
    private readonly MAX_HISTORY = 10;

    recordAction(action: GameAction) {
        //this.undoneActions = [];
        this.actionHistory.push(action);
    }

    undo(): GameAction | null {
        if (this.actionHistory.length === 0) return null;

        const lastAction = this.actionHistory.pop();
        if (lastAction) {
            this.undoneActions.push(lastAction);
            return lastAction;
        }
        return null;
    }

    redo(): GameAction | null {
        if (this.undoneActions.length === 0) return null;

        const redoAction = this.undoneActions.pop();
        if (redoAction) {
            this.actionHistory.push(redoAction);
            return redoAction;
        }
        return null;
    }
}

class GameManager {
    private gameState: GameState;
    private scene: Phaser.Scene | null = null;
    private pendingSavedState: GameState | null = null;

    constructor() {
        this.gameState = this.createDefaultState();

        const savedState = AutoSaveManager.loadState();
        if (savedState) {
            console.log("Found saved state, queuing for when scene is ready");
            this.pendingSavedState = savedState;
        }
    }

    // This function now handles load state
    setScene(scene: Phaser.Scene) {
        this.scene = scene;
        AutoSaveManager.startAutoSave(this);
        
        // If we had a pending saved state, handle it now
        if (this.pendingSavedState) {
            console.log("Scene ready, handling pending saved state");
            const shouldContinue = globalThis.confirm("A saved game was found. Would you like to continue?");
            if (shouldContinue) {
                this.resumeGame(this.pendingSavedState);
            } else {
                this.startNewGame();
            }
            this.pendingSavedState = null;  // Clear pending state
        }
    }

    private createDefaultState(): GameState {
        return {
            gridTiles: Array(GRID_ROWS).fill(null).map(() => 
                Array(GRID_COLS).fill(null).map(() => ({
                    sun: 0,
                    water: 0
                }))
            ),
            playerPosition: { x: GRID_SIZE-16, y: GRID_SIZE-16 },
            continuousMode: false,
            playerHealth: 100,
            playerScore: 0
        };
    }

    // Auto-save the game 
    autoSave(): void {
        if (!this.scene) {
            console.log("Scene not initialized, skipping auto-save");
            return;
        }

        const state: GameState = {
            gridTiles: gridTiles.map(row => 
                row.map(tile => ({
                    sun: tile.sun,
                    water: tile.water,
                    plantType: tile.plantType,
                    growthStage: tile.growthStage
                }))
            ),
            playerPosition: {
                x: player.x,
                y: player.y
            },
            continuousMode: continuousMode,
            playerHealth: this.gameState.playerHealth,
            playerScore: this.gameState.playerScore
        };
        
        console.log("Attempting to save state:", state); // Debug log
        AutoSaveManager.saveState(state);
        this.gameState = state;
    }

    // Resume the game from the auto-save state
    public resumeGame(savedState: GameState): void {
        // Restore grid state
        savedState.gridTiles.forEach((row, rowIndex) => {
            row.forEach((tileData, colIndex) => {
                const tile = gridTiles[rowIndex][colIndex];
                tile.sun = tileData.sun;
                tile.water = tileData.water;
                tile.plantType = tileData.plantType;
                tile.growthStage = tileData.growthStage;

                // Update visuals
                if (tile.plantType && tile.growthStage !== undefined) {
                    tile.plantText?.setText(PLANT_STAGES[tile.plantType][tile.growthStage]);
                    
                    // Update tile color
                    switch (tile.plantType) {
                        case 'GARLIC':
                            tile.tile.setFillStyle(0xDDA0DD, 1);
                            break;
                        case 'CUCUMBER':
                            tile.tile.setFillStyle(0x228B22, 1);
                            break;
                        case 'TOMATO':
                            tile.tile.setFillStyle(0xFF4500, 1);
                            break;
                    }
                }
            });
        });

        // Restore player position
        player.x = savedState.playerPosition.x;
        player.y = savedState.playerPosition.y;
        targetX = player.x;
        targetY = player.y;
        
        // Restore game mode
        continuousMode = savedState.continuousMode;
        
        // Restore other state
        this.gameState = savedState;
        
        console.log("Game restored from auto-save");
    }

    // Start a new game
    private startNewGame(): void {
        this.gameState = this.createDefaultState();
        AutoSaveManager.clearState();
        
        // Reset player position
        player.x = GRID_SIZE-16;
        player.y = GRID_SIZE-16;
        targetX = player.x;
        targetY = player.y;
        
        // Reset grid
        gridTiles.forEach(row => {
            row.forEach(tile => {
                tile.sun = 0;
                tile.water = 0;
                tile.plantType = undefined;
                tile.growthStage = undefined;
                tile.tile.setFillStyle(0x000000, 0);
                tile.plantText?.setText('');
            });
        });

        console.log("New game started");
    }

    // Example of how to quit the game and clear the auto-save
    quitGame(): void {
        AutoSaveManager.stopAutoSave();
        AutoSaveManager.clearState();
        console.log("Game quit and auto-save cleared.");
    }
}

const gameManager = new GameManager();
//gameManager.loadAutoSave();

interface GameSaveData {
    gridTiles: {
        sun: number;
        water: number;
        plantType?: PlantType;
        growthStage?: number;
    }[][];
    playerPosition: { x: number; y: number };
    continuousMode: boolean;
}

interface WinCondition {
    plantType: PlantType;
    requiredGrowthStage: number;
    requiredCount: number;
}

interface ScenarioCondition {
    turnStart: number;
    turnEnd?: number;
    sunMultiplier: number;
    waterMultiplier: number;
    description: string;
}

interface GameScenario {
    name: string;
    description: string;
    conditions: ScenarioCondition[];
    victoryConditions: WinCondition[];
}

const WIN_CONDITIONS: WinCondition[] = [
    { plantType: 'GARLIC', requiredGrowthStage: 2, requiredCount: 5 },
    { plantType: 'CUCUMBER', requiredGrowthStage: 2, requiredCount: 5 },
    { plantType: 'TOMATO', requiredGrowthStage: 2, requiredCount: 5 }
];

//Game variables
let player: Phaser.GameObjects.Rectangle;
let cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
//continuous movement key
let fKey!: Phaser.Input.Keyboard.Key;
//sowing plants key
let zKey!: Phaser.Input.Keyboard.Key;
let xKey!: Phaser.Input.Keyboard.Key;
let cKey!: Phaser.Input.Keyboard.Key;
const MOVE_SPEED = 200;
//const CONTINUOUS_MOVE_SPEED = 400;
let isMoving = false;
let targetX = 0;
let targetY = 0;
let keyPressed = false;
let continuousMode = false;
let hasMovedThisTurn = false;
let currentTurn = 0;
let currentScenario: GameScenario;

//Values at which the plants can grow
const GROWTH_THRESHOLDS = {
    WATER: 50,
    SUN: 50
};

const PLANT_STAGES = {
    GARLIC: ['🌱', '🥬', '🧄'],  // sprout, growing, garlic
    CUCUMBER: ['🌱', '🌿', '🥒'],   // sprout, growing, cucumber
    TOMATO: ['🌱', '🥬', '🍅']   // sprout, growing, tomato
};

type PlantType = 'GARLIC' | 'CUCUMBER' | 'TOMATO';

//New data struct for accessing tiles
const gridTiles: { // changed "let" to "const" to remove error
    sun: number;
    water: number;
    tile: Phaser.GameObjects.Rectangle;
    sunText: Phaser.GameObjects.Text;
    waterText: Phaser.GameObjects.Text;
    plantType?: PlantType;
    growthStage?: number;
    plantText?: Phaser.GameObjects.Text;
}[][] = []; 

const textConfig = {
    sun: { fontSize: '12px', color: '#FFD700' },  // Gold color for sun
    water: { fontSize: '12px', color: '#4169E1' }  // Royal blue for water
};

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
            const sunText = this.add.text(
                tile.x, 
                tile.y - GRID_SIZE / 4, 
                '☀ 0', 
                textConfig.sun
            ).setOrigin(0.5);
            const waterText = this.add.text(
                tile.x, 
                tile.y + GRID_SIZE / 4, 
                '💧 0', 
                textConfig.water
            ).setOrigin(0.5);

            gridTiles[row][col] = {
                sun: 0, // initial sun lvl
                water: 0, // initial water lvl
                tile: tile, // store phaser rectangle
                sunText: sunText,
                waterText: waterText,
                plantType: undefined,
                growthStage: undefined,
                plantText: this.add.text(tile.x, tile.y, '', { fontSize: '16px' }).setOrigin(0.5)
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
    //X key toggles sowing of plant 1.
    zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    //X key toggles sowing of plant 2.
    xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    //X key toggles sowing of plant 3.
    cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);

    const oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    const threeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    const fourKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    const fiveKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
    oneKey.on('down', () => saveGame(1));
    twoKey.on('down', () => saveGame(2));
    threeKey.on('down', () => saveGame(3));
    fourKey.on('down', () => saveGame(4));
    fiveKey.on('down', () => saveGame(5));
    const sixKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX);
    const sevenKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SEVEN);
    const eightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EIGHT);
    const nineKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);
    const zeroKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    sixKey.on('down', () => loadGame(1));
    sevenKey.on('down', () => loadGame(2));
    eightKey.on('down', () => loadGame(3));
    nineKey.on('down', () => loadGame(4));
    zeroKey.on('down', () => loadGame(5));

    const undoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    const redoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    undoKey.on('down', () => undoLastAction());
    redoKey.on('down', () => redoLastAction());

    displayTurnCounter.call(this);
    currentScenario = defaultScenario;
    currentTurn = 0;

    gameManager.setScene(this);
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
    gridTiles.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            tile.sunText.setText(`${tile.sun}☀`);
            tile.waterText.setText(`${tile.water}💧`);

            //check if there should be plant growth on this tile
            if (tile.plantType !== undefined) {
                checkPlantGrowth(rowIndex, colIndex)
            }
        });
    });

    // Z key input for planting garlic
if (Phaser.Input.Keyboard.JustDown(zKey)) {
    const { row, col } = nearestBox(player.x, player.y);
    const tile = gridTiles[row][col];
    tile.tile.setFillStyle(0xDDA0DD, 1); // Color for garlic
    plantGarlic(row, col);

    // Record this planting action to completedCrops
    completedCrops.push(`Garlic planted at row ${row}, col ${col}`);
    // Clear the redo stack whenever a new action is done
    redoCropsStack.length = 0; // Ensuring redo stack is cleared when a new action occurs
}

// X key input for planting cucumber
if (Phaser.Input.Keyboard.JustDown(xKey)) {
    const { row, col } = nearestBox(player.x, player.y);
    const tile = gridTiles[row][col];
    tile.tile.setFillStyle(0x228B22, 1); // Color for cucumber
    plantCucumber(row, col);

    // Record this planting action to completedCrops
    completedCrops.push(`Cucumber planted at row ${row}, col ${col}`);
    // Clear the redo stack whenever a new action is done
    redoCropsStack.length = 0;
}

// C key input for planting tomato
if (Phaser.Input.Keyboard.JustDown(cKey)) {
    const { row, col } = nearestBox(player.x, player.y);
    const tile = gridTiles[row][col];
    tile.tile.setFillStyle(0xFF4500, 1); // Color for tomato
    plantTomato(row, col);

    // Record this planting action to completedCrops
    completedCrops.push(`Tomato planted at row ${row}, col ${col}`);
    // Clear the redo stack whenever a new action is done
    redoCropsStack.length = 0;
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
            incrementTurn();
        }
        if (cursors.right.isDown && player.x < GAME_WIDTH - GRID_SIZE+16) {
            player.x += MOVE_SPEED * (this.game.loop.delta / 1000);
            hasMovedThisTurn = true;
            incrementTurn();
        }
        if (cursors.up.isDown && player.y > GRID_SIZE-16) {
            player.y -= MOVE_SPEED * (this.game.loop.delta / 1000);
            hasMovedThisTurn = true;
            incrementTurn();
        }
        if (cursors.down.isDown && player.y < GAME_HEIGHT - GRID_SIZE+16) {
            player.y += MOVE_SPEED * (this.game.loop.delta / 1000);
            hasMovedThisTurn = true;
            incrementTurn();
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
                hasMovedThisTurn = true;
                incrementTurn();
            }
            else if (cursors.right.isDown && targetX < GAME_WIDTH - GRID_SIZE) {
                targetX += GRID_SIZE;
                isMoving = true;
                keyPressed = true;
                hasMovedThisTurn = true;
                incrementTurn();
            }
            else if (cursors.up.isDown && targetY > GRID_SIZE) {
                targetY -= GRID_SIZE;
                isMoving = true;
                keyPressed = true;
                hasMovedThisTurn = true;
                incrementTurn();
            }
            else if (cursors.down.isDown && targetY < GAME_HEIGHT - GRID_SIZE) {
                targetY += GRID_SIZE;
                isMoving = true;
                keyPressed = true;
                hasMovedThisTurn = true;
                incrementTurn();
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
    updateWinCondition.call(this)
}

// function to generate sun and water levels for each grid tile
// call this function each turn ??
function generateSunWaterLevels() {
    const condition = getCurrentScenarioCondition();
    const sunMultiplier = condition?.sunMultiplier || 1;

    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const tile = gridTiles[row][col];
            tile.sun = Math.min(100, Math.floor(Phaser.Math.Between(0, 100) * sunMultiplier));
        }
    }
}

// accumulate water (over multiple turns)
// modify tile.water values over time
function accumulateWater() {
    const condition = getCurrentScenarioCondition();
    const waterMultiplier = condition?.waterMultiplier || 1;

    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const tile = gridTiles[row][col];
            const waterIncrease = Math.floor(Phaser.Math.Between(0, 5) * waterMultiplier);
            tile.water = Math.min(tile.water + waterIncrease, 100);
        }
    }
}

const actionManager = new ActionManager();

function plantGarlic(row: number, col: number) {
    const tile = gridTiles[row][col];
    const previousState = {
        plantType: tile.plantType,
        growthStage: tile.growthStage
    };

    tile.tile.setFillStyle(0xDDA0DD, 1); // Light purple for garlic
    tile.plantType = 'GARLIC';
    tile.growthStage = 0;

    // Place the sprout before checking to see if it is a valid space
    if (tile.plantText) {
        tile.plantText.setText(PLANT_STAGES[tile.plantType][0]);
    }

    // Record the action in completedCrops and clear redo stack
    //completedCrops.push(`Garlic planted at row ${row}, col ${col}`);
    //redoCropsStack.length = 0; // Clear redo stack when a new action is performed

    actionManager.recordAction({
        type: 'PLANT',
        row,
        col,
        plantedType: 'GARLIC',
        previousState,
        currentState: {
            plantType: 'GARLIC',
            growthStage: tile.growthStage
        }
    });

    checkPlantGrowth(row, col);
}

function plantCucumber(row: number, col: number) {
    const tile = gridTiles[row][col];
    const previousState = {
        plantType: tile.plantType,
        growthStage: tile.growthStage
    };

    tile.tile.setFillStyle(0x228B22, 1); // Green for cucumber
    tile.plantType = 'CUCUMBER';
    tile.growthStage = 0;

    // Place the sprout before checking to see if it is a valid space
    if (tile.plantText) {
        tile.plantText.setText(PLANT_STAGES[tile.plantType][0]);
    }
    // Record the action in completedCrops and clear redo stack
    //completedCrops.push(`Cucumber planted at row ${row}, col ${col}`);
    //redoCropsStack.length = 0; // Clear redo stack when a new action is performed

    actionManager.recordAction({
        type: 'PLANT',
        row,
        col,
        plantedType: 'CUCUMBER',
        previousState,
        currentState: {
            plantType: 'CUCUMBER',
            growthStage: tile.growthStage
        }
    });

    checkPlantGrowth(row, col);
}

function plantTomato(row: number, col: number) {
    const tile = gridTiles[row][col];
    const previousState = {
        plantType: tile.plantType,
        growthStage: tile.growthStage
    };

    tile.tile.setFillStyle(0xFF4500, 1); // Dark orange/red for tomato
    tile.plantType = 'TOMATO';
    tile.growthStage = 0;

    // Place the sprout before checking to see if it is a valid space
    if (tile.plantText) {
        tile.plantText.setText(PLANT_STAGES[tile.plantType][0]);
    }

    // Record the action in completedCrops and clear redo stack
    //completedCrops.push(`Tomato planted at row ${row}, col ${col}`);
    //redoCropsStack.length = 0; // Clear redo stack when a new action is performed

    actionManager.recordAction({
        type: 'PLANT',
        row,
        col,
        plantedType: 'TOMATO',
        previousState,
        currentState: {
            plantType: 'TOMATO',
            growthStage: tile.growthStage
        }
    });

    checkPlantGrowth(row, col);
}


//helper function to determine how many neighbors a plant currently has
function plantNeighbors(row: number, col: number): number {
    let neighbors = 0;

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;

        //checking to see if the current position is compatible with plant growth
        if (newRow >= 0 && newRow < GRID_ROWS &&
            newCol >= 0 && newCol < GRID_COLS &&
            gridTiles[newRow][newCol].plantType !== undefined
        ) {
            neighbors++;
        }
    }
    return neighbors;
}

// check plant growth
function checkPlantGrowth(row: number, col: number) {
    const tile = gridTiles[row][col];
    
    //If no plant is present in the given tile
    if(!tile.plantType || tile.growthStage === undefined){
        return;
    }

    const neighborCount = plantNeighbors(row, col);

    if (neighborCount >= 3){
        const tile = gridTiles[row][col];
        tile.tile.setFillStyle(0x8B0000, 1); //Color
        return;
    }

    //Checking to see if conditions are suitable for growth
    if (tile.sun >= GROWTH_THRESHOLDS.SUN && tile.water >= GROWTH_THRESHOLDS.WATER) {
        //increment growth stage
        if (tile.growthStage < 2){
            tile.growthStage++;
        }
        
        //reset water content
        tile.water = 0;
    }

    //update plant emoji
    if(tile.plantText){
        tile.plantText.setText(PLANT_STAGES[tile.plantType][tile.growthStage])
    }
}

function checkWinConditions(): boolean {
    // Count fully grown plants of each type
    const plantCounts = {
        GARLIC: 0,
        CUCUMBER: 0,
        TOMATO: 0
    };

    //Checking all tiles
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const tile = gridTiles[row][col];
            if (tile.plantType && tile.growthStage !== undefined) {
                //checking win conditions
                const winCondition = WIN_CONDITIONS.find(wc => wc.plantType === tile.plantType);
                if (winCondition && tile.growthStage >= winCondition.requiredGrowthStage) {
                    plantCounts[tile.plantType]++;
                }
            }
        }
    }

    // Check if all win conditions are satisfied
    return WIN_CONDITIONS.every(condition => 
        plantCounts[condition.plantType] >= condition.requiredCount
    );
}

function updateWinCondition(this: Phaser.Scene) {
    if (checkWinConditions()) {

        //Win text
        this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            'Congrats!\nAll farming goals achieved!',
            {
                fontSize: '24px',
                color: '#000000',
                align: 'center',
            }
        ).setOrigin(0.5).setDepth(0.2);

        //Pauses the game, we can add other things after this like a reset etc
        gameManager.quitGame();
        this.scene.pause();
    }
}

function saveGame(slotNumber: number): boolean {
    try {
        const gameState: GameSaveData = {
            gridTiles: gridTiles.map(row => 
                row.map(tile => ({
                    sun: tile.sun,
                    water: tile.water,
                    plantType: tile.plantType,
                    growthStage: tile.growthStage
                }))
            ),
            playerPosition: { 
                x: player.x, 
                y: player.y 
            },
            continuousMode: continuousMode
        };

        gameManager.quitGame();
        localStorage.setItem(`farmgame_save_${slotNumber}`, JSON.stringify(gameState));
        return true;
    } catch (error) {
        console.error('Failed to save game:', error);
        return false;
    }
}

function loadGame(slotNumber: number): boolean {
    try {
        const savedData = localStorage.getItem(`farmgame_save_${slotNumber}`);
        if (!savedData) return false;

        const loadedGame: GameSaveData = JSON.parse(savedData);

        // Restore grid tiles
        loadedGame.gridTiles.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                const currentTile = gridTiles[rowIndex][colIndex];
                currentTile.sun = tile.sun;
                currentTile.water = tile.water;
                currentTile.plantType = tile.plantType;
                currentTile.growthStage = tile.growthStage;

                // Update tile visuals
                if (currentTile.plantText) {
                    currentTile.plantText.setText(
                        tile.plantType && tile.growthStage !== undefined 
                            ? PLANT_STAGES[tile.plantType][tile.growthStage] 
                            : ''
                    );
                    
                    // Reset tile color based on plant type
                    if (tile.plantType === 'GARLIC') {
                        currentTile.tile.setFillStyle(0xDDA0DD, 1);
                    } else if (tile.plantType === 'CUCUMBER') {
                        currentTile.tile.setFillStyle(0x228B22, 1);
                    } else if (tile.plantType === 'TOMATO') {
                        currentTile.tile.setFillStyle(0xFF4500, 1);
                    }
                }
            });
        });

        // Restore player position and movement mode
        player.x = loadedGame.playerPosition.x;
        player.y = loadedGame.playerPosition.y;
        targetX = player.x;
        targetY = player.y;
        continuousMode = loadedGame.continuousMode;

        return true;
    } catch (error) {
        console.error('Failed to load game:', error);
        return false;
    }
}

function undoLastAction() {
    const action = actionManager.undo();
    if (action) {
        const tile = gridTiles[action.row][action.col];

        // Restore the previous state of the tile
        if (action.previousState) {
            tile.plantType = action.previousState.plantType;
            tile.growthStage = action.previousState.growthStage;

            // Update tile visuals based on the restored state
            if (!tile.plantType) {
                tile.tile.setFillStyle(0x000000, 0); // Clear the tile
                if (tile.plantText) tile.plantText.setText('');
            } else {
                if (tile.plantType === 'GARLIC') tile.tile.setFillStyle(0xDDA0DD, 1);
                else if (tile.plantType === 'CUCUMBER') tile.tile.setFillStyle(0x228B22, 1);
                else if (tile.plantType === 'TOMATO') tile.tile.setFillStyle(0xFF4500, 1);

                if (tile.plantText) {
                    tile.plantText.setText(
                        tile.plantType && tile.growthStage !== undefined
                            ? PLANT_STAGES[tile.plantType][tile.growthStage]
                            : ''
                    );
                }
            }
        }
    }
}

function redoLastAction() {
    const action = actionManager.redo();
    if (action && action.currentState) {
        const tile = gridTiles[action.row][action.col];
        
        // Restore the exact state
        tile.plantType = action.currentState.plantType;
        tile.growthStage = action.currentState.growthStage;
        
        // Update visuals
        switch (action.plantedType) {
            case 'GARLIC':
                tile.tile.setFillStyle(0xDDA0DD, 1);
                break;
            case 'CUCUMBER':
                tile.tile.setFillStyle(0x228B22, 1);
                break;
            case 'TOMATO':
                tile.tile.setFillStyle(0xFF4500, 1);
                break;
        }
        
        if (tile.plantText) {
            tile.plantText.setText(PLANT_STAGES[tile.plantType][tile.growthStage]);
        }
    }
}

// Determines what goes on in the game
const defaultScenario: GameScenario = {
    name: "Basic Farming",
    description: "A standard farming scenario with occasional harsh sunlight",
    conditions: [
        {
            turnStart: 0,
            turnEnd: 20,
            sunMultiplier: 1,
            waterMultiplier: 1,
            description: "Normal weather conditions"
        },
        {
            turnStart: 21,
            turnEnd: 40,
            sunMultiplier: 20,
            waterMultiplier: -0.5,
            description: "Harsh sunlight period"
        },
        {
            turnStart: 41,
            sunMultiplier: 1,
            waterMultiplier: 1,
            description: "Return to normal conditions"
        }
    ],
    victoryConditions: [
        { plantType: 'GARLIC', requiredGrowthStage: 2, requiredCount: 5 },
        { plantType: 'CUCUMBER', requiredGrowthStage: 2, requiredCount: 5 },
        { plantType: 'TOMATO', requiredGrowthStage: 2, requiredCount: 5 }
    ]
};

function incrementTurn() {
    currentTurn++;
    const currentCondition = getCurrentScenarioCondition();
    if (currentCondition) {
        console.log(`Turn ${currentTurn}: ${currentCondition.description}`);
    }
}

// Add this function to get current scenario conditions
function getCurrentScenarioCondition(): ScenarioCondition | null {
    if (!currentScenario) return null;
    
    return currentScenario.conditions.find(condition => 
        currentTurn >= condition.turnStart && 
        (!condition.turnEnd || currentTurn <= condition.turnEnd)
    ) || null;
}