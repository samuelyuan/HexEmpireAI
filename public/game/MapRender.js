class MapRender {
  drawMap(board, images) {
    const canvas = document.getElementById('map');
    const ctx = document.getElementById('map').getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(board.background_2, 0, 0);

    // Draw Shoreline Glow/Shadow around Water
    ctx.shadowColor = "rgba(210, 180, 140, 1)"; // Sand color
    ctx.shadowBlur = 40; 
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.drawImage(board.background_sea, 0, 0);
    
    // Reset Shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;


    const partyColorsRGB = [
      "255, 0, 0",
      "255, 0, 255",
      "0, 187, 255",
      "0, 255, 0"
    ];

    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        const xCenter = field._x;
        const yCenter = field._y;

        // Draw Tint for Territory
        if (field.party != -1) {
            let rgb = partyColorsRGB[field.party] || "0,0,0";
            let alpha = 0.01; // Very faint for enemies
            
            if (field.party == board.human) {
                alpha = 0.25; // Distinct for human
            }
            
            this.drawHexTile(ctx, xCenter, yCenter, `rgba(${rgb}, ${alpha})`);
        }

        // Draw Grid (Base)
        this.drawHexOutline(ctx, xCenter, yCenter, "rgba(0,0,0,0.2)", 0.5);

        // Draw towns and ports
        if (field.estate === "town") {
          // Capital city should use a different image
          const cityImg = field.capital >= 0 ? images["capital" + field.capital].img : images.city.img;
          // Enforce fixed size for high-res assets
          const width = 32;
          const height = 32;
          
          if (!field.army) {
            ctx.drawImage(cityImg, xCenter - (width / 2), yCenter - (height / 2), width, height);
          } else {
            ctx.save();
            // Adjust translation for the fixed size
            ctx.translate(xCenter - (width / 2) + 17, yCenter - (height / 2) - 5);
            ctx.scale(0.9, 0.9);
            ctx.drawImage(cityImg, 0, 0, width, height);
            ctx.restore();
          }
        } else if (field.estate === "port") {
          const portImg = images.port.img;
          const width = 32;
          const height = 32;
          
          if (!field.army) {
            ctx.drawImage(portImg, xCenter - (width / 2), yCenter - (height / 2), width, height);
          } else {
            ctx.save();
            ctx.translate(xCenter - (width / 2) + 25, yCenter - (height / 2) - 5)
            ctx.scale(0.5, 0.5);
            ctx.drawImage(portImg, 0, 0, width, height);
            ctx.restore();
          }
        }
      }
    }

    this.drawTerritoryBorders(ctx, board);
    this.drawTownNames(ctx, board);

    // Draw armies last to be on top of everything
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        this.drawArmy(ctx, field, field._x, field._y);
      }
    }
  }

  drawTerritoryBorders(ctx, board) {
    const edgeMap = [3, 2, 1, 0, 5, 4];
    const partyColorsRGB = [
        "255, 0, 0",      // Red
        "255, 0, 255",    // Magenta
        "0, 187, 255",    // Cyan
        "0, 255, 0"       // Green
    ];
    
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        if (field.party == -1) continue; 

        const xCenter = field._x;
        const yCenter = field._y;
        
        const V = [
            {x: xCenter - 12.5, y: yCenter - 20}, // V0 TopLeft
            {x: xCenter - 25,   y: yCenter - 0},  // V1 MidLeft
            {x: xCenter - 12.5, y: yCenter + 20}, // V2 BotLeft
            {x: xCenter + 12.5, y: yCenter + 20}, // V3 BotRight
            {x: xCenter + 25,   y: yCenter + 0},  // V4 MidRight
            {x: xCenter + 12.5, y: yCenter - 20}  // V5 TopRight
        ];

        let rgb = partyColorsRGB[field.party] || "0,0,0";
        let alphaStart = 0.6;
        let alphaLine = 0.8;
        
        // Highlight human player faction
        if (field.party == board.human) {
            alphaStart = 0.8; 
            alphaLine = 1.0; 
        }

        for (let i = 0; i < 6; i++) {
            const neighbor = field.neighbours[i];
            if (!neighbor || neighbor.party != field.party) {
                const edgeIndex = edgeMap[i];
                const vStart = V[edgeIndex];
                const vEnd = V[(edgeIndex + 1) % 6];
                
                // Gradient Fill (Inward Glow)
                const midX = (vStart.x + vEnd.x) / 2;
                const midY = (vStart.y + vEnd.y) / 2;
                
                const grd = ctx.createLinearGradient(midX, midY, xCenter, yCenter);
                grd.addColorStop(0, `rgba(${rgb}, ${alphaStart})`);
                grd.addColorStop(0.5, `rgba(${rgb}, 0)`); // Fade out halfway
                
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.moveTo(xCenter, yCenter);
                ctx.lineTo(vStart.x, vStart.y);
                ctx.lineTo(vEnd.x, vEnd.y);
                ctx.closePath();
                ctx.fill();
                
                // Crisp Line on Edge
                ctx.beginPath();
                ctx.moveTo(vStart.x, vStart.y);
                ctx.lineTo(vEnd.x, vEnd.y);
                ctx.strokeStyle = `rgba(${rgb}, ${alphaLine})`;
                ctx.lineWidth = 1; 
                ctx.lineCap = "round";
                ctx.stroke();
            }
        }
      }
    }
  }

  drawArmy(ctx, field, xCenter, yCenter) {
    const armyColor = ["#ff0000", "#ff00ff", "#00bbff", "#00ff00"];
    if (field.army) {
      const fillColor = field.army.moved ? "#bbbbbb" : "#ffffff";
      this.drawCircle(ctx, xCenter, yCenter, 15, fillColor, field.army.party >= 0 ? armyColor[field.army.party] : "#000000");
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 11px "Roboto Condensed", sans-serif';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'black';
      ctx.strokeText(field.army.count + "/" + field.army.morale, xCenter, yCenter);
      ctx.fillStyle = 'white';
      ctx.fillText(field.army.count + "/" + field.army.morale, xCenter, yCenter);
      
      // Reset defaults
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }
  }

  drawTownNames(ctx, board) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 12px "Roboto Condensed", sans-serif';
    ctx.lineWidth = 3;

    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        const xCenter = field._x;
        const yCenter = field._y;

        // Draw towns and ports
        if (field.estate === "town" || field.estate === "port") {
          let yPos = yCenter - 17;
          
          // Check for top cropping (if too close to top edge)
          if (yPos < 15) {
             ctx.textBaseline = 'top';
             yPos = yCenter + 20; // Draw below the city
          } else {
             ctx.textBaseline = 'bottom';
          }

          ctx.strokeStyle = 'black';
          ctx.strokeText(field.town_name, xCenter, yPos);
          ctx.fillStyle = 'white';
          ctx.fillText(field.town_name, xCenter, yPos);
        }
      }
    }
    // Reset defaults
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  drawHexOutline(ctx, xCenter, yCenter, borderColor, borderWidth) {
    const numberOfSides = 6;
    const size = 25;
    ctx.beginPath();
    ctx.moveTo(xCenter - 12.5, yCenter - 20);
    ctx.lineTo(xCenter - 24, yCenter - 0);
    ctx.lineTo(xCenter - 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 24, yCenter + 0);
    ctx.lineTo(xCenter + 12.5, yCenter - 20);
    ctx.closePath();
    ctx.strokeStyle = borderColor || "rgba(255, 255, 102, 0.3)";
    ctx.lineWidth = borderWidth || 0.5;
    ctx.stroke();
  }

  drawHexTile(ctx, xCenter, yCenter, color) {
    const numberOfSides = 6;
    const size = 25;
    ctx.beginPath();
    ctx.moveTo(xCenter - 12.5, yCenter - 20);
    ctx.lineTo(xCenter - 25, yCenter - 0);
    ctx.lineTo(xCenter - 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 25, yCenter + 0);
    ctx.lineTo(xCenter + 12.5, yCenter - 20);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 0.1;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }

  drawCircle(ctx, xCenter, yCenter, radius, fillColor, outlineColor) {
    const startAngle = 0 * Math.PI;
    const endAngle = 2.0 * Math.PI

    ctx.beginPath();
    ctx.arc(xCenter, yCenter, radius, startAngle, endAngle);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }

  drawSelection(field) {
    const ctx = document.getElementById('map').getContext('2d');
    const x = field._x;
    const y = field._y;
    
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawValidMoves(fields, board) {
    const ctx = document.getElementById('map').getContext('2d');
    for (let i = 0; i < fields.length; i++) {
      let field = fields[i];
      let color = "rgba(255, 255, 255, 0.4)"; // Default move
      
      if (field.army) {
        if (field.army.party != board.human) {
           color = "rgba(255, 0, 0, 0.4)"; // Attack
        } else {
           color = "rgba(0, 255, 0, 0.4)"; // Merge
        }
      }
      
      this.drawHexTile(ctx, field._x, field._y, color);
    }
  }

  drawHover(field) {
    const ctx = document.getElementById('map').getContext('2d');
    const xCenter = field._x;
    const yCenter = field._y;
    
    ctx.beginPath();
    ctx.moveTo(xCenter - 12.5, yCenter - 20);
    ctx.lineTo(xCenter - 25, yCenter - 0);
    ctx.lineTo(xCenter - 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 25, yCenter + 0);
    ctx.lineTo(xCenter + 12.5, yCenter - 20);
    ctx.closePath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export { MapRender }
