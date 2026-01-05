import { Game } from './Game.js'

$(function(){
  // Initialize Materialize
  M.AutoInit();

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
    var elem = document.getElementById('countrySelectModal');
    var instance = M.Modal.getInstance(elem);
    instance.open();
  };

  $('.country-select').click(function() {
    var country = $(this).data('country');
    var elem = document.getElementById('countrySelectModal');
    var instance = M.Modal.getInstance(elem);
    instance.close();
    
    let start = () => {
       mapNumberInput.value = game.mapNumber;
       mapNumberInput.disabled = true;
       changeMapButton.disabled = true;
       randomMapButton.disabled = true;
       startBattleButton.disabled = true;

       game.setHumanPlayer(parseInt(country));
       game.startBattle();
    };

    if (game.isVictory()) {
       game.generateNewMap(game.mapNumber).then(start);
    } else {
       start();
    }
  });

  var canvas = document.getElementById('map');
  canvas.addEventListener('mousedown', function(e) {
      game.handleInput(e);
  });
  canvas.addEventListener('mousemove', function(e) {
      game.handleMouseMove(e);
  });

});
