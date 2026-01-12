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

    // Settlements Chart (Cities + Ports combined)
    if (!this.charts.cities) {
      const ctx = document.getElementById('citiesChart');
      if (ctx) {
        this.charts.cities = new Chart(ctx, {
          ...chartConfig,
          data: {
            labels: this.statistics.turns,
            datasets: partyNames.map((name, i) => ({
              label: name,
              data: this.statistics.settlements[i],
              borderColor: partyColors[i],
              backgroundColor: partyColors[i].replace('0.8', '0.1'),
              tension: 0.1
            }))
          },
          options: {
            ...chartConfig.options,
            scales: {
              ...chartConfig.options.scales,
              y: {
                ...chartConfig.options.scales.y,
                title: {
                  display: true,
                  text: 'Cities & Ports'
                }
              }
            }
          }
        });
      }
    } else {
      this.charts.cities.data.labels = this.statistics.turns;
      partyNames.forEach((name, i) => {
        this.charts.cities.data.datasets[i].data = this.statistics.settlements[i];
      });
      this.charts.cities.update();
    }

    // Army Size Chart
    if (!this.charts.army) {
      const ctx = document.getElementById('armyChart');
      if (ctx) {
        this.charts.army = new Chart(ctx, {
          ...chartConfig,
          data: {
            labels: this.statistics.turns,
            datasets: partyNames.map((name, i) => ({
              label: name,
              data: this.statistics.armySize[i],
              borderColor: partyColors[i],
              backgroundColor: partyColors[i].replace('0.8', '0.1'),
              tension: 0.1
            }))
          },
          options: {
            ...chartConfig.options,
            scales: {
              ...chartConfig.options.scales,
              y: {
                ...chartConfig.options.scales.y,
                title: {
                  display: true,
                  text: 'Army Size'
                }
              }
            }
          }
        });
      }
    } else {
      this.charts.army.data.labels = this.statistics.turns;
      partyNames.forEach((name, i) => {
        this.charts.army.data.datasets[i].data = this.statistics.armySize[i];
      });
      this.charts.army.update();
    }

    // Territory Chart
    if (!this.charts.territory) {
      const ctx = document.getElementById('territoryChart');
      if (ctx) {
        this.charts.territory = new Chart(ctx, {
          ...chartConfig,
          data: {
            labels: this.statistics.turns,
            datasets: partyNames.map((name, i) => ({
              label: name,
              data: this.statistics.territory[i],
              borderColor: partyColors[i],
              backgroundColor: partyColors[i].replace('0.8', '0.1'),
              tension: 0.1
            }))
          },
          options: {
            ...chartConfig.options,
            scales: {
              ...chartConfig.options.scales,
              y: {
                ...chartConfig.options.scales.y,
                title: {
                  display: true,
                  text: 'Territory Tiles'
                }
              }
            }
          }
        });
      }
    } else {
      this.charts.territory.data.labels = this.statistics.turns;
      partyNames.forEach((name, i) => {
        this.charts.territory.data.datasets[i].data = this.statistics.territory[i];
      });
      this.charts.territory.update();
    }

    // Morale Chart
    if (!this.charts.morale) {
      const ctx = document.getElementById('moraleChart');
      if (ctx) {
        this.charts.morale = new Chart(ctx, {
          ...chartConfig,
          data: {
            labels: this.statistics.turns,
            datasets: partyNames.map((name, i) => ({
              label: name,
              data: this.statistics.morale[i],
              borderColor: partyColors[i],
              backgroundColor: partyColors[i].replace('0.8', '0.1'),
              tension: 0.1
            }))
          },
          options: {
            ...chartConfig.options,
            scales: {
              ...chartConfig.options.scales,
              y: {
                ...chartConfig.options.scales.y,
                title: {
                  display: true,
                  text: 'Morale'
                }
              }
            }
          }
        });
      }
    } else {
      this.charts.morale.data.labels = this.statistics.turns;
      partyNames.forEach((name, i) => {
        this.charts.morale.data.datasets[i].data = this.statistics.morale[i];
      });
      this.charts.morale.update();
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

