/**
 * UI initialization and event handlers
 * Handles game log, filters, statistics tabs, and status updates
 */
export function initializeUI() {
  // Auto-scroll game log to bottom
  const gamelogElement = document.getElementById('gamelog');
  if (gamelogElement) {
    const observer = new MutationObserver(function() {
      gamelogElement.scrollTop = gamelogElement.scrollHeight;
    });
    observer.observe(gamelogElement, { childList: true, subtree: true });
  }

  // Update status display from the hidden mapStatus element
  const mapStatusElement = document.getElementById('mapStatus');
  const mapNumberStatus = document.getElementById('mapNumberStatus');
  const turnStatus = document.getElementById('turnStatus');
  
  function updateStatusDisplay() {
    if (!mapStatusElement || !mapNumberStatus || !turnStatus) return;
    
    // Find Map and Turn label elements using DOM queries
    const boldElements = mapStatusElement.querySelectorAll('b');
    const mapLabel = boldElements[0];
    const turnLabel = boldElements[1];
    
    if (mapLabel) {
      // Get the text node after <b>Map</b>
      const textNode = mapLabel.nextSibling;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const mapText = textNode.textContent.trim();
        // Extract number (remove comma if present)
        const mapNumber = mapText.split(',')[0].trim();
        if (mapNumber && !isNaN(mapNumber)) {
          mapNumberStatus.textContent = mapNumber;
        }
      }
    }
    
    if (turnLabel) {
      // Get the text node after <b>Turn</b>
      const textNode = turnLabel.nextSibling;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const turnNumber = textNode.textContent.trim();
        if (turnNumber && !isNaN(turnNumber)) {
          turnStatus.textContent = turnNumber;
        }
      }
    }
  }
  
  if (mapStatusElement && mapNumberStatus && turnStatus) {
    // Update immediately in case mapStatus already has content
    updateStatusDisplay();
    
    const statusObserver = new MutationObserver(function() {
      updateStatusDisplay();
    });
    statusObserver.observe(mapStatusElement, { 
      childList: true, 
      subtree: true, 
      characterData: true,
      attributes: true
    });
  }

  // Log filtering and search
  const logSearch = document.getElementById('logSearch');
  const filterButtons = document.querySelectorAll('.log-filter-btn');
  let currentFilter = 'all';
  let searchTerm = '';

  // Apply filters and search
  function applyFilters() {
    if (!gamelogElement) return;
    
    // Determine if we should show turn numbers (when filters/search are active)
    const shouldShowTurnNumbers = currentFilter !== 'all' || searchTerm.length > 0;
    
    // Find all log entries, including those nested in turn sections
    const entries = gamelogElement.querySelectorAll('.log-entry');
    entries.forEach(entry => {
      // Extract the log type from classList (more reliable than regex on className string)
      let entryType = '';
      for (let className of entry.classList) {
        if (className.startsWith('log-') && className !== 'log-entry') {
          entryType = className.substring(4); // Remove 'log-' prefix
          break;
        }
      }
      
      const entryText = entry.textContent.toLowerCase();
      const turnNumber = entry.dataset.turn || '';
      const turnText = turnNumber ? `turn ${turnNumber}` : '';
      
      const matchesFilter = currentFilter === 'all' || entryType === currentFilter;
      const matchesSearch = !searchTerm || entryText.includes(searchTerm) || turnText.includes(searchTerm);
      
      if (matchesFilter && matchesSearch) {
        entry.classList.remove('hidden');
      } else {
        entry.classList.add('hidden');
      }
      
      // Toggle turn number visibility based on filter/search state
      const turnNumberSpan = entry.querySelector('.log-turn-number');
      if (turnNumberSpan) {
        if (shouldShowTurnNumbers) {
          turnNumberSpan.style.display = 'inline';
        } else {
          turnNumberSpan.style.display = 'none';
        }
      }
    });

    // Hide/show turn sections if all entries are hidden
    const turnSections = gamelogElement.querySelectorAll('.log-turn-section');
    turnSections.forEach(section => {
      const visibleEntries = section.querySelectorAll('.log-entry:not(.hidden)');
      if (visibleEntries.length === 0) {
        section.style.display = 'none';
      } else {
        section.style.display = 'block';
      }
    });
  }

  // Update log badge count and re-apply filters when new entries are added
  const logBadge = document.getElementById('logBadge');
  if (logBadge && gamelogElement) {
    const logObserver = new MutationObserver(function() {
      // Count actual log entries (events only, not turn headers)
      const entries = gamelogElement.querySelectorAll('.log-entry');
      logBadge.textContent = entries.length;
      
      // Update turn number visibility for new entries based on current filter/search state
      const shouldShowTurnNumbers = currentFilter !== 'all' || searchTerm.length > 0;
      entries.forEach(entry => {
        const turnNumberSpan = entry.querySelector('.log-turn-number');
        if (turnNumberSpan) {
          turnNumberSpan.style.display = shouldShowTurnNumbers ? 'inline' : 'none';
        }
      });
      
      // Re-apply filters when new entries are added (if filter is active)
      if (currentFilter !== 'all' || searchTerm) {
        applyFilters();
      }
    });
    logObserver.observe(gamelogElement, { childList: true, subtree: true });
  }

  // Filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      applyFilters();
    });
  });

  // Search input
  if (logSearch) {
    logSearch.addEventListener('input', function() {
      searchTerm = this.value.toLowerCase();
      applyFilters();
    });
  }

  // Collapsible turn sections
  if (gamelogElement) {
    gamelogElement.addEventListener('click', function(e) {
      if (e.target.classList.contains('log-turn-header')) {
        const header = e.target;
        const content = header.nextElementSibling;
        if (content && content.classList.contains('log-turn-content')) {
          header.classList.toggle('collapsed');
          content.classList.toggle('collapsed');
        }
      }
    });
  }

  // Statistics tab switching
  const statsTabs = document.querySelectorAll('.stats-tab');
  const statsCharts = {
    cities: document.getElementById('statsChartCities'),
    army: document.getElementById('statsChartArmy'),
    territory: document.getElementById('statsChartTerritory'),
    morale: document.getElementById('statsChartMorale')
  };

  statsTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      statsTabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Hide all charts
      Object.values(statsCharts).forEach(chart => {
        if (chart) chart.style.display = 'none';
      });
      
      // Show selected chart
      const tabName = this.dataset.tab;
      if (statsCharts[tabName]) {
        statsCharts[tabName].style.display = 'block';
      }
    });
  });

  // Replay controls
  const replayPlayBtn = document.getElementById('replayPlayBtn');
  const replayPrevBtn = document.getElementById('replayPrevBtn');
  const replayNextBtn = document.getElementById('replayNextBtn');
  const replaySlider = document.getElementById('replaySlider');
  const replayExitBtn = document.getElementById('replayExitBtn');
  
  if (replayPlayBtn) {
    replayPlayBtn.addEventListener('click', function() {
      if (window.game && window.game.replay && window.game.board) {
        window.game.replay.togglePlay(window.game.board);
      }
    });
  }
  
  if (replayPrevBtn) {
    replayPrevBtn.addEventListener('click', function() {
      if (window.game && window.game.replay && window.game.board) {
        window.game.replay.previousTurn(window.game.board);
      }
    });
  }
  
  if (replayNextBtn) {
    replayNextBtn.addEventListener('click', function() {
      if (window.game && window.game.replay && window.game.board) {
        window.game.replay.nextTurn(window.game.board);
      }
    });
  }
  
  if (replaySlider) {
    replaySlider.addEventListener('input', function() {
      if (window.game && window.game.replay && window.game.board) {
        window.game.replay.goToTurn(parseInt(this.value), window.game.board);
      }
    });
  }
  
  if (replayExitBtn) {
    replayExitBtn.addEventListener('click', function() {
      if (window.game && window.game.replay && window.game.board) {
        window.game.replay.exitReplay(window.game.board);
      }
    });
  }
}

