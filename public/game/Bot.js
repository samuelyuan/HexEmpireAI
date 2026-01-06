export class Bot {
  constructor(pathfinder) {
    this.pathfinder = pathfinder;
  }

  calcArmiesProfitability(partyId, state) {
    const self = this;
    const party = state.parties[partyId];

    function finalProfitability(field, army) {
      let totalProfitability = -10000000;
      let canTakeCapital = false;

      for (const otherParty of state.parties) {
        if (otherParty.id !== partyId) {
          let profitability = -10000000;
          // Other party still owns original capital city
          if (otherParty.capital.party === otherParty.capital.capital) {
            profitability = field.profitability[otherParty.id];
            if (otherParty.control === "human") {
              profitability += state.difficulty * 2;
            }
          }
          // Don't betray the pact unless there are only 2 powers left
          if (state.peace === partyId && otherParty.id === state.humanPlayerId && !state.duel) {
            profitability -= 500;
          }
          if (totalProfitability < profitability) {
            totalProfitability = profitability;
          }
        }
      }

      if (state.peace === partyId && state.humanPlayerId === field.party && !state.duel) {
        totalProfitability -= 500;
      }

      // Taking enemy land
      if (field.type === "land" && field.party !== partyId) {
        // Original enemy capital
        if (field.capital >= 0 && field.capital === field.party && army.count + army.morale > field.army.count + field.army.morale) {
          totalProfitability += 1000000;
          canTakeCapital = true;
        } else if (field.capital >= 0) {
          totalProfitability += 20;
        } else if (field.estate === "town") {
          totalProfitability += 5;
        } else if (field.estate === "port") {
          totalProfitability += 3;
        } else if (field.n_town) {
          totalProfitability += 3;
        }
      }

      // Field has enemy army
      if (field.army && field.army.party !== partyId) {
        const enemyParty = state.parties[field.army.party];
        if (field.n_capital[partyId]) {
          totalProfitability += 1000;
        }
        
        // Opponent check
        if (field.army.party !== state.humanPlayerId
          && (enemyParty.totalPower > 1.5 * party.totalPower)
          && (field.army.count + field.army.morale > army.count + army.morale)
          && ((field.party < 2 && partyId < 2) || (field.party > 1 && partyId > 1))) {
          totalProfitability += 200;
        }
        
        if (state.difficulty > 5 && field.army.party !== state.humanPlayerId) {
          totalProfitability -= 250;
        }
      }

      // Join with own forces
      if (field.army && field.army.party === partyId) {
        if (field.army.count > army.count && field.army.count < 70) {
          totalProfitability += 2;
        }
      }

      // Army is stationed in capital
      if (army.field.capital === partyId && !field.army && state.turn < 5) {
        totalProfitability += 50;
      }

      const neighbour = self.calcNeighboursInfo(partyId, field);
      const enemyNeighbour = self.calcEnemyNeighboursPower(partyId, field);
      const fieldArmyTotal = field.army ? field.army.count + field.army.morale : 0;

      if ((neighbour.power < enemyNeighbour && neighbour.power < 300 || (army.count + army.morale < fieldArmyTotal) && army.count < 90)
        && !field.n_capital[partyId]
        && !canTakeCapital) {
          if (party.waitForSupportField === field) {
            if (party.waitForSupportCount < 5) {
              field.wait_for_support = true;
            } else {
              totalProfitability -= 5;
            }
          } else {
            field.wait_for_support = true;
          }
      }
      return totalProfitability;
    }

    function findBestMoveVal(army) {
      const moves = self.pathfinder.getPossibleMoves(army.field, true, false);
      for (let i = 0; i < moves.length; i++) {
        moves[i].wait_for_support = false;
        moves[i].tmp_prof = finalProfitability(moves[i], army);
      }
      // Sort desc
      moves.sort((a, b) => b.tmp_prof - a.tmp_prof);
      return moves[0];
    }

    const movableArmies = this.getMovableArmies(partyId, state);
    for (const army of movableArmies) {
      const bestMove = findBestMoveVal(army);
      if (!bestMove) {
        continue;
      }
      army.move = bestMove;
      army.profitability = army.move.tmp_prof;
      if (army.field.capital === army.party && state.turn > 5) {
        army.profitability -= 1000;
      }
    }
    return movableArmies;
  }

  calcNeighboursInfo(partyId, field) {
    let power = 0;
    let count = 0;
    let nonEnemyLand = 0;
    let waitForSupport = false;
    const furtherNeighbours = this.pathfinder.getFurtherNeighbours(field);
    
    for (const n of furtherNeighbours) {
      if (!n) continue;

      if (n.army && n.army.party === partyId) {
        power += (n.army.count + n.army.morale);
        count++;
      }
      if (n.type === field.type && (n.party === partyId || n.party < 0)) {
        nonEnemyLand++;
      }
      if (n.wait_for_support) {
        waitForSupport = true;
      }
    }
    return {
      power: power,
      count: count,
      non_enemy_land: nonEnemyLand,
      wait_for_support: waitForSupport,
    };
  }

  calcEnemyNeighboursPower(partyId, field) {
    const furtherNeighbours = this.pathfinder.getFurtherNeighbours(field);
    let power = 0;
    for (const n of furtherNeighbours) {
      if (!n) continue;
      if (n.army && n.army.party !== partyId) {
        power += (n.army.count + n.army.morale);
      }
    }
    return power;
  }

  supportArmy(partyId, army, field, state) {
    const self = this;
    const party = state.parties[partyId];

    function findBestMoveVal(army) {
      const moves = self.pathfinder.getPossibleMoves(army.field, true, false);
      const supportMoves = [];

      for (const m of moves) {
        if (m !== field && (!m.army || m.army.party < 0 || m.army.party === partyId)) {
          m.tmp_prof = -self.pathfinder.getDistance(m, field);
          supportMoves.push(m);
        }
      }
      supportMoves.sort((a, b) => b.tmp_prof - a.tmp_prof);
      return supportMoves[0];
    }

    const movableArmies = this.getMovableArmies(partyId, state);
    const supportArmies = [];
    
    for (const a of movableArmies) {
      if (a !== army && a.field.capital !== partyId) {
        const bestMove = findBestMoveVal(a);
        if (!bestMove) continue;
        
        a.move = bestMove;
        a.profitability = a.move.tmp_prof;
        
        if (a.move !== field
          && (!a.move.army || a.move.army.party < 0 || a.move.army.party === partyId)
        ) {
          supportArmies.push(a);
        }
      }
    }
    return supportArmies;
  }

  getMovableArmies(partyId, state) {
    const movableArmies = [];
    const armies = state.parties[partyId].armies;
    for (const army of armies) {
      if (!army.moved) {
        movableArmies.push(army);
      }
    }
    return movableArmies;
  }
}
