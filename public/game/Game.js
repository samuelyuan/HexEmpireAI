import { Config } from './Config.js';
import { Utils, Random } from './Utils.js';
import { GameState } from './GameState.js';
import { MapRender } from './MapRender.js';
import { MapGenerator } from './MapGenerator.js';
import { GameLogic } from './GameLogic.js';
import { Pathfinder } from './Pathfinder.js';
import { Bot } from './Bot.js';

export class Game {
  constructor() {
    this.mapRender = new MapRender();
    this.pathfinder = new Pathfinder();
    this.bot = new Bot(this.pathfinder);
    this.images = this.prepareImages();
    this.state = null;
    this.mapNumber = -1;
    this.humanMovesLeft = 0;
    this.selectedArmy = null;
    this.hoveredField = null;
    this.cursorPos = { x: 0, y: 0 };
    
    // Animation Loop
    this.lastTime = 0;
    this.loop = this.loop.bind(this);
  }

  loop(timestamp) {
    if (this.state) {
      if (this.logic) {
         this.logic.tick();
      }
      this.drawGame();
    }
    requestAnimationFrame(this.loop);
  }

  prepareImages() {
    const images = {};
    const cfg = Config.IMAGES;
    
    // Backgrounds
    for (let i = 1; i <= cfg.GRASS_BG.count; i++) {
      images["grassBg" + i] = { img: null, path: Utils.getImagePath(cfg.GRASS_BG.prefix + i + '.png'), status: 'none' };
    }
    for (let i = 1; i <= cfg.SEA_BG.count; i++) {
      images["seaBg" + i] = { img: null, path: Utils.getImagePath(cfg.SEA_BG.prefix + i + '.png'), status: 'none' };
    }
    for (let i = 1; i <= cfg.TOWN_BG_GRASS.count; i++) {
       // Note: original code used c_1..c_6. Config has prefix c_
       images["townBgGrass" + i] = { img: null, path: Utils.getImagePath(cfg.TOWN_BG_GRASS.prefix + i + '.png'), status: 'none' };
    }
    
    // Estates
    images["city"] = { img: null, path: Utils.getImagePath(cfg.CITY), status: 'none' };
    images["port"] = { img: null, path: Utils.getImagePath(cfg.PORT), status: 'none' };
    
    // Capitals
    cfg.CAPITALS.forEach((path, idx) => {
        images["capital" + idx] = { img: null, path: Utils.getImagePath(path), status: 'none' };
    });
    
    // Units
    for (const [key, path] of Object.entries(cfg.UNITS)) {
        images[key] = { img: null, path: Utils.getImagePath(path), status: 'none' };
    }

    return images;
  }

  loadImage(ref) {
    return new Promise((resolve) => {
      ref.img = new Image();
      ref.img.onload  = () => { ref.status='Image loaded'; resolve(); };
      ref.img.onerror = () => { ref.status='Failed to load image'; resolve(); };
      ref.img.src = ref.path;
    });
  }

  generateRandomMap() {
    const mapNumber = Math.floor(Math.random() * 999999);
    this.generateNewMap(mapNumber);
  }

  generateNewMap(mapNumber) {
    this.mapNumber = mapNumber;
    
    // Resize canvas
    const canvas = document.getElementById('map');
    // We calculate size from Config directly, but better to wait for State initialization or use constants?
    // GameState constructor uses constants, so we can calculate here too.
    const width = Config.MAP.WIDTH;
    const height = Config.MAP.HEIGHT;
    const hexWidth = Config.MAP.HEX_WIDTH;
    const hexHeight = Config.MAP.HEX_HEIGHT;
    const pixelWidth = Math.ceil((width - 1) * (hexWidth * 0.75) + hexWidth);
    const pixelHeight = (height - 1) * hexHeight + hexHeight + (hexHeight / 2);

    canvas.width = pixelWidth * 2;
    canvas.height = pixelHeight * 2;

    // Load Images
    const imagesToLoad = [];
    for (const key in this.images) {
      imagesToLoad.push(this.loadImage(this.images[key]));
    }

    return Promise.all(imagesToLoad).then(() => {
        this.startNewGame(mapNumber);
        requestAnimationFrame(this.loop);
    });
  }

  startNewGame(mapNumber) {
     this.state = new GameState();
     const random = new Random(mapNumber);
     
     // Generators & Logic
     this.mapGenerator = new MapGenerator(this.state, random, this.pathfinder);
     this.logic = new GameLogic(this.state, this.pathfinder, this.bot);

     // Generate Logic Map
     this.mapGenerator.generate();
     
     // Generate Visual Backgrounds
     this.mapRender.renderStaticBackground(this.state, this.images, random);
     this.mapRender.renderSeaBackground(this.state, this.images, random);

     // Calculate AI Helpers (Profitability)
     this.calcAIHelpers();
     
     // Spawn Units
     this.initUnits();

     // UI Updates
     const mapStatus = document.getElementById('mapStatus');
     if (mapStatus) {
         mapStatus.innerHTML = `<b>Map</b> ${mapNumber}, <b>Turn</b> ${this.state.turn + 1}`;
     }
     
     const startBtn = document.getElementById('startBattleButton');
     if (startBtn) startBtn.disabled = false;
     
     const topBarStartBtn = document.getElementById('topBarStartBattle');
     if (topBarStartBtn) topBarStartBtn.disabled = false;

     // Initialize top bar
     this.initializeTopBar();

     // Initial Draw
     this.mapRender.drawMap(this.state, this.images);
  }
  
  calcAIHelpers() {
      // Logic from Map.js calcAIHelpers
      // Pre-calculate distance/profitability for AI
      // This modifies field.profitability
      for (let p = 0; p < this.state.parties.length; p++) {
          const capital = this.state.parties[p].capital;
          for (let x = 0; x < this.state.width; x++) {
              for (let y = 0; y < this.state.height; y++) {
                  const field = this.state.getField(x, y);
                  // Only calc if land or port?
                  // Original: findPath from field to capital
                  const path = this.pathfinder.findPath(field, capital, [], true);
                  if (!path) {
                      continue;
                  }
                  field.profitability[p] = -path.length;
                  
                  // Neighbours info
                  const neighbours = this.pathfinder.getFurtherNeighbours(field);
                  // Original added field itself too? "neighbours.push(field)"
                  const checkList = [...neighbours, field];
                  
                  for (const n of checkList) {
                      if (!n) continue;
                      if (n.capital === p) field.n_capital[p] = true;
                      if (n.estate === "town") field.n_town = true;
                  }
              }
          }
      }
  }

  initUnits() {
      for (const party of this.state.parties) {
          this.logic.unitsSpawn(party.id);
          this.logic.updateBoard(); // Initial update
      }
  }

  setHumanPlayer(partyId) {
    this.state.humanPlayerId = partyId;
    this.state.parties[partyId].control = "human";
  }

  startBattle() {
    this.state.turn = 0;
    this.state.turnParty = -1;
    this.nextTurn();
  }

  nextTurn() {
    this.state.turnParty++;
    if (this.state.turnParty >= this.state.parties.length) {
      this.state.turnParty = 0;
      this.state.turn++;
      this.logic.updateGameLog("Turn " + (this.state.turn + 1));

      if (this.state.turn >= 150) {
         this.enableMenuControls();
         return;
      }
    }
    
    this.updateMapStatus();
    this.updateTopBar();

    // Check game end conditions for human player
    if (this.state.humanPlayerId >= 0 && !this.state.isSpectating) {
      const humanParty = this.state.parties[this.state.humanPlayerId];
      
      // Check defeat
      if (humanParty.status === 0) {
        this.showGameEndModal('defeat');
        return;
      }
      
      // Check victory
      if (humanParty.provincesCp && humanParty.provincesCp.length === this.state.parties.length - 1) {
        this.showGameEndModal('victory');
        return;
      }
    }

    // Check Global Game End (Spectator Mode or AI vs AI)
    if (this.state.isSpectating) {
        let activeParties = [];
        for(const p of this.state.parties) {
            if (p.status > 0) activeParties.push(p);
        }
        
        if (activeParties.length === 1) {
            this.showGameEndModal('spectator_victory', activeParties[0].name);
            return;
        }
    }

    // Skip eliminated parties
    if (this.state.parties[this.state.turnParty].status === 0) {
        this.nextTurn();
        return;
    }

    this.logic.cleanupTurn();
    this.logic.updateBoard();

    const currentParty = this.state.parties[this.state.turnParty];
    if (currentParty.control === "computer") {
        this.runComputerTurn(currentParty.id);
    } else {
        // Human Turn
        this.humanMovesLeft = this.getMovePoints(currentParty.id);
        this.updateMapStatus();
        this.updateTopBar();

        if (this.humanMovesLeft <= 0 || !this.checkHumanCanMove()) {
            this.endHumanTurn();
            return;
        }
        
        const endBtn = document.getElementById('endTurnButton');
        if (endBtn) {
            endBtn.style.display = 'inline-block';
            endBtn.onclick = () => this.endHumanTurn();
        }
        
        const topBarEndBtn = document.getElementById('topBarEndTurn');
        if (topBarEndBtn) {
            topBarEndBtn.style.display = 'inline-block';
            topBarEndBtn.onclick = () => this.endHumanTurn();
        }
    }
  }

  getMovePoints(partyId) {
     let points = 5;
     const movableCount = this.bot.getMovableArmies(partyId, this.state).length;
     if (points > movableCount) points = movableCount;
     return points;
  }

  checkHumanCanMove() {
      const movableArmies = this.bot.getMovableArmies(this.state.humanPlayerId, this.state);
      for (const army of movableArmies) {
          const moves = this.pathfinder.getPossibleMoves(army.field, true, false);
          if (moves.length > 0) return true;
      }
      return false;
  }

  endHumanTurn() {
      const endBtn = document.getElementById('endTurnButton');
      if (endBtn) endBtn.style.display = 'none';
      
      const topBarEndBtn = document.getElementById('topBarEndTurn');
      if (topBarEndBtn) topBarEndBtn.style.display = 'none';
      
      this.logic.unitsSpawn(this.state.humanPlayerId);
      this.selectedArmy = null;
      this.drawGame();
      this.nextTurn();
  }

  runComputerTurn(partyId) {
     // Duel logic check
     let surviving = 0;
     for (const p of this.state.parties) {
         if (p.capital.party === p.id) surviving++;
     }
     this.state.duel = (surviving < 3);

     const movePoints = this.getMovePoints(partyId);
     this.logic.cleanupTurn();
     this.logic.updateBoard();

     let moveIndex = 0;
     const executeMove = () => {
        if (moveIndex >= movePoints) {
            this.logic.unitsSpawn(partyId);
            this.drawGame();
            setTimeout(() => this.nextTurn(), 200);
            return;
        }

        this.logic.makeMove(partyId);
        this.logic.updateBoard();

        let animating = false;
        if (typeof gsap !== 'undefined') {
            for (const key in this.state.armies) {
                const army = this.state.armies[key];
                if (army.visual && gsap.isTweening(army.visual)) {
                    animating = true;
                    break;
                }
            }
        }

        moveIndex++;
        if (animating) {
            setTimeout(executeMove, Config.ANIMATION.MOVE_WAIT); // Check again slightly after expected duration
        } else {
            setTimeout(executeMove, Config.ANIMATION.MOVE_WAIT_MIN); // Minimal delay
        }
     };

     executeMove();
  }

  updateMapStatus() {
    let mapStatus = document.getElementById('mapStatus');
    if (!mapStatus) return;
    
    let status = `<b>Map</b> ${this.mapNumber}, <b>Turn</b> ${this.state.turn + 1}`;
    status += ` | Player: ${this.state.parties[this.state.turnParty].name}`;
    
    if (this.state.turnParty === this.state.humanPlayerId) {
      status += ` | Moves: ${this.humanMovesLeft}`;
    }
    mapStatus.innerHTML = status;
  }

  drawGame() {
    this.mapRender.drawMap(this.state, this.images, this.cursorPos);
    if (this.selectedArmy) {
      this.mapRender.drawSelection(this.selectedArmy.field);
      const possibleMoves = this.pathfinder.getPossibleMoves(this.selectedArmy.field, true, false);
      this.mapRender.drawValidMoves(possibleMoves, this.state);
    }
    if (this.hoveredField) {
      this.mapRender.drawHover(this.hoveredField);
    }
  }

  handleMouseMove(event) {
    const canvas = document.getElementById('map');
    const pos = this.getMousePos(canvas, event);
    this.cursorPos = pos;
    const fieldXY = this.getFieldXYFromScreenXY(pos.x, pos.y);
    
    if (fieldXY) {
       this.hoveredField = this.state.getField(fieldXY.fx, fieldXY.fy);
    } else {
       this.hoveredField = null;
    }
    this.drawGame();
  }

  handleInput(event) {
      if (this.state.turnParty !== this.state.humanPlayerId) return;
      if (this.humanMovesLeft <= 0) return;

      const canvas = document.getElementById('map');
      const pos = this.getMousePos(canvas, event);
      const fieldXY = this.getFieldXYFromScreenXY(pos.x, pos.y);
      if (!fieldXY) return;

      const field = this.state.getField(fieldXY.fx, fieldXY.fy);
      if (!field) return;

      // 1. Move Selection
      if (this.selectedArmy && this.selectedArmy.party === this.state.humanPlayerId) {
          const possibleMoves = this.pathfinder.getPossibleMoves(this.selectedArmy.field, true, false);
          if (possibleMoves.includes(field)) {
              // Execute Move
              const success = this.logic.moveArmy(this.selectedArmy, field);
              
              if (success) {
                  this.humanMovesLeft--;
                  this.selectedArmy = null;
                  this.updateMapStatus();
                  this.updateTopBar();
                  this.logic.updateBoard();
                  this.drawGame();
                  
                  // Check for immediate victory after move
                  if (this.state.humanPlayerId >= 0) {
                    const humanParty = this.state.parties[this.state.humanPlayerId];
                    if (humanParty.provincesCp && humanParty.provincesCp.length === this.state.parties.length - 1) {
                      // Hide end turn button before showing victory
                      const topBarEndTurn = document.getElementById('topBarEndTurn');
                      if (topBarEndTurn) topBarEndTurn.style.display = 'none';
                      
                      this.showGameEndModal('victory');
                      return;
                    }
                  }
                  
                  if (this.humanMovesLeft <= 0 || !this.checkHumanCanMove()) {
                      this.endHumanTurn();
                  }
                  return;
              }
          }
      }

      // 2. Select Army
      if (field.army && field.army.party === this.state.humanPlayerId) {
          if (field.army.moved) return;

          if (this.selectedArmy === field.army) {
              this.selectedArmy = null;
          } else {
              this.selectedArmy = field.army;
          }
          this.drawGame();
          return;
      }

      // 3. Deselect
      if (this.selectedArmy) {
          this.selectedArmy = null;
          this.drawGame();
      }
  }


  enableMenuControls() {
      const ids = ['mapNumberInput', 'changeMapButton', 'randomMapButton'];
      ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.disabled = false;
      });
      
      // Show the Start Battle button again
      const topBarStartBattle = document.getElementById('topBarStartBattle');
      if (topBarStartBattle) {
          topBarStartBattle.style.display = 'inline-block';
          topBarStartBattle.disabled = false;
      }
  }

  getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (this.state.pixelWidth / rect.width),
      y: (event.clientY - rect.top) * (this.state.pixelHeight / rect.height)
    };
  }

  getFieldXYFromScreenXY(screenX, screenY) {
    // Ported from Map.js
    const board = this.state; // Use aliases from state
    const hw_fw = board.hexWidth;
    const hw_fh = board.hexHeight;
    const hw_xmax = board.width;
    const hw_ymax = board.height;

    const approxX = Math.floor((screenX - (hw_fw / 2)) / (hw_fw / 4 * 3));
    const approxY = Math.floor((screenY - (hw_fh / 2)) / hw_fh);

    let bestDist = Infinity;
    let bestField = null;

    for (let dx = -1; dx <= 2; dx++) {
      for (let dy = -1; dy <= 2; dy++) {
         const fx = approxX + dx;
         const fy = approxY + dy;
         
         if (fx < 0 || fx >= hw_xmax || fy < 0 || fy >= hw_ymax) continue;

         const centerX = fx * (hw_fw * 0.75) + hw_fw / 2;
         let centerY;
         if (fx % 2 === 0) {
           centerY = fy * hw_fh + hw_fh / 2;
         } else {
           centerY = fy * hw_fh + hw_fh;
         }

         const dist = Math.pow(screenX - centerX, 2) + Math.pow(screenY - centerY, 2);
         if (dist < bestDist) {
           bestDist = dist;
           bestField = { fx, fy };
         }
      }
    }
    return bestField;
  }

  initializeTopBar() {
    const capitalsSection = document.getElementById('capitalsSection');
    if (!capitalsSection) return;

    // Clear existing content
    capitalsSection.innerHTML = '';

    // Create capital items for each party
    for (let i = 0; i < this.state.parties.length; i++) {
      const party = this.state.parties[i];
      const capitalItem = document.createElement('div');
      capitalItem.className = 'capital-item';
      capitalItem.id = `capital-item-${i}`;

      const capitalIcon = document.createElement('img');
      capitalIcon.className = 'capital-icon';
      capitalIcon.src = `/images/${Config.IMAGES.CAPITALS[i]}`;
      capitalIcon.alt = party.name;

      const capitalInfo = document.createElement('div');
      capitalInfo.className = 'capital-info';

      const capitalName = document.createElement('div');
      capitalName.className = 'capital-name';
      capitalName.textContent = party.name;

      const capitalStats = document.createElement('div');
      capitalStats.className = 'capital-stats';
      capitalStats.id = `capital-stats-${i}`;
      capitalStats.textContent = 'Armies: 0 | Power: 0';

      capitalInfo.appendChild(capitalName);
      capitalInfo.appendChild(capitalStats);
      capitalItem.appendChild(capitalIcon);
      capitalItem.appendChild(capitalInfo);
      capitalsSection.appendChild(capitalItem);
    }

    // Show the top bar
    const topBar = document.getElementById('gameTopBar');
    if (topBar) topBar.classList.add('active');

    // Update initial stats
    this.updateTopBar();
  }

  updateTopBar() {
    if (!this.state) return;

    // Update turn indicator
    const turnIndicator = document.getElementById('turnIndicator');
    if (turnIndicator) {
      turnIndicator.textContent = `Turn ${this.state.turn + 1}`;
    }

    // Update each capital item
    for (let i = 0; i < this.state.parties.length; i++) {
      const party = this.state.parties[i];
      const capitalItem = document.getElementById(`capital-item-${i}`);
      const capitalStats = document.getElementById(`capital-stats-${i}`);

      if (!capitalItem || !capitalStats) continue;

      // Update stats
      const armyCount = party.armies.length;
      const totalPower = party.totalPower || 0;
      capitalStats.textContent = `Armies: ${armyCount} | Power: ${totalPower}`;

      // Update active state
      if (this.state.turnParty === i && party.status === 1) {
        capitalItem.classList.add('active');
      } else {
        capitalItem.classList.remove('active');
      }

      // Update eliminated state
      if (party.status === 0) {
        capitalItem.classList.add('eliminated');
      } else {
        capitalItem.classList.remove('eliminated');
      }
    }

    // Update button visibility
    const topBarEndTurn = document.getElementById('topBarEndTurn');
    const endTurnButton = document.getElementById('endTurnButton');
    
    if (this.state.turnParty === this.state.humanPlayerId && this.state.humanPlayerId >= 0) {
      if (topBarEndTurn) topBarEndTurn.style.display = 'inline-block';
    } else {
      if (topBarEndTurn) topBarEndTurn.style.display = 'none';
    }
  }

  showGameEndModal(type, winnerName) {
    const modal = document.getElementById('gameEndModal');
    if (!modal) return;

    const title = document.getElementById('gameEndTitle');
    const message = document.getElementById('gameEndMessage');
    const buttonsContainer = document.getElementById('gameEndButtons');

    if (type === 'victory') {
      title.textContent = 'Victory!';
      title.style.color = '#4CAF50';
      message.textContent = 'You have conquered all enemy capitals and achieved total domination!';
      
      buttonsContainer.innerHTML = `
        <button type="button" class="game-control-btn start-battle" id="playAgainButton" style="width: 100%; padding: 15px;">
          <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">replay</i>
          Play Again
        </button>
        <button type="button" class="game-control-btn" id="newMapButton" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);">
          <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">map</i>
          New Map
        </button>
      `;
    } else if (type === 'spectator_victory') {
      title.textContent = 'Game Over';
      title.style.color = '#ffd700';
      message.textContent = `${winnerName} has conquered the world!`;
      
      buttonsContainer.innerHTML = `
        <button type="button" class="game-control-btn start-battle" id="playAgainButton" style="width: 100%; padding: 15px;">
          <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">replay</i>
          Restart Map
        </button>
        <button type="button" class="game-control-btn" id="newMapButton" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);">
          <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">map</i>
          New Map
        </button>
      `;
    } else {
      title.textContent = 'Your Capital Has Fallen!';
      title.style.color = '#ff5252';
      message.textContent = 'Your empire has been defeated. What would you like to do?';
      
      buttonsContainer.innerHTML = `
        <button type="button" class="game-control-btn start-battle" id="restartSameMapButton" style="width: 100%; padding: 15px;">
          <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">refresh</i>
          Restart with Same Map
        </button>
        <button type="button" class="game-control-btn" id="spectateButton" style="width: 100%; padding: 15px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);">
          <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">visibility</i>
          Watch AI Battle Continue
        </button>
      `;
    }

    const modalInstance = M.Modal.init(modal, {
      dismissible: false
    });
    modalInstance.open();

    // Wire up button handlers
    this.setupGameEndButtons(type);
  }

  setupGameEndButtons(type) {
    if (type === 'victory' || type === 'spectator_victory') {
      const playAgainButton = document.getElementById('playAgainButton');
      if (playAgainButton) {
        playAgainButton.onclick = () => this.restartSameMap();
      }

      const newMapButton = document.getElementById('newMapButton');
      if (newMapButton) {
        newMapButton.onclick = () => this.startNewRandomMap();
      }
    } else {
      const restartButton = document.getElementById('restartSameMapButton');
      if (restartButton) {
        restartButton.onclick = () => this.restartSameMap();
      }

      const spectateButton = document.getElementById('spectateButton');
      if (spectateButton) {
        spectateButton.onclick = () => this.enterSpectatorMode();
      }
    }
  }

  restartSameMap() {
    this.closeGameEndModal();
    if (this.state) {
      this.state.isSpectating = false;
    }
    
    // Re-enable menu controls
    this.enableMenuControls();
    
    // Regenerate the same map
    this.generateNewMap(this.mapNumber);
  }

  startNewRandomMap() {
    this.closeGameEndModal();
    if (this.state) {
      this.state.isSpectating = false;
    }
    
    // Re-enable menu controls
    this.enableMenuControls();
    
    // Generate new map
    this.generateRandomMap();
  }

  enterSpectatorMode() {
    this.closeGameEndModal();
    
    if (this.state) {
      this.state.isSpectating = true;
      
      if (this.state.humanPlayerId >= 0) {
        this.state.parties[this.state.humanPlayerId].control = "computer";
      }

      const topBarEndTurn = document.getElementById('topBarEndTurn');
      if (topBarEndTurn) topBarEndTurn.style.display = 'none';

      this.selectedArmy = null;
      this.drawGame();
      this.nextTurn();
    }
  }

  closeGameEndModal() {
    const modal = document.getElementById('gameEndModal');
    if (modal) {
      const modalInstance = M.Modal.getInstance(modal);
      if (modalInstance) modalInstance.close();
    }
  }
}
