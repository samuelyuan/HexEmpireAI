class MapRender {
  drawMap(board, images) {
    const canvas = document.getElementById('map');
    const ctx = document.getElementById('map').getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply canvas translation offset
    const offsetX = board.renderOffset?.x || 0;
    const offsetY = board.renderOffset?.y || 0;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    
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
          if (field.army) {
            this.drawCenteredImage(ctx, cityImg, xCenter, yCenter, {
              scale: 0.9,
              offsetX: 17,
              offsetY: -5
            });
          } else {
            this.drawCenteredImage(ctx, cityImg, xCenter, yCenter);
          }
        } else if (field.estate === "port") {
          const portImg = images.port.img;
          if (field.army) {
            this.drawCenteredImage(ctx, portImg, xCenter, yCenter, {
              scale: 0.5,
              offsetX: 25,
              offsetY: -5
            });
          } else {
            this.drawCenteredImage(ctx, portImg, xCenter, yCenter);
          }
        }

        this.drawArmy(ctx, field, xCenter, yCenter);
      }
    }

    // Draw territory borders after all hexes are drawn
    this.drawTerritoryBorders(ctx, board);

    this.drawTownNames(ctx, board);
    
    // Restore canvas transformation
    ctx.restore();
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
      
      // Draw text with background
      const text = count + "/" + morale;
      this.drawTextWithBackground(ctx, text, xCenter, yCenter + 1, {
        padding: 5,
        cornerRadius: 3,
        bgColor: 'rgba(0, 0, 0, 0.7)',
        textColor: '#ffffff'
      });
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
          
          // Calculate position (centered above the hex)
          // Original: bgY = yCenter - 30, textY = bgY + textHeight/2
          // So text center is at: yCenter - 30 + textHeight/2
          const textHeight = 13;
          const textY = yCenter - 30 + textHeight / 2;
          
          // Draw text with background
          this.drawTextWithBackground(ctx, townName, xCenter, textY, {
            padding: 6,
            cornerRadius: 4,
            bgColor: 'rgba(0, 0, 0, 0.75)',
            textColor: '#ffffff',
            shadow: true,
            shadowOffsetX: 1,
            shadowOffsetY: 2,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          });
        }
      }
    }
  }

  /**
   * Draws an image centered at the specified coordinates, with optional transform
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLImageElement} image - Image to draw
   * @param {number} xCenter - X center position
   * @param {number} yCenter - Y center position
   * @param {Object} options - Transform options
   * @param {number} options.scale - Scale factor (default: 1.0)
   * @param {number} options.offsetX - X offset when transformed (default: 0)
   * @param {number} options.offsetY - Y offset when transformed (default: 0)
   */
  drawCenteredImage(ctx, image, xCenter, yCenter, options = {}) {
    const {
      scale = 1.0,
      offsetX = 0,
      offsetY = 0
    } = options;

    const width = image.width;
    const height = image.height;
    const baseX = xCenter - (width / 2);
    const baseY = yCenter - (height / 2);

    if (scale === 1.0 && offsetX === 0 && offsetY === 0) {
      // Simple centered draw without transform
      ctx.drawImage(image, baseX, baseY);
    } else {
      // Apply transform
      ctx.save();
      ctx.translate(baseX + offsetX, baseY + offsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    }
  }

  /**
   * Calculates the 6 vertices of a hexagon
   * @param {number} xCenter - X coordinate of hex center
   * @param {number} yCenter - Y coordinate of hex center
   * @param {number} size - Size of the hex (default: 25)
   * @returns {Array<{x: number, y: number}>} Array of 6 vertex coordinates
   */
  getHexVertices(xCenter, yCenter, size = 25) {
    const halfWidth = size / 2;
    const height = size * 0.8; // 20 for size 25
    
    return [
      {x: xCenter - halfWidth, y: yCenter - height},     // V0 TopLeft
      {x: xCenter - size,      y: yCenter - 0},          // V1 MidLeft
      {x: xCenter - halfWidth, y: yCenter + height},     // V2 BotLeft
      {x: xCenter + halfWidth, y: yCenter + height},     // V3 BotRight
      {x: xCenter + size,      y: yCenter + 0},          // V4 MidRight
      {x: xCenter + halfWidth, y: yCenter - height}       // V5 TopRight
    ];
  }

  drawHexOutline(ctx, xCenter, yCenter) {
    // Use slightly smaller size for outline (24 instead of 25)
    const vertices = this.getHexVertices(xCenter, yCenter, 24);
    
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.strokeStyle = "rgba(255, 255, 102, 0.3)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.closePath();
  }

  drawHexTile(ctx, xCenter, yCenter, color) {
    const vertices = this.getHexVertices(xCenter, yCenter, 25);
    
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 0.1;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }

  /**
   * Draws a territory border edge with gradient fill and stroke
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {{x: number, y: number}} vStart - Start vertex of the edge
   * @param {{x: number, y: number}} vEnd - End vertex of the edge
   * @param {number} xCenter - X coordinate of hex center
   * @param {number} yCenter - Y coordinate of hex center
   * @param {string} rgb - RGB color string (e.g., "255, 0, 0")
   * @param {number} alphaStart - Alpha value at the edge (0-1)
   * @param {number} alphaLine - Alpha value for the stroke line (0-1)
   */
  drawTerritoryBorderEdge(ctx, vStart, vEnd, xCenter, yCenter, rgb, alphaStart, alphaLine) {
    // Calculate midpoint of the edge
    const midX = (vStart.x + vEnd.x) / 2;
    const midY = (vStart.y + vEnd.y) / 2;
    
    // Create gradient from edge midpoint to hex center (Inward Glow)
    const grd = ctx.createLinearGradient(midX, midY, xCenter, yCenter);
    grd.addColorStop(0, `rgba(${rgb}, ${alphaStart})`);
    grd.addColorStop(0.5, `rgba(${rgb}, 0)`);
    
    // Draw gradient-filled triangle
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(xCenter, yCenter);
    ctx.lineTo(vStart.x, vStart.y);
    ctx.lineTo(vEnd.x, vEnd.y);
    ctx.closePath();
    ctx.fill();
    
    // Draw crisp stroke line along the edge
    ctx.beginPath();
    ctx.moveTo(vStart.x, vStart.y);
    ctx.lineTo(vEnd.x, vEnd.y);
    ctx.strokeStyle = `rgba(${rgb}, ${alphaLine})`;
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.stroke();
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
        const V = this.getHexVertices(xCenter, yCenter, 25);

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
              
              this.drawTerritoryBorderEdge(ctx, vStart, vEnd, xCenter, yCenter, rgb, alphaStart, alphaLine);
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

  /**
   * Draws a rounded rectangle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position of top-left corner
   * @param {number} y - Y position of top-left corner
   * @param {number} width - Width of the rectangle
   * @param {number} height - Height of the rectangle
   * @param {number} cornerRadius - Radius of the rounded corners
   * @param {string} fillStyle - Fill style (color) for the rectangle
   */
  drawRoundedRectangle(ctx, x, y, width, height, cornerRadius, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius, y);
    ctx.lineTo(x + width - cornerRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
    ctx.lineTo(x + width, y + height - cornerRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
    ctx.lineTo(x + cornerRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
    ctx.lineTo(x, y + cornerRadius);
    ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draws text with a rounded background rectangle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} text - Text to draw
   * @param {number} xCenter - X center position for text
   * @param {number} yCenter - Y center position for text
   * @param {Object} options - Configuration options
   * @param {string} options.font - Font string (default: 'bold 11px "Segoe UI", Arial, sans-serif')
   * @param {number} options.padding - Padding around text (default: 5)
   * @param {number} options.cornerRadius - Corner radius for background (default: 3)
   * @param {string} options.bgColor - Background color (default: 'rgba(0, 0, 0, 0.7)')
   * @param {string} options.textColor - Text color (default: '#ffffff')
   * @param {string} options.textAlign - Text alignment (default: 'center')
   * @param {string} options.textBaseline - Text baseline (default: 'middle')
   * @param {boolean} options.shadow - Whether to draw text shadow (default: false)
   * @param {number} options.shadowOffsetX - Shadow X offset (default: 1)
   * @param {number} options.shadowOffsetY - Shadow Y offset (default: 2)
   * @param {string} options.shadowColor - Shadow color (default: 'rgba(0, 0, 0, 0.3)')
   */
  drawTextWithBackground(ctx, text, xCenter, yCenter, options = {}) {
    const {
      font = 'bold 11px "Segoe UI", Arial, sans-serif',
      padding = 5,
      cornerRadius = 3,
      bgColor = 'rgba(0, 0, 0, 0.7)',
      textColor = '#ffffff',
      textAlign = 'center',
      textBaseline = 'middle',
      shadow = false,
      shadowOffsetX = 1,
      shadowOffsetY = 2,
      shadowColor = 'rgba(0, 0, 0, 0.3)'
    } = options;

    // Set font and measure text
    ctx.font = font;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = 13; // Approximate text height
    
    // Calculate background position
    const bgX = xCenter - textWidth / 2 - padding;
    const bgY = yCenter - textHeight / 2;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight;
    
    // Draw rounded background
    this.drawRoundedRectangle(ctx, bgX, bgY, bgWidth, bgHeight, cornerRadius, bgColor);
    
    // Draw text shadow if enabled
    if (shadow) {
      ctx.fillStyle = shadowColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(text, bgX + padding + shadowOffsetX, yCenter + shadowOffsetY);
    }
    
    // Draw text
    ctx.fillStyle = textColor;
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;
    ctx.fillText(text, xCenter, yCenter);
    
    // Reset text alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}

export { MapRender }
