class Bot {
  constructor(pathfinder) {
    this.pathfinder = pathfinder;
  }

  calcArmiesProfitability(party, board) {
    var self = this;
    function finalProfitability(field, army) {
      var totalProfitability = -10000000;
      var canTakeCapital = false;
      for (var partyIndex = 0; partyIndex < board.hw_parties_count; partyIndex++) {
        if (partyIndex != party) {
          var profitability = -10000000;
          // Other party still owns original capital city (party is currently owning party, capital is original owner)
          if (board.hw_parties_capitals[partyIndex].party == board.hw_parties_capitals[partyIndex].capital) {
            profitability = field.profitability[partyIndex];
            if (board.hw_parties_control[partyIndex] == "human") {
              profitability = profitability + board.difficulty * 2;
            }
          }
          // Don't betray the pact unless there are only 2 powers left, human and other power
          if (board.hw_peace == party && partyIndex == board.human && !board.duel) {
            profitability = profitability - 500;
          }
          // Update total profitability
          if (totalProfitability < profitability) {
            totalProfitability = profitability;
          }
        }
      }
      if (board.hw_peace == party && board.human == field.party && !board.duel) {
        totalProfitability = totalProfitability - 500;
      }
      // Taking enemy land
      if (field.type == "land" && field.party != party) {
        // Original enemy capital can be captured
        if (field.capital >= 0 && field.capital == field.party && army.count + army.morale > field.army.count + field.army.morale) {
          totalProfitability = totalProfitability + 1000000;
          canTakeCapital = true;
        } else if (field.capital >= 0) {
          // Can attack enemy capital, but don't have enough forces to take it
          totalProfitability = totalProfitability + 20;
        } else if (field.estate == "town") {
          // Enemy town can be taken and units can respawn
          totalProfitability = totalProfitability + 5;
        } else if (field.estate == "port") {
          // Enemy port can be taken
          totalProfitability = totalProfitability + 3;
        } else if (field.n_town) {
          // Any town
          totalProfitability = totalProfitability + 3;
        }
      }
      // Field has enemy army
      if (field.army && field.army.party != party) {
        // Field is neighbour of own capital
        if (field.n_capital[party]) {
          totalProfitability = totalProfitability + 1000;
        }
        // Opponent computer player with over 1.5 * total power of current party
        // and they are both on left side (0,1) or right side (2,3)
        if (field.army.party != board.human
          && (board.hw_parties_total_power[field.party] > 1.5 * board.hw_parties_total_power[party])
          && (field.army.count + field.army.morale > army.count + army.morale)
          && ((field.party < 2 && party < 2) || (field.party > 1 && party > 1))) {
          totalProfitability = totalProfitability + 200;
        }
        // On higher difficulty levels, attack computer party less and focus more on human party
        if (board.difficulty > 5 && field.army.party != board.human) {
          totalProfitability = totalProfitability - 250;
        }
      }

      // Join with own forces
      if (field.army && field.army.party == party) {
        // Small chance of joining forces if army is small enough
        if (field.army.count > army.count && field.army.count < 70) {
          totalProfitability = totalProfitability + 2;
        }
      }

      // Army is stationed in capital, field has no army
      if (army.field.capital == party && !field.army && board.turns < 5) {
        totalProfitability = totalProfitability + 50;
      }
      var neighbour = self.calcNeighboursInfo(party, field);
      var enemyNeighbour = self.calcEnemyNeighboursPower(party, field);
      var fieldArmyTotal = field.army ? field.army.count + field.army.morale : 0;
      if ((neighbour.power < enemyNeighbour && neighbour.power < 300 || (army.count + army.morale < fieldArmyTotal) && army.count < 90)
        && !field.n_capital[party]
        && !canTakeCapital) {
          if (board.hw_parties_wait_for_support_field[party] == field) {
            if (board.hw_parties_wait_for_support_count[party] < 5) {
              field.wait_for_support = true;
            } else {
              totalProfitability = totalProfitability - 5;
            }
          } else {
            field.wait_for_support = true;
          }
      }
      return totalProfitability;
    }
    function orderMoves(a, b) {
      // Sort by profitability
      var aValue = a.tmp_prof;
      var bValue = b.tmp_prof;
      if (aValue > bValue) {
        return -1;
      }
      if (aValue < bValue) {
        return 1;
      }
      return 0;
    }
    function findBestMoveVal(army) {
      var moves = self.pathfinder.getPossibleMoves(army.field, true, false);
      for (var i = 0; i < moves.length; i++) {
        moves[i].wait_for_support = false;
        moves[i].tmp_prof = finalProfitability(moves[i], army);
      }
      moves.sort(orderMoves);
      return moves[0];
    }
    var movableArmies = this.getMovableArmies(party, board);
    for (var armyIndex = 0; armyIndex < movableArmies.length; armyIndex++) {
      var bestMove = findBestMoveVal(movableArmies[armyIndex]);
      if (!bestMove) {
        console.warn("No move found for army: ", movableArmies[armyIndex]);
        continue;
      }
      movableArmies[armyIndex].move = bestMove;
      movableArmies[armyIndex].profitability = movableArmies[armyIndex].move.tmp_prof;
      if (movableArmies[armyIndex].field.capital == movableArmies[armyIndex].party && board.turns > 5) {
        movableArmies[armyIndex].profitability = movableArmies[armyIndex].profitability - 1000;
      }
    }
    return movableArmies;
  }

  calcNeighboursInfo(party, field) {
    var power = 0;
    var count = 0;
    var nonEnemyLand = 0;
    var waitForSupport = false;
    var furtherNeighbours = this.pathfinder.getFurtherNeighbours(field);
    // TODO: Should this be deleted?
    // field.push.field;
    for (var i = 0; i < furtherNeighbours.length; i++) {
      if (!furtherNeighbours[i]) {
        continue;
      }

      if (furtherNeighbours[i].army && furtherNeighbours[i].army.party == party) {
        power = power + (furtherNeighbours[i].army.count + furtherNeighbours[i].army.morale);
        count = count + 1;
      }
      if (furtherNeighbours[i].type == field.type && (furtherNeighbours[i].party == party || furtherNeighbours[i].party < 0)) {
        nonEnemyLand = nonEnemyLand + 1;
      }
      if (furtherNeighbours[i].wait_for_support) {
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

  calcEnemyNeighboursPower(party, field) {
    var furtherNeighbours = this.pathfinder.getFurtherNeighbours(field);
    var power = 0;
    // TODO: Should this be deleted?
    // field.push.field;
    for (var i = 0; i < furtherNeighbours.length; i++) {
      if (!furtherNeighbours[i]) {
        continue;
      }
      if (furtherNeighbours[i].army && furtherNeighbours[i].army.party != party) {
        power = power + (furtherNeighbours[i].army.count + furtherNeighbours[i].army.morale);
      }
    }
    return power;
  }

  supportArmy(party, army, field, board) {
    var self = this;
    function orderMoves(a, b) {
      var aValue = a.tmp_prof;
      var bValue = b.tmp_prof;
      if (aValue > bValue) {
        return -1;
      }
      if (aValue < bValue) {
        return 1;
      }
      return 0;
    }
    function findBestMoveVal(army) {
      var moves = self.pathfinder.getPossibleMoves(army.field, true, false);
      var supportMoves = [];

      for (var i = 0; i < moves.length; i++) {
        if (moves[i] != field && (!moves[i].army || moves[i].army.party < 0 || moves[i].army.party == party)) {
          moves[i].tmp_prof = -self.pathfinder.getDistance(moves[i], field);
          supportMoves.push(moves[i]);
        }
      }
      supportMoves.sort(orderMoves);
      return supportMoves[0];
    }
    var moveableArmies = this.getMovableArmies(party, board);
    var supportArmies = new Array();
    for (var armyIndex = 0; armyIndex < moveableArmies.length; armyIndex++) {
      if (moveableArmies[armyIndex] != army && moveableArmies[armyIndex].field.capital != party) {
        var bestMove = findBestMoveVal(moveableArmies[armyIndex]);
        if (!bestMove) {
          console.warn("No move found for army: ", moveableArmies[armyIndex]);
          continue;
        }
        moveableArmies[armyIndex].move = bestMove;
        moveableArmies[armyIndex].profitability = moveableArmies[armyIndex].move.tmp_prof;
        if (moveableArmies[armyIndex].move != field
          && (!moveableArmies[armyIndex].move.army
              || moveableArmies[armyIndex].move.army.party < 0
              || moveableArmies[armyIndex].move.army.party == party)
        ) {
          supportArmies.push(moveableArmies[armyIndex]);
        }
      }
    }
    return supportArmies;
  }

  getMovableArmies(party, board) {
    var movableArmies = [];
    for (var i = 0; i < board.hw_parties_armies[party].length; i++) {
      if (!board.hw_parties_armies[party][i].moved) {
        movableArmies.push(board.hw_parties_armies[party][i]);
      }
    }
    return movableArmies;
  }
}

export { Bot }
