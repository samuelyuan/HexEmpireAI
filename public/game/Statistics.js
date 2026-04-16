class Statistics {
  constructor() {
    this.statistics = {
      turns: [],
      settlements: [[], [], [], []],  // cities + ports per party per turn
      territory: [[], [], [], []],   // territory tiles per party per turn
      armySize: [[], [], [], []],     // total army count per party per turn
      morale: [[], [], [], []]       // morale per party per turn
    };
    this.charts = {
      cities: null,
      army: null,
      territory: null,
      morale: null
    };
  }

  collectStatistics(board, turnNumber) {
    this.statistics.turns.push(turnNumber);
    
    for (let party = 0; party < board.hw_parties_count; party++) {
      // Count settlements (cities + ports combined)
      const citiesCount = board.hw_parties_towns[party] ? board.hw_parties_towns[party].length : 0;
      const portsCount = board.hw_parties_ports[party] ? board.hw_parties_ports[party].length : 0;
      const settlementsCount = citiesCount + portsCount;
      this.statistics.settlements[party].push(settlementsCount);
      
      // Count territory (land tiles)
      const territoryCount = board.hw_parties_lands[party] ? board.hw_parties_lands[party].length : 0;
      this.statistics.territory[party].push(territoryCount);
      
      // Army size
      const armySize = board.hw_parties_total_count[party] || 0;
      this.statistics.armySize[party].push(armySize);
      
      // Morale
      const morale = board.hw_parties_morale[party] || 0;
      this.statistics.morale[party].push(morale);
    }
    
    // Update charts
    this.updateCharts(board);
  }

  updateCharts(board) {
    const partyNames = board.hw_parties_names;
    const partyColors = [
      'rgba(255, 0, 0, 0.8)',
      'rgba(255, 0, 255, 0.8)',
      'rgba(0, 187, 255, 0.8)',
      'rgba(0, 255, 0, 0.8)'
    ];
    
    const chartConfig = {
      type: 'line',
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Turn'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    const chartOptionsWithYTitle = (yTitle) => ({
      ...chartConfig.options,
      scales: {
        ...chartConfig.options.scales,
        y: {
          ...chartConfig.options.scales.y,
          title: { ...chartConfig.options.scales.y.title, text: yTitle }
        }
      }
    });

    const buildPartyDatasets = (seriesPerParty) =>
      partyNames.map((name, i) => ({
        label: name,
        data: seriesPerParty[i],
        borderColor: partyColors[i],
        backgroundColor: partyColors[i].replace('0.8', '0.1'),
        tension: 0.1
      }));

    const chartDefs = [
      { chartKey: 'cities', canvasId: 'citiesChart', seriesKey: 'settlements', yTitle: 'Cities & Ports' },
      { chartKey: 'army', canvasId: 'armyChart', seriesKey: 'armySize', yTitle: 'Army Size' },
      { chartKey: 'territory', canvasId: 'territoryChart', seriesKey: 'territory', yTitle: 'Territory Tiles' },
      { chartKey: 'morale', canvasId: 'moraleChart', seriesKey: 'morale', yTitle: 'Morale' }
    ];

    for (const def of chartDefs) {
      const series = this.statistics[def.seriesKey];
      const existing = this.charts[def.chartKey];

      if (!existing) {
        const ctx = document.getElementById(def.canvasId);
        if (!ctx) continue;
        this.charts[def.chartKey] = new Chart(ctx, {
          ...chartConfig,
          data: {
            labels: this.statistics.turns,
            datasets: buildPartyDatasets(series)
          },
          options: chartOptionsWithYTitle(def.yTitle)
        });
        continue;
      }

      existing.data.labels = this.statistics.turns;
      partyNames.forEach((_, i) => {
        existing.data.datasets[i].data = series[i];
      });
      existing.update();
    }
  }

  reset() {
    this.statistics = {
      turns: [],
      settlements: [[], [], [], []],
      territory: [[], [], [], []],
      armySize: [[], [], [], []],
      morale: [[], [], [], []]
    };
    
    // Destroy existing charts
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {
      cities: null,
      army: null,
      territory: null,
      morale: null
    };
  }
}

export { Statistics }

