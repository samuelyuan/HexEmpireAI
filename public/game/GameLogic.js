import { Config } from './Config.js';
import { Animations } from './Animations.js';

export class GameLogic {
    constructor(gameState, pathfinder, bot) {
        this.state = gameState;
        this.pathfinder = pathfinder;
        this.bot = bot;
    }

    resetGameLog() {
        const gamelogElement = document.getElementById('gamelog');
        if (gamelogElement) gamelogElement.innerHTML = "";
    }

    updateGameLog(message) {
        const gamelogElement = document.getElementById('gamelog');
        if (gamelogElement) gamelogElement.innerHTML += message + "<br/>";
    }

    tick() {
         for (const key in this.state.armies) {
             const army = this.state.armies[key];
             if (army.remove_time > 0) {
                 army.remove_time--;
                 if (army.remove_time === 0) {
                     this.deleteArmy(army);
                     delete this.state.armies[key];
                 }
             }
         }
    }

    // --- Turn Management ---

    cleanupTurn() {
        const party = this.state.parties[this.state.turnParty];
        for (const army of party.armies) {
            if (army.moved) {
                army.moved = false;
            } else {
                army.morale--;
            }
        }
    }

    updateBoard() {
        // 0. Cleanup Dead Armies
        this.cleanupArmies();

        // 1. Re-list armies from fields (sync source of truth)
        this.listArmies();

        // 2. Check Party Status (Capital Control)
        for (const party of this.state.parties) {
            this.checkPartyState(party);
        }

        // 3. Update Party Territories & Morale
        for (const party of this.state.parties) {
            party.towns = [];
            party.ports = [];
            party.lands = [];
        }

        for (let x = 0; x < this.state.width; x++) {
            for (let y = 0; y < this.state.height; y++) {
                const field = this.state.getField(x, y);
                this.updateFieldVisuals(field); 

                // 1. Transfer Land Ownership if Faction is Dead
                if (field.party >= 0) {
                    const landOwner = this.state.parties[field.party];
                    if (landOwner.status === 0) {
                        // Transfer to the one who owns their capital
                        field.party = landOwner.capital.party;
                    }
                }

                // 2. Disband Armies of Dead Factions
                if (field.army) {
                    const armyPartyId = field.army.party;
                    if (this.state.parties[armyPartyId].status === 0) {
                        this.setExplosion(field.army, field.army, null);
                        this.updateGameLog(`Disbanded ${this.state.parties[armyPartyId].name} army at (${field.fx}, ${field.fy})`);
                        // field.army will be removed by cleanupArmies in next tick
                    }
                }

                // 3. Add to lists (using new owner)
                if (field.party >= 0) {
                    const p = this.state.parties[field.party];
                    if (field.estate === "town") p.towns.push(field);
                    else if (field.estate === "port") p.ports.push(field);
                    else p.lands.push(field);
                }
            }
        }

        // 4. Update Party Morale
        for (const party of this.state.parties) {
            let morale = 0;
            if (party.armies.length > 0) {
                for (const army of party.armies) {
                    // Min morale check
                    const minMorale = Math.floor(party.totalCount / 50);
                    if (army.morale < minMorale) army.morale = minMorale;
                    if (army.morale > army.count) army.morale = army.count;
                    
                    morale += army.morale;
                }
                morale = Math.floor(morale / party.armies.length);
            } else {
                morale = 10;
            }
            party.morale = morale;
        }

        // 5. Update Human Condition
        this.updateHumanCondition();
    }

    listArmies() {
        // Reset lists
        for (const party of this.state.parties) {
            party.armies = [];
            party.totalCount = 0;
            party.totalPower = 0;
        }

        for (let x = 0; x < this.state.width; x++) {
            for (let y = 0; y < this.state.height; y++) {
                const field = this.state.getField(x, y);
                if (field.army && field.army.remove_time < 0) {
                    const party = this.state.parties[field.army.party];
                    party.armies.push(field.army);
                    party.totalCount += field.army.count;
                    party.totalPower += (field.army.count + field.army.morale);
                }
            }
        }
    }

    cleanupArmies() {
        for (const key in this.state.armies) {
            const army = this.state.armies[key];
            
            if (army.remove && army.remove_time < 0) {
                // Remove from waiting lists
                if (army.waiting) army.waiting.is_waiting = false;
                
                this.deleteArmy(army);
                delete this.state.armies[key];
            }
        }
    }

    deleteArmy(army) {
        if (army.field.army === army) {
            army.field.army = null;
        }
    }

    checkPartyState(party) {
        // If game just started, skip
        // In GameState, we might need an 'init' flag or check turns
        
        // Logic:
        // 0: Dead (Capital taken by someone else)
        // 1: Alive (Owns Capital)
        // >1: Alive + Controls other capitals

        const capitalField = party.capital;
        if (capitalField.party !== party.id) {
            party.status = 0;
            party.provincesCp = null;
            return;
        }

        // Check other capitals
        const otherCapitals = [];
        for (const otherP of this.state.parties) {
            if (otherP.id !== party.id && otherP.capital.party === party.id) {
                // Check if other party is eliminated (no armies)
                // Actually original logic: "&& !board.hw_parties_armies[p].length"
                if (otherP.armies.length === 0) {
                    otherCapitals.push(otherP.capital);
                }
            }
        }

        if (otherCapitals.length > 0) {
            party.status = 1 + otherCapitals.length;
            party.provincesCp = otherCapitals;
        } else {
            party.status = 1;
            party.provincesCp = null;
        }
    }

    updateHumanCondition() {
        const humanParty = this.state.parties[this.state.humanPlayerId];
        if (!humanParty) return;

        const humanTotalPower = humanParty.morale + humanParty.totalCount;
        let condition = 1;

        for (const party of this.state.parties) {
            if (party.id !== this.state.humanPlayerId && party.status > 0) {
                const enemyPower = party.morale + party.totalCount;
                if (humanTotalPower < 0.3 * enemyPower) {
                    condition = 3;
                } else if (condition < 3 && humanTotalPower < 0.6 * enemyPower) {
                    condition = 2;
                } else if (humanParty.provincesCp && humanParty.provincesCp.length >= 2 && humanTotalPower > 2 * enemyPower) {
                    condition = 0;
                }
            }
        }
        this.state.humanCondition = condition;
    }

    updateFieldVisuals(field) {
        // This mirrors updateField in Map.js - mostly for visual properties
        // We can simplify this or move to Render, but state might need it for logic?
        // Actually it sets _visible flags on sub-objects. 
        // We can just rely on field.estate
    }

    // --- Movement & Combat ---

    makeMove(partyId) {
        // Helper for AI turn
        const profitability = this.bot.calcArmiesProfitability(partyId, this.state);
        // Sort logic is inside bot or here?
        // Original: profitability.sort(orderArmies)
        
        profitability.sort((a, b) => {
            if (a.profitability > b.profitability) return -1;
            if (a.profitability < b.profitability) return 1;
            const aTotal = a.count + a.morale;
            const bTotal = b.count + b.morale;
            return bTotal - aTotal;
        });

        if (profitability.length === 0) return;

        const bestArmy = profitability[0];
        const move = bestArmy.move;
        const party = this.state.parties[partyId];

        if (!move.wait_for_support) {
            party.waitForSupportField = null;
            party.waitForSupportCount = 0;
            this.moveArmy(bestArmy, move);
        } else {
             if (move === party.waitForSupportField) {
                 party.waitForSupportCount++;
             } else {
                 party.waitForSupportField = move;
                 party.waitForSupportCount = 0;
             }
             
             // Check support
             const supportArmies = this.bot.supportArmy(partyId, bestArmy, move, this.state);
             if (supportArmies.length > 0) {
                 // Sort support armies
                 supportArmies.sort((a, b) => b.tmp_prof - a.tmp_prof);
                 this.moveArmy(supportArmies[0], supportArmies[0].move);
             } else {
                 this.moveArmy(bestArmy, move);
             }
        }
    }

    moveArmy(army, targetField) {
        const sourceField = army.field;
        this.updateGameLog(`${this.state.parties[army.party].name} moved unit from (${sourceField.fx},${sourceField.fy}) to (${targetField.fx},${targetField.fy})`);

        // Animate army movement
        Animations.animateMove(army, targetField._x, targetField._y);

        // Pact check
        if (this.state.peace >= 0) {
            if ((targetField.party === this.state.peace && army.party === this.state.humanPlayerId) ||
                (army.party === this.state.peace && targetField.party === this.state.humanPlayerId)) {
                this.addMoraleForAll(30, targetField.party);
                this.state.pactJustBroken = this.state.peace;
                this.state.peace = -1;
            }
        }

        army.field.army = null;
        army.field = targetField;
        army.moved = true;
        
        // Update pixel position immediately? Or let render handle interpolation?
        // For now instant update to match logic
        // army._x = targetField._x ... (Render does this)

        if (targetField.army && targetField.party !== army.party) {
            // Attack
            if (!this.attack(army, targetField)) {
                this.updateBoard();
                return false;
            }
        } else if (targetField.army && targetField.party === army.party) {
            // Join - Animate merge effect
            Animations.animateMerge(army, targetField.army);
            
            if (targetField.army.count + army.count <= Config.UNITS.MAX_COUNT) {
                this.joinUnits(army.count, army.morale, army.party, targetField.army);
            } else {
                const space = Config.UNITS.MAX_COUNT - targetField.army.count;
                const leftover = army.count - space;
                // Fill target
                this.joinUnits(space, army.morale, army.party, targetField.army);
                // Leave rest in source
                this.joinUnits(leftover, army.morale, army.party, null, sourceField);
            }
            this.setArmyRemoval(army, targetField.army);
            targetField.army.moved = true;
            this.annexLand(army.party, targetField, false);
            this.updateBoard();
            return true;
        }

        targetField.army = army;
        this.annexLand(army.party, targetField, false);
        this.updateBoard();
        return true;
    }

    attack(attacker, field) {
        const defender = field.army;
        if (!defender) return true;

        const attPower = attacker.count + attacker.morale;
        const defPower = defender.count + defender.morale;

        // Animate attack sequence
        Animations.animateAttack(attacker, defender);

        if (attPower > defPower) {
            // Attacker Wins
            this.addMoraleForAll(-Math.floor(defender.count / 10), defender.party);
            
            // Calculate losses
            const ratio = defPower / attPower;
            let losses = Math.floor(ratio * attacker.count);
            attacker.count -= losses;
            if (attacker.count <= 0) attacker.count = 1;
            
            if (attacker.morale > attacker.count) attacker.morale = attacker.count;

            Animations.animateExplosion(defender);
            this.setExplosion(attacker, defender, attacker);
            return true;
        } else {
            // Defender Wins
            this.addMoraleForAll(-Math.floor(attacker.count / 10), attacker.party);
            
            const ratio = attPower / defPower;
            let losses = Math.floor(ratio * defender.count);
            defender.count -= losses;
            if (defender.count <= 0) defender.count = 1;

            if (defender.morale > defender.count) defender.morale = defender.count;

            Animations.animateExplosion(attacker);
            this.setExplosion(attacker, attacker, defender);
            return false;
        }
    }

    joinUnits(count, morale, partyId, targetArmy, targetField) {
        // targetArmy OR targetField must be provided
        if (!targetArmy && targetField) targetArmy = targetField.army;
        if (!targetArmy && !targetField) return; // Error

        if (!targetArmy) {
            // Create new army at targetField
            if (count <= 0) return;
            
            const army = {
                id: `army${this.state.armyIdCounter++}`,
                field: targetField,
                party: partyId,
                count: count > Config.UNITS.MAX_COUNT ? Config.UNITS.MAX_COUNT : count,
                morale: morale,
                moved: false,
                remove: false,
                remove_time: -1,
                exploding: null,
                waiting: null,
                is_waiting: false,
                _x: targetField._x,
                _y: targetField._y,
                visual: { x: targetField._x, y: targetField._y }
            };
            if (army.morale > army.count) army.morale = army.count;
            if (army.morale < 0) army.morale = 0;

            targetField.army = army;
            this.state.armies[army.id] = army;
        } else {
            // Merge into existing
             const newCount = targetArmy.count + count;
             const newMorale = Math.floor((targetArmy.count * targetArmy.morale + count * morale) / newCount);
             
             targetArmy.count = newCount > Config.UNITS.MAX_COUNT ? Config.UNITS.MAX_COUNT : newCount;
             targetArmy.morale = newMorale;
             if (targetArmy.morale > targetArmy.count) targetArmy.morale = targetArmy.count;
        }
    }

    setExplosion(attacking, exploding, waiting) {
        attacking.exploding = exploding;
        exploding.remove_time = 36; // Frames?
        if (waiting) {
            attacking.waiting = waiting;
            waiting.is_waiting = true;
        }
    }

    setArmyRemoval(army, waiting) {
        army.remove = true;
        army.remove_time = 24;
        if (waiting) {
            army.waiting = waiting;
            waiting.is_waiting = true;
        }
    }

    addMoraleForAll(amount, partyId) {
        if (amount === 0) return;
        const party = this.state.parties[partyId];
        for (const army of party.armies) {
             let m = army.morale + amount;
             if (m < 0) m = 0;
             if (m > army.count) m = army.count;
             army.morale = m;
        }
    }

    // --- Annexation ---

    annexLand(partyId, field, startup) {
        if (!field.army && !startup) return;
        if (field.type !== "land") return;

        // Morale calculations
        if (field.party >= 0 && field.party !== partyId) {
            // Lost territory logic
             this.addMoraleForAll(this.calcMoraleLost(field.party, field), field.party);
             
             // Liberation logic
             if (field.capital >= 0 && field.capital === field.party) {
                 const originalOwner = this.state.parties[field.party];
                 if (originalOwner.provincesCp) {
                     for (const cap of originalOwner.provincesCp) {
                         // Liberate
                         if (cap.army) {
                             this.setExplosion(cap.army, cap.army, null);
                             cap.army = null;
                         }
                         // Respawn original
                         this.joinUnits(99, 99, cap.capital, null, cap);
                         this.annexLand(cap.capital, cap, true);
                     }
                 }
             }
        }

        if (!startup && field.party !== partyId) {
             const earned = this.calcMoraleEarned(partyId, field);
             // Apply earned. [all, army]
             // Original: addMoraleForAA
             const army = field.army;
             if (army) {
                 let m = army.morale + earned[1];
                 if (m < 0) m = 0;
                 if (m > army.count) m = army.count;
                 army.morale = m;
             }
             this.addMoraleForAll(earned[0], partyId);
        }

        // Change ownership
        field.party = partyId;

        // Auto-annex empty neighbours
        for (const n of field.neighbours) {
            if (n && n.type === "land" && !n.estate && !n.army) {
                // Check peace treaty constraint
                const peace = this.state.peace;
                if (peace >= 0 && 
                   ((n.party === peace && partyId === this.state.humanPlayerId) ||
                    (partyId === peace && n.party === this.state.humanPlayerId))) {
                    continue; 
                }

                if (!startup && n.party !== partyId) {
                    const earned = this.calcMoraleEarned(partyId, n);
                     // Original logic adds morale to 'field.army' which is the conqueror
                     const army = field.army;
                     if (army) {
                         let m = army.morale + earned[1];
                         if (m < 0) m = 0;
                         if (m > army.count) m = army.count;
                         army.morale = m;
                     }
                     this.addMoraleForAll(earned[0], partyId);
                }
                n.party = partyId;
            }
        }
    }

    calcMoraleLost(partyId, field) {
        // Logic for morale lost when field is lost
        if (field.capital === partyId) {
            if (this.state.humanPlayerId === partyId) {
                // Game over?
            }
            // Original returns 0, handled elsewhere?
            return 0;
        } else {
             if (field.capital >= 0) {
                 if (this.state.humanPlayerId === partyId) {
                     // board.news = "town_lost"
                 }
                 return -30;
             }
             if (field.estate === "town") return -10;
             if (field.estate === "port") return -5;
        }
        return 0;
    }

    calcMoraleEarned(partyId, field) {
         if (field.capital >= 0) {
             if (field.capital === field.party) {
                 this.updateGameLog(`${this.state.parties[partyId].name} conquered ${this.state.parties[field.party].name}`);
                 return [50, 30];
             }
             this.updateGameLog(`${this.state.parties[partyId].name} captured capital from ${this.state.parties[field.party].name}`);
             return [30, 20];
         }
         if (field.estate === "town") {
             if (field.party >= 0) {
                 this.updateGameLog(`${this.state.parties[partyId].name} captured town ${field.town_name}`);
             } else {
                 this.updateGameLog(`${this.state.parties[partyId].name} annexed town ${field.town_name}`);
             }
             return [10, 10];
         }
         if (field.estate === "port") {
             if (field.party >= 0) {
                 this.updateGameLog(`${this.state.parties[partyId].name} captured port ${field.town_name}`);
             } else {
                 this.updateGameLog(`${this.state.parties[partyId].name} annexed port ${field.town_name}`);
             }
             return [5, 5];
         }
         if (field.type === "land") return [1, 0];
         return [0, 0];
    }
    
    unitsSpawn(partyId) {
         const party = this.state.parties[partyId];
         let ucount = party.lands.length + party.ports.length * 5;
         ucount = Math.floor(ucount / (party.towns.length || 1)); // Avoid div by zero
         
         // Capital spawn
         if (party.capital.party === partyId) {
             let morale = party.morale;
             if (party.capital.army) morale = party.capital.army.morale;
             this.joinUnits(5, morale, partyId, null, party.capital);
             this.annexLand(partyId, party.capital, true);
         }

         // Towns spawn
         for (const town of party.towns) {
             let morale = party.morale;
             if (town.army) morale = town.army.morale;
             this.joinUnits(5 + ucount, morale, partyId, null, town);
             this.annexLand(partyId, town, true);
         }
    }

}
