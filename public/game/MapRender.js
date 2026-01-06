class MapRender {
  drawMap(board, images) {
    const canvas = document.getElementById('map');
    const ctx = document.getElementById('map').getContext('2d');
    this.images = images;

    // Scale context for HiDPI
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear using logical coordinates
    ctx.clearRect(0, 0, board.pixelWidth, board.pixelHeight);
    
    // Draw background using logical size
    ctx.drawImage(board.background_2, 0, 0, board.pixelWidth, board.pixelHeight);

    // Draw Shoreline Glow/Shadow around Water
    ctx.shadowColor = "rgba(210, 180, 140, 1)"; // Sand color
    ctx.shadowBlur = 40; 
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.drawImage(board.background_sea, 0, 0, board.pixelWidth, board.pixelHeight);
    
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

    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        this.drawArmyUnit(ctx, field, field._x, field._y, board);
      }
    }
    
    this.drawTownNames(ctx, board);
    
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        const field = board.field["f" + x + "x" + y];
        this.drawArmyLabel(ctx, field, field._x, field._y);
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

  getUnitRenderData(field) {
    if (!field.army) return null;
    
    let type = 'infantry';
    if (field.type === 'water') {
        type = 'warship';
    } else if (field.army.count >= 75) {
        type = 'tank';
    } else if (field.army.count >= 40) {
        type = 'artillery';
    }
    
    const img = this.images[type].img;
    
    // Scale configuration for each unit type
    const scales = {
        infantry: 0.10,
        artillery: 0.12,
        tank: 0.13,
        warship: 0.13
    };
    
    const scale = scales[type] || 0.1;
    
    return {
        img: img,
        width: img.width * scale,
        height: img.height * scale
    };
  }

  drawArmyUnit(ctx, field, xCenter, yCenter, board) {
    const unitData = this.getUnitRenderData(field);
    if (unitData) {
      const { img: unitImg, width, height } = unitData;

      const partyColorsRGB = [
          "255, 0, 0",      // Red
          "255, 0, 255",    // Magenta
          "0, 187, 255",    // Cyan
          "0, 255, 0"       // Green
      ];
      let rgb = partyColorsRGB[field.army.party] || "0,0,0";

      // Initialize scratch canvas for tinting (High DPI for sharpness)
      const scaleFactor = 2; 
      const sWidth = width * scaleFactor;
      const sHeight = height * scaleFactor;

      if (!this.scratchCanvas) {
          this.scratchCanvas = document.createElement('canvas');
      }
      // Ensure scratch canvas is large enough
      if (this.scratchCanvas.width < sWidth || this.scratchCanvas.height < sHeight) {
          this.scratchCanvas.width = sWidth;
          this.scratchCanvas.height = sHeight;
      }
      const sCtx = this.scratchCanvas.getContext('2d');
      sCtx.clearRect(0, 0, sWidth, sHeight);

      // 1. Prepare Tinted Body (High Res)
      // Use high quality smoothing when scaling down/up
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(unitImg, 0, 0, sWidth, sHeight);
      
      // Check if unit should appear movable (Human & Not Moved)
      // AI units always appear as "immovable" (White + Glow only)
      const isMovable = !field.army.moved && (field.army.party == board.human);

      // Only tint movable units (Prominent Yellow Tint)
      if (isMovable) {
          sCtx.globalCompositeOperation = 'source-atop'; 
          sCtx.fillStyle = `rgb(255, 236, 88)`; // Strong Yellow tint
          sCtx.fillRect(0, 0, sWidth, sHeight);
      }
      sCtx.globalCompositeOperation = 'source-over'; // Reset

      // 2. Draw Glows and Body
      if (isMovable) {
          // Pass 1: Golden Outer Glow (Shadow Only)
          ctx.save();
          ctx.shadowColor = "rgba(255, 225, 0, 1.0)"; // Bright Yellow Glow
          ctx.shadowBlur = 20;
          const OFFSET = 10000;
          ctx.shadowOffsetX = OFFSET;
          ctx.drawImage(this.scratchCanvas, 0, 0, sWidth, sHeight, xCenter - width/2 - OFFSET, yCenter - height/2, width, height);
          ctx.restore();
      }

      // Pass 2: Faction Glow + Body
      ctx.save();
      ctx.shadowColor = `rgba(${rgb}, 0.8)`;
      ctx.shadowBlur = 15;
      // Draw the high-res scratch image scaled down to target size
      ctx.drawImage(this.scratchCanvas, 0, 0, sWidth, sHeight, xCenter - width/2, yCenter - height/2, width, height);
      ctx.restore();
    }
  }

  drawArmyLabel(ctx, field, xCenter, yCenter) {
    const unitData = this.getUnitRenderData(field);
    if (unitData) {
       const { height } = unitData;

       // Position: Above the head
       const labelY = yCenter - (height / 2) - 10;
       
       const count = field.army.count;
       const morale = field.army.morale;
       
       ctx.font = 'bold 12px "Roboto Condensed", sans-serif';
       
       const text = `${count} | ${morale}`;
       const textWidth = ctx.measureText(text).width;
       const padding = 6;
       const boxWidth = textWidth + padding * 2;
       const boxHeight = 18;
       
       // Faction-tinted Pill
       const partyColorsRGB = [
          "255, 0, 0",      // Red
          "255, 0, 255",    // Magenta
          "0, 187, 255",    // Cyan
          "0, 255, 0"       // Green
       ];
       let rgb = partyColorsRGB[field.army.party] || "0,0,0";

       ctx.beginPath();
       if (ctx.roundRect) {
         ctx.roundRect(xCenter - boxWidth/2, labelY - boxHeight/2, boxWidth, boxHeight, 8);
       } else {
         ctx.rect(xCenter - boxWidth/2, labelY - boxHeight/2, boxWidth, boxHeight);
       }
       // Tinted background (Dimmer and more transparent)
       ctx.fillStyle = `rgba(${rgb}, 0.5)`;
       ctx.fill();
       ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
       ctx.lineWidth = 1;
       ctx.stroke();
       
       // Draw Text
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillStyle = 'white';
       ctx.fillText(text, xCenter, labelY);
       
       // Reset
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
          
          if (yPos < 15) {
             ctx.textBaseline = 'top';
             yPos = yCenter + 20; 
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
