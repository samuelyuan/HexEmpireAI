import { Game } from './Game.js'

$(function(){
  // Initialize Materialize
  M.AutoInit();

  const canvas = document.getElementById('map');
  const dpr = window.devicePixelRatio || 1;
  
  // Logical game size (tighter fit to remove black bars)
  const logicalWidth = 760;
  const logicalHeight = 480;

  // Function to handle High DPI scaling and responsiveness
  function resizeCanvas() {
    const displayWidth = canvas.clientWidth;
    const displayHeight = displayWidth * (logicalHeight / logicalWidth);
    
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    const scale = (displayWidth * dpr) / logicalWidth;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  // Ensure CSS allows responsive scaling
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

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
       
       var factionNames = ["Redosia", "Violetnam", "Bluegaria", "Greenland"];
       var factionColors = ["red", "purple", "blue", "green"];
       
       var badge = document.getElementById('playerBadge');
       badge.style.display = 'inline-block';
       badge.className = "chip white-text " + factionColors[parseInt(country)];
       document.getElementById('playerFactionName').innerText = factionNames[parseInt(country)];

       game.startBattle();
    };

    if (game.isVictory()) {
       game.generateNewMap(game.mapNumber).then(start);
    } else {
       start();
    }
  });

  // Re-draw on resize to prevent blank screen
  window.addEventListener('resize', () => {
      game.drawGame();
  });

  canvas.addEventListener('mousedown', function(e) {
      game.handleInput(e);
  });
  canvas.addEventListener('mousemove', function(e) {
      game.handleMouseMove(e);
  });

});
