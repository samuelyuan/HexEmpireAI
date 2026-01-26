import { Map } from './Map.js'
import { MapRender } from './MapRender.js'
import { Statistics } from './Statistics.js'
import { Replay } from './Replay.js'

class Game {
  constructor() {
    this.mapRender = new MapRender();
    this.images = this.prepareImages();
    this.turns = 0;
    this.statistics = new Statistics();
    this.replay = new Replay();
  }

  prepareImages() {
    var images = {};
    for (var i = 1; i <= 6; i++) {
      images["grassBg" + i] = { img: null , path: 'images/l_' + i + '.png', status: 'none' };
    }
    for (var i = 1; i <= 6; i++) {
      images["seaBg" + i] = { img: null , path: 'images/m_' + i + '.png', status: 'none' };
    }
    for (var i = 1; i <= 6; i++) {
      images["townBgGrass" + i] = { img: null , path: 'images/c_' + i + '.png', status: 'none' };
    }
    images["city"] = { img: null , path: 'images/city.png', status: 'none' };
    images["port"] = { img: null , path: 'images/port.png', status: 'none' };
    images["capital0"] = { img: null , path: 'images/capital_red.png', status: 'none' };
    images["capital1"] = { img: null , path: 'images/capital_violet.png', status: 'none' };
    images["capital2"] = { img: null , path: 'images/capital_blue.png', status: 'none' };
    images["capital3"] = { img: null , path: 'images/capital_green.png', status: 'none' };
    return images;
  }

  generateNewBoard() {
    return {
      hw_init: false, // false when game starts
      hw_xmax: 20,
      hw_ymax: 11,
      hw_fw: 50,
      hw_fh: 40,
      hw_land: 0,
      hw_top_field_depth: 0,
      hw_lands: [],
      hw_towns: [],
      hw_parties_capitals: [],
      hw_parties_count: 4,
      hw_parties_names: ["Redosia","Violetnam","Bluegaria","Greenland"],
      hw_parties_provinces_cp: [new Array(),new Array(),new Array(),new Array()],
      hw_parties_towns: [new Array(), new Array(), new Array(), new Array()],
      hw_parties_ports: [new Array(), new Array(), new Array(), new Array()],
      hw_parties_lands: [new Array(), new Array(), new Array(), new Array()],
      hw_parties_morale: [10, 10, 10, 10],
      hw_parties_armies: [new Array(), new Array(), new Array(), new Array()],
      hw_parties_status: [1, 1, 1, 1],
      hw_parties_total_count: [0, 0, 0, 0],
      hw_parties_total_power: [0, 0, 0, 0],
      hw_parties_control: ["computer","computer","computer","computer"],
      hw_parties_wait_for_support_field: [null,null,null,null],
      hw_parties_wait_for_support_count: [0,0,0,0],
      hw_parties_speech_given: [false,false,false,false],
      hw_pact_signed: false,
      hw_pact_just_broken: -1,
      hw_peace: -1,
      hw_lAID: 0,
      hw_aTL: 0,
      lh_area: 0,
      human: -1, // human player id
      human_condition: 1,
      turns: 0,
      wait: 0,
      turn_party: 0,
      difficulty: 5,
      duel: false,
      field: {},
      armies: {},
      renderOffset: { x: 10, y: 10 }, // Canvas translation offset for map rendering
    };
  }

  generateRandomMap() {
    const mapNumber = Math.floor(Math.random() * 999999);
    this.generateNewMap(mapNumber);
  }

  loadImage(ref) {
    return new Promise(function(resolve) {
      ref.img = new Image();
      ref.img.onload  = _ => { ref.status='Image loaded'; resolve(); };
      ref.img.onerror = _ => { ref.status='Failed to load image'; resolve(); };
      ref.img.src = ref.path;
    });
  }

  generateNewMap(mapNumber) {
    this.mapNumber = mapNumber;
    
    // Reset statistics and replay when generating a new map
    this.statistics.reset();
    this.replay.reset();

    this.board = this.generateNewBoard();
    this.map = new Map(this.mapNumber, this.images);

    var imagesToLoad = [];
    for (const [key, value] of Object.entries(this.images)) {
      imagesToLoad.push(this.loadImage(this.images[key]))
    }

    var self = this;
    Promise
      .all(imagesToLoad)
      .then(function(){
        self.map.generateMap(self.board, self.mapNumber);
        const ctx = document.getElementById('map').getContext('2d');
        ctx.drawImage(self.board.background_2, 0, 0);
        self.map.updateBoard(self.board);
        self.map.calcAIHelpers(self.board);
        self.initGame();

        let mapStatus = document.getElementById('mapStatus');
        mapStatus.innerHTML = "<b>Map</b> " + self.map.mapNumber + ", <b>Turn</b> " + (self.turns + 1);

        // Update the map number input field
        var mapNumberInput = document.getElementById('mapNumberInput');
        if (mapNumberInput) {
          mapNumberInput.value = self.map.mapNumber;
        }
        
        // Directly update status display
        var mapNumberStatus = document.getElementById('mapNumberStatus');
        var turnStatus = document.getElementById('turnStatus');
        if (mapNumberStatus) {
          mapNumberStatus.textContent = self.map.mapNumber;
        }
        if (turnStatus) {
          turnStatus.textContent = self.turns + 1;
        }

        var startBattleButton = document.getElementById('startBattleButton');
        startBattleButton.disabled = false;
      });
  }

  initGame() {
    var board = this.board;
    var map = this.map;
    for (var p = 0; p < board.hw_parties_count; p++) {
      map.unitsSpawn(p, board);
      map.updateBoard(board);
    }
    this.mapRender.drawMap(board, this.images);
    this.turns = 0;
    
    // Initialize replay system
    this.replay.initialize(this.mapRender, this.images);
    
    // Collect initial statistics
    this.statistics.collectStatistics(board, this.turns + 1);
    
    // Capture initial snapshot (Turn 0)
    this.replay.captureSnapshot(board, 0);
  }

  isVictory() {
    return this.map.isVictory(this.board);
  }

  runTurn() {
    var board = this.board;
    var map = this.map;
    board.turns = this.turns;

    let mapStatus = document.getElementById('mapStatus');
    mapStatus.innerHTML = "<b>Map</b> " + this.map.mapNumber + ", <b>Turn</b> " + (this.turns + 1);
    
    // Directly update status display
    var mapNumberStatus = document.getElementById('mapNumberStatus');
    var turnStatus = document.getElementById('turnStatus');
    if (mapNumberStatus) {
      mapNumberStatus.textContent = this.map.mapNumber;
    }
    if (turnStatus) {
      turnStatus.textContent = this.turns + 1;
    }

    let gamelogElement = document.getElementById('gamelog');
    const turnSection = `
      <div class="log-turn-section">
        <div class="log-turn-header">Turn ${this.turns + 1}</div>
        <div class="log-turn-content"></div>
      </div>
    `;
    gamelogElement.insertAdjacentHTML('beforeend', turnSection);
    
    // Get the current turn content container
    const turnSections = gamelogElement.querySelectorAll('.log-turn-section');
    const currentTurnContent = turnSections[turnSections.length - 1].querySelector('.log-turn-content');
    window.currentTurnLogContainer = currentTurnContent;

    for (var turnParty = 0; turnParty < board.hw_parties_count; turnParty++) {
      this.runComputerTurn(map, board, turnParty);
    }
    
    // Collect statistics after turn completes
    this.statistics.collectStatistics(board, this.turns + 1);
    
    // Capture snapshot for replay
    this.replay.captureSnapshot(board, this.turns + 1);
    
    this.turns++;
  }

  getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  runComputerTurn(map, board, turnParty) {
    board.turn_party = turnParty;
    board.duel = this.isDuel(board);

    const movePoints = map.getMovePoints(turnParty, board);

    map.cleanupTurn(board);
    map.updateBoard(board);

    if (board.hw_parties_control[turnParty] == "computer") {
      for (var i = 0; i < movePoints; i++) {
        map.makeMove(turnParty, board, false);

        map.updateArmies(board);
      }
      map.unitsSpawn(turnParty, board);
    }
    this.mapRender.drawMap(board, this.images);
  }

  isDuel(board) {
    var duel = false;
    var surviving = 0;
    for (var i = 0; i < 4; i++) {
      if (board.hw_parties_capitals[i].party == i) {
        surviving++;
      }
    }
    if (surviving < 3) {
      duel = true;
    }
    return duel;
  }
}

export { Game }
