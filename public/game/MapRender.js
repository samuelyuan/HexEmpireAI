class MapRender {
  drawMap(board, images) {
    const canvas = document.getElementById('map');
    const ctx = document.getElementById('map').getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(board.background_2, 0, 0);
    ctx.drawImage(board.background_sea, 0, 0);

    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        const xCenter = field._x;
        const yCenter = field._y;
        this.drawHexOutline(ctx, xCenter, yCenter);

        // Draw towns and ports
        if (field.estate === "town") {
          // Capital city should use a different image
          const cityImg = field.capital >= 0 ? images["capital" + field.capital].img : images.city.img;
          const width = cityImg.width;
          const height = cityImg.height;
          if (!field.army) {
            ctx.drawImage(cityImg, xCenter - (width / 2), yCenter - (height / 2));
          } else {
            ctx.translate(xCenter - (width / 2) + 17, yCenter - (height / 2) - 5);
            ctx.scale(0.9, 0.9);
            ctx.drawImage(cityImg, 0, 0);
            ctx.resetTransform();
          }
        } else if (field.estate === "port") {
          const portImg = images.port.img;
          const width = portImg.width;
          const height = portImg.height;
          if (!field.army) {
            ctx.drawImage(portImg, xCenter - (width / 2), yCenter - (height / 2));
          } else {
            ctx.translate(xCenter - (width / 2) + 25, yCenter - (height / 2) - 5)
            ctx.scale(0.5, 0.5);
            ctx.drawImage(portImg, 0, 0);
            ctx.resetTransform();
          }
        }

        this.drawArmy(ctx, field, xCenter, yCenter);
      }
    }

    // Draw territory borders after all hexes are drawn
    this.drawTerritoryBorders(ctx, board);

    this.drawTownNames(ctx, board);
  }

  drawArmy(ctx, field, xCenter, yCenter) {
    const armyColor = ["#ff0000", "#ff00ff", "#00bbff", "#00ff00"];
    if (field.army) {
      const party = field.army.party >= 0 ? field.army.party : 0;
      const color = field.army.party >= 0 ? armyColor[party] : "#000000";
      const count = field.army.count;
      const morale = field.army.morale;
      
      // Draw circle with party color (slightly larger for better visibility)
      this.drawCircle(ctx, xCenter, yCenter, 17, "#ffffff", color);
      
      // Draw background rectangle for text (better readability)
      const text = count + "/" + morale;
      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = 13;
      const padding = 5;
      const cornerRadius = 3;
      
      // Semi-transparent rounded background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      const bgX = xCenter - textWidth / 2 - padding;
      const bgY = yCenter - textHeight / 2;
      ctx.moveTo(bgX + cornerRadius, bgY);
      ctx.lineTo(bgX + textWidth + padding * 2 - cornerRadius, bgY);
      ctx.quadraticCurveTo(bgX + textWidth + padding * 2, bgY, bgX + textWidth + padding * 2, bgY + cornerRadius);
      ctx.lineTo(bgX + textWidth + padding * 2, bgY + textHeight - cornerRadius);
      ctx.quadraticCurveTo(bgX + textWidth + padding * 2, bgY + textHeight, bgX + textWidth + padding * 2 - cornerRadius, bgY + textHeight);
      ctx.lineTo(bgX + cornerRadius, bgY + textHeight);
      ctx.quadraticCurveTo(bgX, bgY + textHeight, bgX, bgY + textHeight - cornerRadius);
      ctx.lineTo(bgX, bgY + cornerRadius);
      ctx.quadraticCurveTo(bgX, bgY, bgX + cornerRadius, bgY);
      ctx.closePath();
      ctx.fill();
      
      // Draw text with better contrast
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, xCenter, yCenter + 1);
      
      // Reset text alignment
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }

  drawTownNames(ctx, board) {
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        const xCenter = field._x;
        const yCenter = field._y;

        // Draw towns and ports
        if (field.estate === "town" || field.estate === "port") {
          const townName = field.town_name;
          
          // Set font and measure text
          ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
          const textMetrics = ctx.measureText(townName);
          const textWidth = textMetrics.width;
          const textHeight = 13;
          const padding = 6;
          const cornerRadius = 4;
          
          // Calculate position (centered above the hex)
          const bgX = xCenter - textWidth / 2;
          const bgY = yCenter - 30;
          
          // Draw semi-transparent rounded background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.beginPath();
          ctx.moveTo(bgX + cornerRadius, bgY);
          ctx.lineTo(bgX + textWidth - cornerRadius, bgY);
          ctx.quadraticCurveTo(bgX + textWidth, bgY, bgX + textWidth, bgY + cornerRadius);
          ctx.lineTo(bgX + textWidth, bgY + textHeight - cornerRadius);
          ctx.quadraticCurveTo(bgX + textWidth, bgY + textHeight, bgX + textWidth - cornerRadius, bgY + textHeight);
          ctx.lineTo(bgX + cornerRadius, bgY + textHeight);
          ctx.quadraticCurveTo(bgX, bgY + textHeight, bgX, bgY + textHeight - cornerRadius);
          ctx.lineTo(bgX, bgY + cornerRadius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + cornerRadius, bgY);
          ctx.closePath();
          ctx.fill();
          
          // Draw text shadow for extra visibility
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillText(townName, bgX + 1, bgY + textHeight / 2 + 2);
          
          // Draw white text
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(townName, xCenter, bgY + textHeight / 2);
          
          // Reset text alignment
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
        }
      }
    }
  }

  drawHexOutline(ctx, xCenter, yCenter) {
    const numberOfSides = 6;
    const size = 25;
    ctx.beginPath();
    ctx.moveTo(xCenter - 12.5, yCenter - 20);
    ctx.lineTo(xCenter - 24, yCenter - 0);
    ctx.lineTo(xCenter - 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 24, yCenter + 0);
    ctx.lineTo(xCenter + 12.5, yCenter - 20);
    ctx.strokeStyle = "rgba(255, 255, 102, 0.3)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.closePath();
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

  drawTerritoryBorders(ctx, board) {
    const edgeMap = [3, 2, 1, 0, 5, 4]; // Neighbour index mapping for shared edges
    
    // Party RGB colors (without alpha)
    const partyRGB = [
      "255, 0, 0",      // Red
      "255, 0, 255",    // Magenta
      "0, 187, 255",    // Cyan
      "0, 255, 0"       // Green
    ];

    for (let x = 0; x < board.hw_xmax; x++) {
      for (let y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        if (field.party === -1) continue;

        const xCenter = field._x;
        const yCenter = field._y;
        
        // Vertices of the hex
        const V = [
          {x: xCenter - 12.5, y: yCenter - 20}, // V0 TopLeft
          {x: xCenter - 25,   y: yCenter - 0},  // V1 MidLeft
          {x: xCenter - 12.5, y: yCenter + 20}, // V2 BotLeft
          {x: xCenter + 12.5, y: yCenter + 20}, // V3 BotRight
          {x: xCenter + 25,   y: yCenter + 0},  // V4 MidRight
          {x: xCenter + 12.5, y: yCenter - 20}  // V5 TopRight
        ];

        const rgb = (field.party >= 0 && field.party < 4) 
          ? partyRGB[field.party] 
          : "0, 0, 0";
        
        let alphaStart = 0.6;
        let alphaLine = 0.8;
        
        if (field.party === board.human) {
          alphaStart = 0.8; 
          alphaLine = 1.0; 
        }

        if (field.neighbours) {
          for (let i = 0; i < 6; i++) {
            const neighbor = field.neighbours[i];
            if (!neighbor || neighbor.party !== field.party) {
              const edgeIndex = edgeMap[i];
              const vStart = V[edgeIndex];
              const vEnd = V[(edgeIndex + 1) % 6];
              
              // Gradient Fill (Inward Glow)
              const midX = (vStart.x + vEnd.x) / 2;
              const midY = (vStart.y + vEnd.y) / 2;
              
              const grd = ctx.createLinearGradient(midX, midY, xCenter, yCenter);
              grd.addColorStop(0, `rgba(${rgb}, ${alphaStart})`);
              grd.addColorStop(0.5, `rgba(${rgb}, 0)`);
              
              ctx.fillStyle = grd;
              ctx.beginPath();
              ctx.moveTo(xCenter, yCenter);
              ctx.lineTo(vStart.x, vStart.y);
              ctx.lineTo(vEnd.x, vEnd.y);
              ctx.closePath();
              ctx.fill();
              
              // Crisp Line
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
}

export { MapRender }
