import { Game } from './Game.js'

$(function(){
  const game = new Game();
  game.generateRandomMap();

  var mapNumberInput = document.getElementById('mapNumberInput');
  var changeMapButton = document.getElementById('changeMapButton');
  changeMapButton.onclick = function() {
    var mapNumber = mapNumberInput.value;
    // remove all non-digits
    mapNumber = mapNumber.replace(/\D/g,'');
    if (mapNumber.length > 6) {
      mapNumber = mapNumber.substring(0, 6);
    }
    if (mapNumber == "") {
      mapNumber = Math.floor(Math.random() * 999999);
    } else {
      // convert to integer, since map number is expected as an integer
      mapNumber = parseInt(mapNumber, 10);
    }

    game.generateNewMap(mapNumber);
  };

  var randomMapButton = document.getElementById('randomMapButton');
  randomMapButton.onclick = function() {
    game.generateRandomMap();
  };

  var startBattleButton = document.getElementById('startBattleButton');
  startBattleButton.disabled = true; // Disable until map is loaded
  startBattleButton.onclick = function() {
    if (game.isVictory()) {
      // Reset map
      game.generateNewMap(game.mapNumber);
    }

    mapNumberInput.value = game.mapNumber;
    mapNumberInput.disabled = true;
    changeMapButton.disabled = true;
    randomMapButton.disabled = true;
    startBattleButton.disabled = true;

    const maxTurnLimit = 150;
    var intervalId = setInterval(function(){
      game.runTurn();

      if (game.isVictory() || game.turns >= maxTurnLimit) {
        mapNumberInput.disabled = false;
        changeMapButton.disabled = false;
        randomMapButton.disabled = false;
        startBattleButton.disabled = false;

        clearInterval(intervalId);
      }
    }, 1000);
  };

});
