/**
 * Replay system for turn-by-turn game replay
 * Uses the main canvas to show full map state at each turn
 */
class Replay {
  constructor() {
    this.snapshots = []; // Array of board state snapshots
    this.currentTurn = 0;
    this.isPlaying = false;
    this.playbackSpeed = 1000; // milliseconds per turn
    this.playbackInterval = null;
    this.mapRender = null;
    this.images = null;
    this.originalBoard = null; // Store original board structure
    this.isReplayMode = false;
  }

  /**
   * Initialize the replay system with map renderer and images
   */
  initialize(mapRender, images) {
    this.mapRender = mapRender;
    this.images = images;
  }

  /**
   * Capture a snapshot of the current board state
   * Stores complete field data needed for full map rendering
   */
  captureSnapshot(board, turnNumber) {
    const snapshot = {
      turn: turnNumber,
      fields: {}, // Complete field data
      boardData: {
        hw_xmax: board.hw_xmax,
        hw_ymax: board.hw_ymax,
        hw_parties_names: [...board.hw_parties_names],
        hw_parties_count: board.hw_parties_count,
        hw_parties_towns: board.hw_parties_towns.map(arr => arr.length),
        hw_parties_ports: board.hw_parties_ports.map(arr => arr.length),
        hw_parties_lands: board.hw_parties_lands.map(arr => arr.length),
        hw_parties_morale: [...board.hw_parties_morale],
        hw_parties_total_count: [...board.hw_parties_total_count]
      }
    };

    // Capture complete field states
    for (let x = 0; x < board.hw_xmax; x++) {
      for (let y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        const key = `${x}x${y}`;
        snapshot.fields[key] = {
          party: field.party,
          estate: field.estate || null,
          capital: field.capital >= 0 ? field.capital : null,
          town_name: field.town_name || null,
          army: field.army ? {
            party: field.army.party,
            count: field.army.count,
            morale: field.army.morale
          } : null,
          _x: field._x,
          _y: field._y,
          fx: field.fx,
          fy: field.fy
        };
      }
    }

    this.snapshots.push(snapshot);
  }

  /**
   * Restore board state from a snapshot
   */
  restoreBoardState(board, snapshot) {
    // Restore field states
    for (let x = 0; x < board.hw_xmax; x++) {
      for (let y = 0; y < board.hw_ymax; y++) {
        const key = `${x}x${y}`;
        const field = board.field["f" + x + "x" + y];
        const snapshotField = snapshot.fields[key];
        
        if (snapshotField) {
          field.party = snapshotField.party;
          field.estate = snapshotField.estate;
          field.capital = snapshotField.capital !== null ? snapshotField.capital : -1;
          field.town_name = snapshotField.town_name;
          
          // Restore army
          if (snapshotField.army) {
            if (!field.army) {
              field.army = {};
            }
            field.army.party = snapshotField.army.party;
            field.army.count = snapshotField.army.count;
            field.army.morale = snapshotField.army.morale;
          } else {
            field.army = null;
          }
        }
      }
    }
    
    // Update board arrays for territory borders
    board.hw_parties_towns = [[], [], [], []];
    board.hw_parties_ports = [[], [], [], []];
    board.hw_parties_lands = [[], [], [], []];
    
    for (let x = 0; x < board.hw_xmax; x++) {
      for (let y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        const party = field.party;
        if (party >= 0) {
          if (field.estate === "town") {
            board.hw_parties_towns[party].push(field);
          } else if (field.estate === "port") {
            board.hw_parties_ports[party].push(field);
          } else {
            board.hw_parties_lands[party].push(field);
          }
        }
      }
    }
  }

  /**
   * Render a specific turn on the main canvas
   */
  renderTurn(turnIndex, board) {
    if (!this.mapRender || !this.images || turnIndex < 0 || turnIndex >= this.snapshots.length) {
      return;
    }

    const snapshot = this.snapshots[turnIndex];
    
    // Restore board state from snapshot
    this.restoreBoardState(board, snapshot);
    
    // Render the map
    this.mapRender.drawMap(board, this.images);
    
    // Update controls
    this.updateControls();
  }

  /**
   * Go to a specific turn
   */
  goToTurn(turnIndex, board) {
    if (turnIndex < 0) turnIndex = 0;
    if (turnIndex >= this.snapshots.length) turnIndex = this.snapshots.length - 1;
    
    this.currentTurn = turnIndex;
    this.renderTurn(turnIndex, board);
  }

  /**
   * Play next turn
   */
  nextTurn(board) {
    if (this.currentTurn < this.snapshots.length - 1) {
      this.goToTurn(this.currentTurn + 1, board);
    } else {
      this.pause();
    }
  }

  /**
   * Play previous turn
   */
  previousTurn(board) {
    if (this.currentTurn > 0) {
      this.goToTurn(this.currentTurn - 1, board);
    }
  }

  /**
   * Start auto-playback
   * If at the last turn, starts from beginning (turn 0)
   * Otherwise starts from current turn
   */
  play(board) {
    if (this.isPlaying) return;
    
    // If at the last turn, restart from beginning
    if (this.currentTurn >= this.snapshots.length - 1) {
      this.currentTurn = 0;
      this.renderTurn(0, board);
    }
    
    this.isPlaying = true;
    this.isReplayMode = true;
    this.updateControls();
    
    this.playbackInterval = setInterval(() => {
      if (this.currentTurn < this.snapshots.length - 1) {
        this.nextTurn(board);
      } else {
        this.pause();
      }
    }, this.playbackSpeed);
  }

  /**
   * Pause auto-playback
   */
  pause() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    this.updateControls();
  }

  /**
   * Toggle play/pause
   */
  togglePlay(board) {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play(board);
    }
  }

  /**
   * Exit replay mode and return to current game state
   */
  exitReplay(board) {
    this.pause();
    this.isReplayMode = false;
    // Restore to latest turn
    if (this.snapshots.length > 0) {
      this.goToTurn(this.snapshots.length - 1, board);
    }
  }

  /**
   * Set playback speed (milliseconds per turn)
   */
  setSpeed(speed) {
    this.playbackSpeed = speed;
    if (this.isPlaying) {
      this.pause();
      // Note: need board reference to resume, so we'll need to store it
    }
  }

  /**
   * Enable or disable replay controls
   */
  setEnabled(enabled) {
    const playBtn = document.getElementById('replayPlayBtn');
    const prevBtn = document.getElementById('replayPrevBtn');
    const nextBtn = document.getElementById('replayNextBtn');
    const slider = document.getElementById('replaySlider');
    const replayControlsInline = document.getElementById('replayControlsInline');
    
    [playBtn, prevBtn, nextBtn, slider].forEach(btn => {
      if (btn) {
        btn.disabled = !enabled;
      }
    });
    
    // Show/hide replay controls
    if (replayControlsInline) {
      replayControlsInline.style.display = enabled ? 'block' : 'none';
    }
  }

  /**
   * Update control buttons state
   */
  updateControls() {
    const playBtn = document.getElementById('replayPlayBtn');
    const prevBtn = document.getElementById('replayPrevBtn');
    const nextBtn = document.getElementById('replayNextBtn');
    const turnDisplay = document.getElementById('replayTurnDisplay');
    const slider = document.getElementById('replaySlider');
    const exitBtn = document.getElementById('replayExitBtn');
    
    if (playBtn) {
      if (this.isPlaying) {
        playBtn.textContent = '⏸ Pause';
      } else {
        // Show "Restart" when at the end, otherwise "Play"
        const isAtEnd = this.currentTurn >= this.snapshots.length - 1;
        playBtn.textContent = isAtEnd ? '↻ Restart' : '▶ Play';
      }
    }
    
    if (prevBtn) {
      prevBtn.disabled = this.currentTurn === 0;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentTurn === this.snapshots.length - 1;
    }
    
    if (turnDisplay) {
      const snapshot = this.snapshots[this.currentTurn];
      turnDisplay.textContent = snapshot ? `Turn ${snapshot.turn} (${this.currentTurn + 1} / ${this.snapshots.length})` : '0 / 0';
    }
    
    if (slider) {
      slider.max = Math.max(0, this.snapshots.length - 1);
      slider.value = this.currentTurn;
    }
    
    if (exitBtn) {
      exitBtn.style.display = this.isReplayMode ? 'inline-block' : 'none';
    }
  }

  /**
   * Reset replay system
   */
  reset() {
    this.pause();
    this.snapshots = [];
    this.currentTurn = 0;
    this.isReplayMode = false;
    this.setEnabled(false); // Disable during gameplay
    this.updateControls();
  }
  
  /**
   * Enable replay after game ends
   */
  enable(board) {
    this.setEnabled(true);
    // Start at the final turn (end state) when enabling, so user sees the game result
    if (this.snapshots.length > 0 && board) {
      this.currentTurn = this.snapshots.length - 1;
      this.renderTurn(this.currentTurn, board);
    } else {
      this.updateControls();
    }
  }

  /**
   * Get current snapshot
   */
  getCurrentSnapshot() {
    if (this.currentTurn >= 0 && this.currentTurn < this.snapshots.length) {
      return this.snapshots[this.currentTurn];
    }
    return null;
  }
}

export { Replay }
