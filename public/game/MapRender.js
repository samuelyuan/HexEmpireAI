class MapRender {
  drawMap(board, images) {
    const canvas = document.getElementById('map');
    const ctx = document.getElementById('map').getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(board.background_2, 0, 0);
    ctx.drawImage(board.background_sea, 0, 0);

    const partyColorStrings = [
      "rgba(255, 0, 0, 0.5)",
      "rgba(255, 0, 255, 0.5)",
      "rgba(0, 187, 255, 0.5)",
      "rgba(0, 255, 0, 0.5)"
    ];

    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        const xCenter = field._x;
        const yCenter = field._y;

        // Draw which party controls the tile
        if (field.party != -1) {
          if (field.party >= 0 && field.party < 4) {
            let color = partyColorStrings[field.party];
            // Highlight human player faction
            if (field.party == board.human) {
               color = color.replace("0.5)", "0.75)");
            }
            this.drawHexTile(ctx, xCenter, yCenter, color);
          } else {
            this.drawHexTile(ctx, xCenter, yCenter, "rgba(0, 0, 0, 0.5)");
          }
        }
        
        // Draw Grid (Base)
        this.drawHexOutline(ctx, xCenter, yCenter, "rgba(0,0,0,0.2)", 0.5);

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

    this.drawTerritoryBorders(ctx, board);
    this.drawTownNames(ctx, board);
  }

  drawTerritoryBorders(ctx, board) {
    const edgeMap = [3, 2, 1, 0, 5, 4];
    
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        if (field.party == -1) continue; 

        let borderColor = "rgba(0,0,0,0.8)";
        let borderWidth = 1;
        if (field.party == board.human) {
            borderColor = "#FFD700";
            borderWidth = 3;
        }

        const xCenter = field._x;
        const yCenter = field._y;
        
        const V = [
            {x: xCenter - 12.5, y: yCenter - 20}, // V0 TopLeft
            {x: xCenter - 25,   y: yCenter - 0},  // V1 MidLeft (fixed width 25)
            {x: xCenter - 12.5, y: yCenter + 20}, // V2 BotLeft
            {x: xCenter + 12.5, y: yCenter + 20}, // V3 BotRight
            {x: xCenter + 25,   y: yCenter + 0},  // V4 MidRight
            {x: xCenter + 12.5, y: yCenter - 20}  // V5 TopRight
        ];

        for (let i = 0; i < 6; i++) {
            const neighbor = field.neighbours[i];
            if (!neighbor || neighbor.party != field.party) {
                const edgeIndex = edgeMap[i];
                const vStart = V[edgeIndex];
                const vEnd = V[(edgeIndex + 1) % 6];
                
                ctx.beginPath();
                ctx.moveTo(vStart.x, vStart.y);
                ctx.lineTo(vEnd.x, vEnd.y);
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = borderWidth;
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
      ctx.fillStyle = 'black';
      ctx.font = '12px serif';
      ctx.fillText(field.army.count + "/" + field.army.morale, xCenter - 12, yCenter + 2.5);
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
          ctx.fillStyle = 'white';
          ctx.font = '12px serif';
          ctx.fillText(field.town_name, xCenter - (10 + field.town_name.length), yCenter - 17);
        }
      }
    }
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
    ctx.strokeStyle = borderColor || "rgba(255, 255, 102, 0.3)";
    ctx.lineWidth = borderWidth || 0.5;
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
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }
}

export { MapRender }
