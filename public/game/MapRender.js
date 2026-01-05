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
        this.drawHexOutline(ctx, xCenter, yCenter);

        // Draw which party controls the tile
        if (field.party != -1) {
          if (field.party >= 0 && field.party < 4) {
            this.drawHexTile(ctx, xCenter, yCenter, partyColorStrings[field.party]);
          } else {
            this.drawHexTile(ctx, xCenter, yCenter, "rgba(0, 0, 0, 0.5)");
          }
        }

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

    this.drawTownNames(ctx, board);
  }

  drawArmy(ctx, field, xCenter, yCenter) {
    const armyColor = ["#ff0000", "#ff00ff", "#00bbff", "#00ff00"];
    if (field.army) {
      this.drawCircle(ctx, xCenter, yCenter, 15, "#ffffff", field.army.party >= 0 ? armyColor[field.army.party] : "#000000");
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
