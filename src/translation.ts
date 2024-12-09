// translations.ts

interface TranslationStrings {
    ui: {
        headers: {
            gameControls: string;
            growthConditions: string;
            currentScenario: string;
        };
        controls: {
            saveLoad: {
                title: string;
                save: string;
                load: string;
            };
            movement: {
                title: string;
                grid: string;
                continuous: string;
                undo: string;
                redo: string;
            };
            planting: {
                title: string;
                garlic: string;
                cucumber: string;
                tomato: string;
            };
        };
        plants: {
            garlic: string;
            cucumber: string;
            tomato: string;
            requirements: {
                water: string;
                sun: string;
                needsAdjacent: string;
            };
        };
        scenario: {
            title: string;
            description: string;
            conditions: {
                normal: string;
                harsh: string;
                return: string;
            };
            victory: {
                title: string;
                requirements: string[];
            };
        };
        warning: {
            title: string;
            overcrowding: string;
        };
        victory: {
            title: string;
            message: string;
            subMessage: string;
        };
    };
}

// Default English translations
export const translations: { [key: string]: TranslationStrings } = {
    en: {
        ui: {
            headers: {
                gameControls: "GAME CONTROLS",
                growthConditions: "GROWTH CONDITIONS",
                currentScenario: "CURRENT SCENARIO"
            },
            controls: {
                saveLoad: {
                    title: "SAVE/LOAD",
                    save: "Save Game",
                    load: "Load Game"
                },
                movement: {
                    title: "MOVEMENT",
                    grid: "Grid Movement",
                    continuous: "Toggle Continuous",
                    undo: "Undo Move",
                    redo: "Redo Move"
                },
                planting: {
                    title: "PLANTING",
                    garlic: "Plant Garlic",
                    cucumber: "Plant Cucumber",
                    tomato: "Plant Tomato"
                }
            },
            plants: {
                garlic: "GARLIC",
                cucumber: "CUCUMBER",
                tomato: "TOMATO",
                requirements: {
                    water: "Water ≥ {0}",
                    sun: "Sun {0} {1}",
                    needsAdjacent: "Needs adjacent tomato"
                }
            },
            scenario: {
                title: "Basic Farming",
                description: "A standard farming scenario with occasional harsh sunlight",
                conditions: {
                    normal: "Normal weather conditions",
                    harsh: "Harsh sunlight period",
                    return: "Return to normal conditions"
                },
                victory: {
                    title: "VICTORY REQUIREMENTS",
                    requirements: [
                        "5 Mature Garlic Plants",
                        "5 Mature Cucumber Plants",
                        "5 Mature Tomato Plants"
                    ]
                }
            },
            warning: {
                title: "WARNING",
                overcrowding: "Plants die with 3+ neighbors"
            },
            victory: {
                title: "Congratulations!",
                message: "All farming goals achieved!",
                subMessage: "Your farm is flourishing!"
            }
        }
    }
};

// Translation helper function
export function translate(key: string, language: string = 'en', ...args: any[]): string {
    const keys = key.split('.');
    let value: any = translations[language];  
    
    for (const k of keys) {
        if (value === undefined || typeof value !== 'object') return key; 
        value = value[k]; 
    }
    
    if (typeof value !== 'string') return key; 

    
    return value.replace(/\{(\d+)\}/g, (match, index) => {
        const argIndex = parseInt(index);
        return args[argIndex] !== undefined ? args[argIndex].toString() : match;
    });
}
