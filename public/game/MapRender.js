class MapRender {
  drawMap(board) {
    const ctx = document.getElementById('map').getContext('2d');
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
        if (field.type === "water") {
          this.drawHexTile(ctx, xCenter, yCenter, "#263988");
        } else if (field.type === "land") {
          this.drawHexTile(ctx, xCenter, yCenter, "#97c348");
        }

        // Draw which party controls the tile
        if (field.party != -1) {
          if (field.party >= 0 && field.party < 4) {
            this.drawHexTile(ctx, xCenter, yCenter, partyColorStrings[field.party]);
          } else {
            this.drawHexTile(ctx, xCenter, yCenter, "rgba(0, 0, 0, 0.5)");
          }
        }

        // Draw army
        const armyColor = ["#ff0000", "#ff00ff", "#00bbff", "#00ff00"];
        if (field.army) {
          this.drawCircle(ctx, xCenter, yCenter, 15, "#ffffff", field.army.party >= 0 ? armyColor[field.army.party] : "#000000");
          ctx.fillStyle = 'black';
          ctx.font = '12px serif';
          ctx.fillText(field.army.count + "/" + field.army.morale, xCenter - 12, yCenter + 2.5);
        }

        // Capital city should be marked with different color
        const townColor = field.capital >= 0 ? armyColor[field.capital] : "#0000a7";
        // Draw towns and ports
        if (field.estate === "town") {
          if (!field.army) {
            this.drawCircle(ctx, xCenter, yCenter, 7.5, townColor, townColor);
            ctx.fillStyle = 'black';
            ctx.font = '10px serif';
            ctx.fillText(field.town_name, xCenter - 10, yCenter - 10);
          } else {
            this.drawCircle(ctx, xCenter + 10, yCenter - 10, 5, townColor, townColor);
          }
        } else if (field.estate === "port") {
          if (!field.army) {
            this.drawCircle(ctx, xCenter, yCenter, 15, townColor, townColor);
            ctx.fillStyle = 'black';
            ctx.font = '10px serif';
            ctx.fillText(field.town_name, xCenter - 10, yCenter - 10);
          } else {
            this.drawCircle(ctx, xCenter + 10, yCenter - 10, 5, townColor, townColor);
          }
        }
      }
    }
  }

  drawHexTile(ctx, xCenter, yCenter, color) {
    const numberOfSides = 6;
    const size = 25;
    ctx.beginPath();
    ctx.moveTo(xCenter + size * Math.cos(0), yCenter + size * Math.sin(0));
    for (var i = 1; i <= numberOfSides; i++) {
      ctx.lineTo(xCenter + size * Math.cos(i * 2 * Math.PI / numberOfSides), yCenter + size * Math.sin(i * 2 * Math.PI / numberOfSides));
    }
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
}

export { MapRender }
