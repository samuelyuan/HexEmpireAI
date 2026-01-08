import { Config } from './Config.js';

export class GameState {
    constructor() {
        this.width = Config.MAP.WIDTH;
        this.height = Config.MAP.HEIGHT;
        this.hexWidth = Config.MAP.HEX_WIDTH;
        this.hexHeight = Config.MAP.HEX_HEIGHT;

        this.pixelWidth = Math.ceil((this.width - 1) * (this.hexWidth * 0.75) + this.hexWidth);
        this.pixelHeight = (this.height - 1) * this.hexHeight + this.hexHeight + (this.hexHeight / 2);

        // Key: "f{x}x{y}" -> Field object
        // Field object structure:
        // { fx, fy, _x, _y, type, estate, party, capital, army, neighbours, ... }
        this.fields = {}; 
        
        // Parties
        this.parties = [];
        for (let i = 0; i < 4; i++) {
            this.parties.push({
                id: i,
                name: Config.COLORS.FACTION_NAMES[i],
                capital: null, // The capital field
                towns: [],     // Array of fields
                ports: [],     // Array of fields
                lands: [],     // Array of fields
                armies: [],    // Array of army objects
                
                morale: 10,
                status: 1, // 1=Alive, 0=Eliminated
                totalCount: 0,
                totalPower: 0,
                control: "computer", // "human" | "computer"
                
                // AI / State helpers
                waitForSupportField: null,
                waitForSupportCount: 0,
                provincesCp: null, // Captures of other capitals
            });
        }

        // Global State
        this.turn = 0;
        this.turnParty = -1; // Current active party index
        this.humanPlayerId = -1;
        this.difficulty = 5;
        this.duel = false; // True if < 3 parties left
        
        this.peace = -1; // Party ID we have a pact with
        this.pactJustBroken = -1;

        this.humanCondition = 1;
        this.isSpectating = false; // True when player is defeated and watching AI battle

        // Canvases
        this.backgroundCanvas = null;
        this.seaCanvas = null;
        
        // Armies Map (Key: "army{id}" -> Army Object)
        this.armies = {}; 
        this.armyIdCounter = 0;

        // Terrain clusters (for generation)
        this.lands = []; // Array of arrays of fields
        this.allTowns = []; // List of all town fields
    }

    getField(x, y) {
        return this.fields[`f${x}x${y}`];
    }

    setField(x, y, field) {
        this.fields[`f${x}x${y}`] = field;
    }
}
