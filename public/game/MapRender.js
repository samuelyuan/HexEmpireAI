import { Config } from './Config.js';
import { Utils, Random } from './Utils.js';

export class MapRender {
  constructor() {
    this.scratchCanvas = document.createElement('canvas');
    this.images = null;
    this.cachedEstates = null;
    this.lastState = null;
  }

  drawMap(state, images, cursorPos) {
    if (this.lastState !== state) {
        this.cacheEstates(state);
        this.lastState = state;
    }

    this.images = images;
    const canvas = document.getElementById('map');
    const ctx = canvas.getContext('2d');

    // Scale context for HiDPI
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear
    ctx.clearRect(0, 0, state.pixelWidth, state.pixelHeight);
    
    // 1. Static Background (Grass/Dirt)
    if (state.backgroundCanvas) {
        ctx.drawImage(state.backgroundCanvas, 0, 0, state.pixelWidth, state.pixelHeight);
    }

    // 2. Sea Background (Water/Shoreline)
    if (state.seaCanvas) {
        ctx.shadowColor = Config.COLORS.SHADOW_SAND;
        ctx.shadowBlur = 40; 
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.drawImage(state.seaCanvas, 0, 0, state.pixelWidth, state.pixelHeight);
        
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
    }

    // 3. Dynamic Elements (Hex Tints, Grid, Cities)
    this.drawGridAndTerritory(ctx, state);

    // 4. Borders
    this.drawTerritoryBorders(ctx, state);

    // 5. Units
    this.drawUnits(ctx, state);
    
    // 6. Labels (Names & Stats)
    this.drawLabels(ctx, state, cursorPos);
  }

  drawUnits(ctx, state) {
    const armies = Object.values(state.armies);
    // Sort by Y for correct occlusion
    armies.sort((a, b) => {
        const ay = a.visual ? a.visual.y : a.field._y;
        const by = b.visual ? b.visual.y : b.field._y;
        return ay - by;
    });

    for (const army of armies) {
         this.drawArmyUnit(ctx, army, state);
    }
  }

  cacheEstates(state) {
      this.cachedEstates = [];
      for (let x = 0; x < state.width; x++) {
          for (let y = 0; y < state.height; y++) {
              const field = state.getField(x, y);
              if (field.estate) {
                  this.cachedEstates.push(field);
              }
          }
      }
  }

  drawGridAndTerritory(ctx, state) {
     for (let x = 0; x < state.width; x++) {
      for (let y = 0; y < state.height; y++) {
        const field = state.getField(x, y);
        const xCenter = field._x;
        const yCenter = field._y;

        // Movable Unit Highlight (Yellow Hex)
        let drawn = false;
        if (state.turnParty === state.humanPlayerId && field.army && !field.army.moved && field.army.party === state.humanPlayerId) {
             this.drawHexTile(ctx, xCenter, yCenter, "rgba(255, 255, 0, 0.5)");
             drawn = true;
        }

        // Territory Tint
        if (!drawn && field.party !== -1) {
            const rgb = Config.COLORS.PARTY_RGB[field.party] || "0,0,0";
            let alpha = 0.01;
            if (field.party === state.humanPlayerId) {
                alpha = 0.25; 
            }
            this.drawHexTile(ctx, xCenter, yCenter, `rgba(${rgb}, ${alpha})`);
        }

        // Grid Outline
        this.drawHexOutline(ctx, xCenter, yCenter, "rgba(0,0,0,0.2)", 0.5);

        // Cities/Ports
        if (field.estate === "town") {
          const isCapital = field.capital >= 0;
          const cityImg = isCapital ? this.images["capital" + field.capital].img : this.images.city.img;
          const w = 32;
          const h = 32;
          
          if (!field.army) {
            ctx.drawImage(cityImg, xCenter - (w / 2), yCenter - (h / 2), w, h);
          } else {
            ctx.save();
            ctx.translate(xCenter - (w / 2) + 17, yCenter - (h / 2) - 5);
            ctx.scale(0.9, 0.9);
            ctx.drawImage(cityImg, 0, 0, w, h);
            ctx.restore();
          }
        } else if (field.estate === "port") {
          const portImg = this.images.port.img;
          const w = 32;
          const h = 32;
          
          if (!field.army) {
            ctx.drawImage(portImg, xCenter - (w / 2), yCenter - (h / 2), w, h);
          } else {
            ctx.save();
            ctx.translate(xCenter - (w / 2) + 25, yCenter - (h / 2) - 5);
            ctx.scale(0.5, 0.5);
            ctx.drawImage(portImg, 0, 0, w, h);
            ctx.restore();
          }
        }
      }
    }
  }

  drawTerritoryBorders(ctx, state) {
    const edgeMap = [3, 2, 1, 0, 5, 4]; // Neighbour index mapping for shared edges
    
    for (let x = 0; x < state.width; x++) {
      for (let y = 0; y < state.height; y++) {
        const field = state.getField(x, y);
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

        const rgb = Config.COLORS.PARTY_RGB[field.party] || "0,0,0";
        let alphaStart = 0.6;
        let alphaLine = 0.8;
        
        if (field.party === state.humanPlayerId) {
            alphaStart = 0.8; 
            alphaLine = 1.0; 
        }

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

  getUnitRenderData(army) {
    if (!army) return null;
    const field = army.field;
    let type = 'infantry';
    
    if (field.type === 'water') {
        type = 'warship';
    } else if (army.count >= Config.UNITS.THRESHOLD.TANK) {
        type = 'tank';
    } else if (army.count >= Config.UNITS.THRESHOLD.ARTILLERY) {
        type = 'artillery';
    }
    
    const img = this.images[type].img;
    const scale = Config.UNITS.SCALE[type.toUpperCase()] || 0.1;
    
    return {
        img: img,
        width: img.width * scale,
        height: img.height * scale
    };
  }

  drawArmyUnit(ctx, army, state) {
    const field = army.field;
    // GSAP visual position or fallback to field position
    let xCenter = army.visual ? army.visual.x : field._x;
    let yCenter = army.visual ? army.visual.y : field._y;

    const unitData = this.getUnitRenderData(army);
    if (!unitData) return;
    
    const { img: unitImg, width, height } = unitData;
    const rgb = Config.COLORS.PARTY_RGB[army.party] || "0,0,0";

    const scaleFactor = 2; 
    const sWidth = width * scaleFactor;
    const sHeight = height * scaleFactor;

    if (!this.scratchCanvas) this.scratchCanvas = document.createElement('canvas');
    if (this.scratchCanvas.width < sWidth || this.scratchCanvas.height < sHeight) {
        this.scratchCanvas.width = sWidth;
        this.scratchCanvas.height = sHeight;
    }
    const sCtx = this.scratchCanvas.getContext('2d');
    sCtx.clearRect(0, 0, sWidth, sHeight);

    sCtx.imageSmoothingEnabled = true;
    sCtx.imageSmoothingQuality = 'high';
    sCtx.drawImage(unitImg, 0, 0, sWidth, sHeight);
    
    ctx.save();
    ctx.shadowColor = `rgba(${rgb}, 0.8)`;
    ctx.shadowBlur = 15;
    ctx.drawImage(this.scratchCanvas, 0, 0, sWidth, sHeight, xCenter - width/2, yCenter - height/2, width, height);
    ctx.restore();
  }

  drawLabels(ctx, state, cursorPos) {
     const isGameRunning = state.humanPlayerId !== -1;
     this.drawTownNames(ctx, state, cursorPos, isGameRunning);

     const armies = Object.values(state.armies);
     for (const army of armies) {
         this.drawArmyLabel(ctx, army, cursorPos, isGameRunning);
     }
  }

  getOpacity(x, y, cursorPos, isGameRunning) {
      if (!isGameRunning) return 1.0;
      if (!cursorPos) return 0.0;
      
      const dx = x - cursorPos.x;
      const dy = y - cursorPos.y;
      const distSq = dx*dx + dy*dy;
      const MAX_DIST = 250;
      const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

      if (distSq > MAX_DIST_SQ) return 0.0;

      const dist = Math.sqrt(distSq);
      let alpha = 1 - (dist / MAX_DIST);
      if (alpha < 0) alpha = 0;
      return alpha;
  }

  drawArmyLabel(ctx, army, cursorPos, isGameRunning) {
    const field = army.field;
    let xCenter = army.visual ? army.visual.x : field._x;
    let yCenter = army.visual ? army.visual.y : field._y;

    const alpha = this.getOpacity(xCenter, yCenter, cursorPos, isGameRunning);
    if (alpha <= 0) return;

    // Center label on unit
    const labelY = yCenter;
    
    const count = army.count;
    const morale = army.morale;
    
    ctx.font = 'bold 12px "Roboto Condensed", sans-serif';
    const text = `${count} | ${morale}`;
    const textWidth = ctx.measureText(text).width;
    const padding = 6;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = 18;
    
    const rgb = Config.COLORS.PARTY_RGB[army.party] || "0,0,0";

    // Box
    ctx.save();
    ctx.globalAlpha = alpha;
    
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(xCenter - boxWidth/2, labelY - boxHeight/2, boxWidth, boxHeight, 8);
    } else {
      ctx.rect(xCenter - boxWidth/2, labelY - boxHeight/2, boxWidth, boxHeight);
    }
    // Background alpha is combined with globalAlpha
    ctx.fillStyle = `rgba(${rgb}, 0.5)`; 
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(text, xCenter, labelY);
    
    ctx.restore(); // Restore globalAlpha
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  drawTownNames(ctx, state, cursorPos, isGameRunning) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 12px "Roboto Condensed", sans-serif';
    ctx.lineWidth = 3;

    const estates = this.cachedEstates || [];

    for (const town of estates) {
        // Double check estate still exists (should be static, but safety)
        if (town.estate === "town" || town.estate === "port") {
            const alpha = this.getOpacity(town._x, town._y, cursorPos, isGameRunning);
            if (alpha <= 0) continue;

            let yPos = town._y - 17;
            if (yPos < 15) {
                 ctx.textBaseline = 'top';
                 yPos = town._y + 20; 
            } else {
                 ctx.textBaseline = 'bottom';
            }

            ctx.save();
            ctx.globalAlpha = alpha;

            ctx.strokeStyle = 'black';
            ctx.strokeText(town.town_name, town._x, yPos);
            ctx.fillStyle = 'white';
            ctx.fillText(town.town_name, town._x, yPos);
            
            ctx.restore();
        }
    }
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  drawHexOutline(ctx, xCenter, yCenter, borderColor, borderWidth) {
    ctx.beginPath();
    ctx.moveTo(xCenter - 12.5, yCenter - 20);
    ctx.lineTo(xCenter - 24, yCenter - 0);
    ctx.lineTo(xCenter - 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 24, yCenter + 0);
    ctx.lineTo(xCenter + 12.5, yCenter - 20);
    ctx.closePath();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
  }

  drawHexTile(ctx, xCenter, yCenter, color) {
    ctx.beginPath();
    ctx.moveTo(xCenter - 12.5, yCenter - 20);
    ctx.lineTo(xCenter - 25, yCenter - 0);
    ctx.lineTo(xCenter - 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 12.5, yCenter + 20);
    ctx.lineTo(xCenter + 25, yCenter + 0);
    ctx.lineTo(xCenter + 12.5, yCenter - 20);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 0.1;
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
  
  drawValidMoves(fields, state) {
    const ctx = document.getElementById('map').getContext('2d');
    for (const field of fields) {
      let color = "rgba(255, 255, 255, 0.4)"; 
      if (field.army) {
        if (field.army.party !== state.humanPlayerId) {
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

  // --- Static Layer Generation ---

  renderStaticBackground(state, images, random) {
      const canvas = document.createElement('canvas');
      canvas.width = state.pixelWidth * 2;
      canvas.height = state.pixelHeight * 2;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Base Fill
      ctx.fillStyle = "#4b5e28"; 
      ctx.fillRect(0, 0, state.pixelWidth, state.pixelHeight);

      // Texture Splatting (7x4 grid logic from original)
      // We can use a simpler approach or stick to the original "Big Tiles" approach
      // Original logic was: 7x4 grid of 125px tiles.
      for (let x = 0; x < 7; x++) {
          for (let y = 0; y < 4; y++) {
             // Random selection
             // Note: using local random for visuals
             const dirtIdx = random.next(6) + 1;
             const grassIdx = random.next(6) + 1;
             const grassImg = images["grassBg" + grassIdx].img;
             
             // Random Transforms
             const flipH = random.next(2);
             const flipV = random.next(2);
             const rotateDeg = random.next(4) * 90;
             
             const destX = (x * 125) - 15;
             const destY = (y * 125) - 15;
             const w = 155;
             const h = 155;

             ctx.save();
             ctx.translate(destX + w/2, destY + h/2);
             ctx.rotate(Utils.degToRad(rotateDeg));
             ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
             ctx.translate(-w/2, -h/2);
             
             ctx.drawImage(grassImg, 0, 0, w, h);
             ctx.restore();
          }
      }
      
      state.backgroundCanvas = canvas;
  }

  renderSeaBackground(state, images, random) {
      const canvas = document.createElement('canvas');
      canvas.width = state.pixelWidth * 2;
      canvas.height = state.pixelHeight * 2;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      
      for (let x = 0; x < state.width; x++) {
          for (let y = 0; y < state.height; y++) {
              const field = state.getField(x, y);
              if (field.type === 'water') {
                  const seaIdx = random.next(6) + 1;
                  const seaImg = images["seaBg" + seaIdx].img;
                  
                  const flipH = random.next(2);
                  const flipV = random.next(2);
                  const rotateDeg = random.next(2) * 180;
                  
                  const w = 61;
                  const h = 56;
                  const destX = field._x; // Center
                  const destY = field._y; // Center
                  
                  ctx.save();
                  ctx.translate(destX, destY);
                  ctx.rotate(Utils.degToRad(rotateDeg));
                  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
                  ctx.drawImage(seaImg, -w/2, -h/2, w, h);
                  ctx.restore();
              }
          }
      }
      
      state.seaCanvas = canvas;
  }
}
