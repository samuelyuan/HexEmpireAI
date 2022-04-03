import { Map } from './Map.js'

class Game {
  constructor() {
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
    };
  }

  generateRandomMap() {
    const mapNumber = Math.floor(Math.random() * 999999);
    this.generateNewMap(mapNumber);
  }

  generateNewMap(mapNumber) {
    this.mapNumber = mapNumber;

    this.board = this.generateNewBoard();
    this.map = new Map(this.mapNumber);
    this.map.generateMap(this.board, this.mapNumber);
    this.map.updateBoard(this.board);
    this.map.calcAIHelpers(this.board);
    this.initGame();

    let mapStatus = document.getElementById('mapStatus');
    mapStatus.innerHTML = "<b>Map</b> " + this.map.mapNumber + ", <b>Turn</b> " + (this.turns + 1);
  }

  initGame() {
    var board = this.board;
    var map = this.map;
    for (var p = 0; p < board.hw_parties_count; p++) {
      map.unitsSpawn(p, board);
      map.updateBoard(board);
    }
    map.drawMap(board);
    this.turns = 0;
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

    let gamelogElement = document.getElementById('gamelog');
    gamelogElement.innerHTML += "Turn " + (this.turns + 1) + "<br/>";

    for (var turnParty = 0; turnParty < board.hw_parties_count; turnParty++) {
      this.runComputerTurn(map, board, turnParty);
    }
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

    var movePoints = 5;
    var movableArmyCount = map.getMovableArmies(turnParty, board).length;
    if (movePoints > movableArmyCount) {
      movePoints = movableArmyCount;
    }

    map.cleanupTurn(board);
    map.updateBoard(board);

    if (board.hw_parties_control[turnParty] == "computer") {
      for (var i = 0; i < movePoints; i++) {
        map.makeMove(turnParty, board, false);

        map.updateArmies(board);
      }
      map.unitsSpawn(turnParty, board);
    }
    map.drawMap(board);
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
