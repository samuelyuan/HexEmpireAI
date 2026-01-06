import { Map } from './Map.js'
import { MapRender } from './MapRender.js'

class Game {
  constructor() {
    this.mapRender = new MapRender();
    this.images = this.prepareImages();
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
    const hw_xmax = 20;
    const hw_ymax = 11;
    const hw_fw = 50;
    const hw_fh = 40;
    
    // Width: (cols-1) * 3/4 width + full width
    const pixelWidth = Math.ceil((hw_xmax - 1) * (hw_fw * 0.75) + hw_fw);
    // Height: (rows-1) * height + height + half_height (for offset rows)
    const pixelHeight = (hw_ymax - 1) * hw_fh + hw_fh + (hw_fh / 2);

    return {
      hw_init: false, // false when game starts
      hw_xmax: hw_xmax,
      hw_ymax: hw_ymax,
      hw_fw: hw_fw,
      hw_fh: hw_fh,
      pixelWidth: pixelWidth,
      pixelHeight: pixelHeight,
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

    this.board = this.generateNewBoard();

    // Resize canvas to fit map exactly
    const canvas = document.getElementById('map');
    canvas.width = this.board.pixelWidth * 2;
    canvas.height = this.board.pixelHeight * 2;

    this.map = new Map(this.mapNumber, this.images);

    var imagesToLoad = [];
    for (const [key, value] of Object.entries(this.images)) {
      imagesToLoad.push(this.loadImage(this.images[key]))
    }

    var self = this;
    return Promise
      .all(imagesToLoad)
      .then(function(){
        self.map.generateMap(self.board, self.mapNumber);
        const ctx = document.getElementById('map').getContext('2d');
        // Initialize transform for the main canvas context
        ctx.setTransform(2, 0, 0, 2, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(self.board.background_2, 0, 0, self.board.pixelWidth, self.board.pixelHeight);
        self.map.updateBoard(self.board);
        self.map.calcAIHelpers(self.board);
        self.initGame();

        let mapStatus = document.getElementById('mapStatus');
        mapStatus.innerHTML = "<b>Map</b> " + self.map.mapNumber + ", <b>Turn</b> " + (self.turns + 1);

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
  }

  setHumanPlayer(partyId) {
    this.board.human = partyId;
    this.board.hw_parties_control[partyId] = "human";
  }

  startBattle() {
    this.turns = 0;
    this.board.turn_party = -1;
    this.nextTurn();
  }

  nextTurn() {
    this.board.turn_party++;
    if (this.board.turn_party >= 4) {
      this.board.turn_party = 0;
      this.turns++;
      let gamelogElement = document.getElementById('gamelog');
      gamelogElement.innerHTML += "Turn " + (this.turns + 1) + "<br/>";
      
      if (this.turns >= 150 || this.isVictory()) {
        document.getElementById('mapNumberInput').disabled = false;
        document.getElementById('changeMapButton').disabled = false;
        document.getElementById('randomMapButton').disabled = false;
        document.getElementById('startBattleButton').disabled = false;
        return;
      }
    }

    this.board.turns = this.turns;
    this.updateMapStatus();

    // Skip dead parties
    if (this.board.hw_parties_status[this.board.turn_party] == 0) {
      this.nextTurn();
      return;
    }

    this.map.cleanupTurn(this.board);
    this.map.updateBoard(this.board);

    if (this.board.hw_parties_control[this.board.turn_party] == "computer") {
      this.runComputerTurn(this.map, this.board, this.board.turn_party);
      setTimeout(() => this.nextTurn(), 200);
    } else {
      // Human turn
      this.humanMovesLeft = this.map.getMovePoints(this.board.turn_party, this.board);
      this.updateMapStatus();
      
      if (this.humanMovesLeft <= 0 || !this.checkHumanCanMove()) {
        this.endHumanTurn();
        return;
      }

      document.getElementById('endTurnButton').style.display = 'inline-block';
      document.getElementById('endTurnButton').onclick = () => {
         this.endHumanTurn();
      };
    }
  }

  checkHumanCanMove() {
    const movableArmies = this.map.bot.getMovableArmies(this.board.human, this.board);
    for (let i = 0; i < movableArmies.length; i++) {
      const army = movableArmies[i];
      const possibleMoves = this.map.pathfinder.getPossibleMoves(army.field, true, false);
      if (possibleMoves.length > 0) {
        return true;
      }
    }
    return false;
  }

  endHumanTurn() {
     document.getElementById('endTurnButton').style.display = 'none';
     this.map.unitsSpawn(this.board.human, this.board);
     this.selectedArmy = null;
     this.drawGame();
     this.nextTurn();
  }

  updateMapStatus() {
    let mapStatus = document.getElementById('mapStatus');
    let status = "<b>Map</b> " + this.map.mapNumber + ", <b>Turn</b> " + (this.turns + 1);
    status += " | Player: " + this.board.hw_parties_names[this.board.turn_party];
    if (this.board.turn_party == this.board.human) {
      status += " | Moves: " + this.humanMovesLeft;
    }
    mapStatus.innerHTML = status;
  }

  drawGame() {
    this.mapRender.drawMap(this.board, this.images);
    if (this.selectedArmy) {
      this.mapRender.drawSelection(this.selectedArmy.field);
      const possibleMoves = this.map.pathfinder.getPossibleMoves(this.selectedArmy.field, true, false);
      this.mapRender.drawValidMoves(possibleMoves, this.board);
    }
    if (this.hoveredField) {
      this.mapRender.drawHover(this.hoveredField);
    }
  }

  handleMouseMove(event) {
    const canvas = document.getElementById('map');
    const pos = this.getMousePos(canvas, event);
    const fieldXY = this.map.getFieldXYFromScreenXY(this.board, pos.x, pos.y);
    
    if (fieldXY.fieldX < 0 || fieldXY.fieldX >= this.board.hw_xmax || fieldXY.fieldY < 0 || fieldXY.fieldY >= this.board.hw_ymax) {
       this.hoveredField = null;
    } else {
       this.hoveredField = this.map.getField(fieldXY.fieldX, fieldXY.fieldY, this.board);
    }
    this.drawGame();
  }

  handleInput(event) {
    if (this.board.turn_party != this.board.human) return;
    if (this.humanMovesLeft <= 0) return;

    const canvas = document.getElementById('map');
    const pos = this.getMousePos(canvas, event);
    const fieldXY = this.map.getFieldXYFromScreenXY(this.board, pos.x, pos.y);
    
    if (fieldXY.fieldX < 0 || fieldXY.fieldX >= this.board.hw_xmax || fieldXY.fieldY < 0 || fieldXY.fieldY >= this.board.hw_ymax) return;

    const field = this.map.getField(fieldXY.fieldX, fieldXY.fieldY, this.board);
    if (!field) return;

    // Check if we can move first
    if (this.selectedArmy && this.selectedArmy.party == this.board.human) {
      const possibleMoves = this.map.pathfinder.getPossibleMoves(this.selectedArmy.field, true, false);
      
      if (possibleMoves.includes(field)) {
        const success = this.map.moveArmy(this.selectedArmy, field, this.board);
        if (success) {
          this.humanMovesLeft--;
          this.selectedArmy = null;
          this.updateMapStatus();
          this.map.updateArmies(this.board);
          this.drawGame();
          
          if (this.humanMovesLeft <= 0 || !this.checkHumanCanMove()) {
             this.endHumanTurn();
          }
          return;
        }
      }
    }

    // If not moving, check if we can select
    if (field.army && field.army.party == this.board.human) {
      if (field.army.moved) return;
      
      if (this.selectedArmy && this.selectedArmy == field.army) {
        this.selectedArmy = null;
        this.drawGame();
        return;
      }

      this.selectedArmy = field.army;
      this.drawGame();
      return;
    }
    
    // Deselect if clicking elsewhere
    if (this.selectedArmy) {
        this.selectedArmy = null;
        this.drawGame();
    }
  }

  isVictory() {
    return this.map.isVictory(this.board);
  }

  getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    // Map to logical size matching drawing coordinates
    return {
      x: (event.clientX - rect.left) * (this.board.pixelWidth / rect.width),
      y: (event.clientY - rect.top) * (this.board.pixelHeight / rect.height)
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
