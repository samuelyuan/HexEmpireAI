import { Pathfinder } from './Pathfinder.js'

class Map {
  constructor(mapNumber) {
    this.towns = this.generateAllTowns();
    this.mapNumber = mapNumber;
    if (this.mapNumber < 0) {
      this.mapNumber = Math.floor(Math.random() * 999999);
    }
    this.resetGameLog();
    this.updateGameLog("Map #" + this.mapNumber);
    this.setSeed(this.mapNumber);

    this.pathfinder = new Pathfinder();
  }

  setSeed(seed) {
    this.rnd_seed = seed;
  }

  generateAllTowns() {
    return [
      "Abu Dhabi","Abuja","Accra","Addis Ababa","Algiers","Amman","Amsterdam","Ankara","Antananarivo","Apia","Ashgabat","Asmara","Astana","Asunción","Athens",
      "Baghdad","Baku","Bamako","Bangkok","Bangui","Banjul","Barcelona","Basseterre","Beijing","Beirut","Belgrade","Belmopan","Berlin","Bern","Bishkek","Bissau","Bogotá","Brasília","Bratislava","Brazzaville","Bridgetown","Brussels","Bucharest","Budapest","Buenos Aires","Bujumbura",
      "Cairo","Canberra","Cape Town","Caracas","Castries","Chicago","Chisinau","Conakry","Copenhagen","Cotonou",
      "Dakar","Dallas","Damascus","Dhaka","Dili","Djibouti","Dodoma","Doha","Dublin","Dushanbe","Delhi",
      "Freetown","Funafuti",
      "Gabarone","Georgetown","Guatemala City",
      "Hague","Hanoi","Harare","Havana","Helsinki","Honiara","Hong Kong","Houston",
      "Islamabad",
      "Jakarta","Jerusalem","Kabul","Kampala","Kathmandu","Khartoum","Kyiv","Kigali","Kingston","Kingstown","Kinshasa","Kuala Lumpur","Kuwait City",
      "La Paz","Liberville","Lilongwe","Lima","Lisbon","Ljubljana","Lobamba","Lomé","London","Luanda","Lusaka","Luxembourg",
      "Madrid","Majuro","Malé","Managua","Manama","Manila","Maputo","Maseru","Mbabane","Melekeok","Mexico City","Minsk","Mogadishu","Monaco","Monrovia","Montevideo","Moroni","Moscow","Munich","Muscat",
      "Nairobi","Nassau","Naypyidaw","N\'Djamena","New Delhi","Niamey","Nicosia","Nouakchott","Nuku\'alofa","Nuuk",
      "Oslo","Ottawa","Ouagadougou",
      "Palikir","Panama City","Paramaribo","Paris","Philadelphia","Phnom Penh","Phoenix","Podgorica","Prague","Praia","Pretoria","Pyongyang",
      "Quito",
      "Rabat","Ramallah","Reykjavík","Riga","Riyadh","Rome","Roseau",
      "San José","San Marino","San Salvador","Sanaá","Santiago","Santo Domingo","Sao Tomé","Sarajevo","Seoul","Seville","Singapore","Skopje","Sofia","South Tarawa","St. George\'s","St. John\'s","Stockholm","Sucre","Suva",
      "Taipei","Tallinn","Tashkent","Tbilisi","Tegucigalpa","Teheran","Thimphu","Tirana","Tokyo","Tripoli","Tunis",
      "Ulaanbaatar",
      "Vaduz","Valencia","Valletta","Victoria","Vienna","Vientiane","Vilnius",
      "Warsaw","Washington","Wellington","Windhoek",
      "Yamoussoukro","Yaoundé","Yerevan",
      "Zagreb","Zaragoza","Zielona Góra",
      "Poznań","Wrocław","Gdańsk","Szczecin","Łódź","Białystok","Toruń","St. Petersburg","Turku","Örebro","Chengdu","Wuppertal","Frankfurt","Düsseldorf","Essen","Duisburg","Magdeburg",
      "Bonn","Brno","Tours","Bordeaux","Nice","Lyon","Stara Zagora","Milan","Bologna","Sydney","Venice","New York","Graz","Birmingham","Naples","Cologne","Turin","Marseille","Leeds",
      "Kraków","Palermo","Genoa","Stuttgart","Dortmund","Rotterdam","Glasgow","Málaga","Bremen","Sheffield","Antwerp","Plovdiv","Thessaloniki","Kaunas","Lublin","Varna","Ostrava","Iaşi",
      "Katowice","Cluj-Napoca","Timişoara","Constanţa","Pskov","Vitebsk","Arkhangelsk","Novosibirsk","Samara","Omsk","Chelyabinsk","Ufa","Volgograd","Perm","Kharkiv","Odessa","Donetsk",
      "Dnipropetrovsk","Los Angeles","Detroit","Indianapolis","San Francisco","Atlanta","Austin","Vermont","Toronto","Montreal","Vancouver","Gdynia","Edmonton"
    ];
  }

  pasteBitmap(imageData, image, targetCanvas) {
    const ctx = targetCanvas.getContext('2d');

    const positionX = imageData.destX;
    const positionY = imageData.destY;
    const rotationDegrees = imageData.rotationDegrees;
    const horizontalFlip = imageData.horizontalFlip;
    const verticalFlip = imageData.verticalFlip;
    this.transformAndDrawImage(ctx, image, horizontalFlip, verticalFlip, rotationDegrees, positionX, positionY);
  }

  transformAndDrawImage(ctx, image, horizontalFlip, verticalFlip, rotationDegrees, positionX, positionY) {
    var angleRadians = rotationDegrees * Math.PI / 180.0;
    var width = image.width;
    var height = image.height;
    var imageCenterX = positionX + (width / 2.0);
    var imageCenterY = positionY + (height / 2.0);

    ctx.translate(imageCenterX, imageCenterY);
    // Rotate on image center
    ctx.rotate(angleRadians);

    // Flip the image
    var horizontalFlipScale, verticalFlipScale;
    if (horizontalFlip) {
      horizontalFlipScale = -1
    } else {
      horizontalFlipScale = 1;
    }
    if (verticalFlip) {
      verticalFlipScale = -1
    } else {
      verticalFlipScale = 1;
    }

    ctx.drawImage(image, -width / 2.0, -height / 2.0, width, height);

    ctx.rotate(-angleRadians);
    ctx.translate(-imageCenterX, -imageCenterY);
  }

  getField(x, y, board) {
    return board.field["f" + x + "x" + y];
  }

  getFieldXYFromScreenXY(board, screenX, screenY) {
    const fieldX = Math.floor((screenX - (board.hw_fw / 2)) / (board.hw_fw / 4 * 3)) + 1;
    var fieldY;
    if (fieldX % 2 == 0) {
      fieldY = Math.floor((screenY - (board.hw_fh / 2)) / board.hw_fh) + 1;
    } else {
      fieldY = Math.floor((screenY - board.hw_fh) /  board.hw_fh) + 1;
    }
    return {
      fieldX: fieldX,
      fieldY: fieldY,
    }
  }

  updateField(field, board) {
    if (!field.port) {
      field.port = {};
    }
    if (!field.town) {
      field.town = {};
    }
    field.port._visible = false;
    field.town._visible = false;
    switch (field.estate) {
      case "port":
        field.port._visible = true;
        break;
      case "town":
        field.town._visible = true;
    }
    function pNormal(icon) {
      icon._width = 35;
      icon._height = 35;
      icon._x = 0;
      icon._y = 0;
    }
    function pSmall(icon) {
      icon._width = 20;
      icon._height = 20;
      icon._x = 0;
      icon._y = 0;
    }
    function pSide(icon) {
      icon._width = 20;
      icon._height = 20;
      icon._x = 18;
      icon._y = -4;
    }
    if (field.army) {
      pSide(field.town);
      pSide(field.port);
    } else if (field.capital < 0) {
      pSmall(field.town);
      pNormal(field.port);
    } else {
      pNormal(field.town);
      pNormal(field.port);
    }
    var x = field.fx;
    var y = field.fy;
    if (field.party >= 0 && !board["pb" + field.party]["f" + x + "x" + y]) {
      board["pb" + field.party]["f" + x + "x" + y] = {}
      var brd = board["pb" + field.party]["f" + x + "x" + y];
      var px = x * (board.hw_fw / 4 * 3) + board.hw_fw / 2;
      var py;
      if (x % 2 == 0) {
        py = y * board.hw_fh + board.hw_fh / 2;
      } else {
        py = y * board.hw_fh + board.hw_fh;
      }
      brd._x = px;
      brd._y = py;
    }
    for (var p = 0; p < board.hw_parties_count; p++) {
      if (p != field.party || field.party < 0) {
        if (board["pb" + p]["f" + x + "x" + y]) {
          if (!board["pb" + p]["f" + x + "x" + y].removing) {
            // TODO: remove hex
          }
        }
      }
    }
  }

  rand(n) {
    this.rnd_seed = (this.rnd_seed * 9301 + 49297) % 233280;
    return Math.floor(this.rnd_seed / 233280 * n);
  }

  shuffle(arr) {
    var arrayCopy = [...arr];
    for (var index = 0; index < arrayCopy.length; index++) {
      var tmp = arrayCopy[index];
      var rn = this.rand(arrayCopy.length);

      // Swap with random index
      arrayCopy[index] = arrayCopy[rn];
      arrayCopy[rn] = tmp;
    }
    return arrayCopy;
  }

  randTown() {
    var cnr = this.rand(this.towns.length);
    var cname = this.towns[cnr];
    this.towns[cnr] = this.towns[0];
    this.towns[0] = cname;
    return this.towns.shift();
  }

  addTown(x, y, board) {
    var bitmap1Src = "images/cd_" + this.rand(6) + ".png";
    var bitmap2Src = "images/c_" + this.rand(6) + ".png";
    var flip1 = this.rand(2);
    var flip2 = this.rand(2);
    var rotateAngle = this.rand(360);
  }

  findNeighbours(field, board) {
    field.neighbours = new Array(6);
    if (field.fx % 2 == 0) {
      field.neighbours[0] = this.getField(field.fx + 1, field.fy, board);
      field.neighbours[1] = this.getField(field.fx, field.fy + 1, board);
      field.neighbours[2] = this.getField(field.fx - 1, field.fy, board);
      field.neighbours[3] = this.getField(field.fx - 1, field.fy - 1, board);
      field.neighbours[4] = this.getField(field.fx, field.fy - 1, board);
      field.neighbours[5] = this.getField(field.fx + 1, field.fy - 1, board);
    } else {
      field.neighbours[0] = this.getField(field.fx + 1, field.fy + 1, board);
      field.neighbours[1] = this.getField(field.fx, field.fy + 1, board);
      field.neighbours[2] = this.getField(field.fx - 1, field.fy + 1, board);
      field.neighbours[3] = this.getField(field.fx - 1, field.fy, board);
      field.neighbours[4] = this.getField(field.fx, field.fy - 1, board);
      field.neighbours[5] = this.getField(field.fx + 1, field.fy, board);
    }
  }

  createBackground(board) {
    board.background_1 = document.createElement('canvas');
    board.background_1.width = 800;
    board.background_1.height = 600;
    board.background_2 = document.createElement('canvas');
    board.background_2.width = 800;
    board.background_2.height = 600;

    var gridImages = new Array(6 * 4);
    for (var x = 0; x < 6; x++) {
      for (var y = 0; y < 4; y++) {
        const index = (x * 4) + y;
        gridImages[index] = {
          dirtBg: new Image(),
          grassBg: new Image(),
          destX: x * 125 - 15,
          destY: y * 125 - 15,
          horizontalFlip: -1,
          verticalFlip: -1,
          rotationDegrees: -1,
        }

        gridImages[index].dirtBg.src = "images/ld_" + (this.rand(6) + 1) + ".png";
        gridImages[index].grassBg.src = "images/l_" + (this.rand(6) + 1) + ".png";

        var flip1 = this.rand(2);
        var flip2 = this.rand(2);
        var rotateAngle = this.rand(4) * 90;
        gridImages[index].horizontalFlip = flip1;
        gridImages[index].verticalFlip = flip2;
        gridImages[index].rotationDegrees = rotateAngle;

        /*var self = this;
        gridImages[index].dirtBg.onload = function() {
          self.pasteBitmap(gridImages[index], gridImages[index].dirtBg, board.background_1);
        }
        gridImages[index].grassBg.onload = function() {
          self.pasteBitmap(gridImages[index], gridImages[index].grassBg, board.background_2);
        }*/
      }
    }
  }

  addField(x, y, board) {
    board.field["f" + x + "x" + y] = {};
    var nfield = board.field["f" + x + "x" + y];
    nfield.fx = x;
    nfield.fy = y;
    if (x == board.hw_xmax - 1 && y == board.hw_ymax - 1) {
      board.hw_top_field_depth = -1; // TODO: find a better value
    }
    var px = x * (board.hw_fw / 4 * 3) + board.hw_fw / 2;
    var py;
    if (x % 2 == 0) {
      py = y * board.hw_fh + board.hw_fh / 2;
    } else {
      py = y * board.hw_fh + board.hw_fh;
    }
    nfield._x = px;
    nfield._y = py;
    nfield.land_id = -1;
    if (x == 1 && y == 1
      || x == board.hw_xmax - 2 && y == 1
      || x == board.hw_xmax - 2 && y == board.hw_ymax - 2
      || x == 1 && y == board.hw_ymax - 2) {
      nfield.type = "land";
    } else {
      nfield.type = this.rand(10) <= 1 ? "land" : "water";
    }
    nfield.party = -1;
    nfield.capital = -1;
    nfield.n_town = false;
    nfield.n_capital = false;
    nfield.army = null;

    nfield.profitability = [0,0,0,0];
    nfield.tmp_prof = [0,0,0,0];
    nfield.n_capital = [false,false,false,false];
    nfield.doom = 0;
    nfield.over = false;
  }

  generateMap(board) {
    this.createBackground(board);

    for (var p = 0; p < board.hw_parties_count; p++) {
      if (!board["pb" + p]) {
        // Used to color occupied tiles
        board["pb" + p] = {};
      }
    }
    board.background_sea = document.createElement('canvas');
    board.background_sea.width = 800;
    board.background_sea.height = 600;

    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        this.addField(x, y, board);
      }
    }

    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        var field = this.getField(x, y, board);
        this.findNeighbours(field, board);
      }
    }

    this.setLandFields(board);
    this.generateHwLands(board);
    this.generatePartyCapitals(board);
    this.generateTowns(board);
    board.hw_towns = this.shuffle(board.hw_towns);
    this.generatePorts(board);

    this.drawWaterAndPorts(board);
    this.assignTownNames(board);
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
        const field = this.getField(x, y, board);
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

  generatePartyCapitals(board) {
    var cp = 0;
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        if ((x == 1 && y == 1)
          || (x == board.hw_xmax - 2 && y == 1)
          || (x == board.hw_xmax - 2 && y == board.hw_ymax - 2)
          || (x == 1 && y == board.hw_ymax - 2)) {
          this.getField(x, y, board).estate = "town";
          board.hw_towns.push(this.getField(x, y, board));
          this.getField(x, y, board).capital = cp;
          board.hw_parties_capitals[cp] = this.getField(x, y, board);
          this.annexLand(cp, this.getField(x, y, board), board, true);
          cp++;
        }
      }
    }
  }

  setLandFields(board) {
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        var field = this.getField(x, y, board);
        if (field.type == "water") {
          var land = 0;
          for (var n = 0; n < 6; n++) {
            if (!field.neighbours[n]) {
              continue;
            }
            if (field.neighbours[n].type == "land") {
              land++;
            }
          }
          if (land >= 1) {
            this.getField(x, y, board).tl = true;
          }
        }
      }
    }

    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        if (this.getField(x, y, board).tl) {
          this.getField(x, y, board).type = "land";
        }
      }
    }

    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        var field = this.getField(x, y, board);
        if (field.type == "water") {
          var water = 0;
          for (var n = 0; n < 6; n++) {
            if (!field.neighbours[n]) {
              continue;
            }
            if (field.neighbours[n].type == "water") {
              water++;
            }
          }
          if (!water) {
            this.getField(x, y, board).type = "land";
          }
        }
      }
    }
  }

  generateHwLands(board) {
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        if (this.getField(x, y, board).type == "land") {
          board.hw_land = board.hw_land + 1;
        }
      }
    }

    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        if (this.getField(x, y, board).type == "land" && this.getField(x, y, board).land_id < 0) {
          var clid = board.hw_lands.length;
          board.hw_lands.push(new Array());
          board.hw_lands[clid].push(this.getField(x, y, board));
          this.getField(x, y, board).land_id = clid;
          var add_ngb2l = function(field, lid) {
            var newf = 0;
            for (var n = 0; n < 6; n++) {
              if (field.neighbours[n] && field.neighbours[n].type == "land" && field.neighbours[n].land_id < 0) {
                board.hw_lands[lid].push(field.neighbours[n]);
                field.neighbours[n].land_id = lid;
                newf++;
              }
            }
            return newf;
          };
          var cc = 0;
          var cnr = cc;
          while (cc >= cnr) {
            cc = cc + add_ngb2l(board.hw_lands[clid][cnr],clid);
            cnr++;
          }
        }
      }
    }
  }

  generateTowns(board) {
    for (var landNum = 0; landNum < board.hw_lands.length; landNum++) {
      var townCount = Math.floor(board.hw_lands[landNum].length / 10) + 1;
      for (var townNum = 0; townNum < townCount; townNum++) {
        var created = false;
        var attempts = 0;
        while (!created) {
          attempts++;
          if (attempts > 10) {
            created = true;
          }
          var nt = this.rand(board.hw_lands[landNum].length);
          if (!board.hw_lands[landNum][nt].estate) {
            var ok = true;
            for (var n = 0; n < 6; n++) {
              var field = board.hw_lands[landNum][nt];
              if (!field.neighbours[n]) {
                continue;
              }
              if (field.neighbours[n].type == "water" || field.neighbours[n].estate) {
                ok = false;
              }
            }
            if (ok) {
              board.hw_lands[landNum][nt].estate = "town";
              board.hw_towns.push(board.hw_lands[landNum][nt]);
              created = true;
            }
          }
        }
      }
    }
  }

  generatePorts(board) {
    var portNum = 0;
    var pn = 0;
    for (var town = 0; town < board.hw_towns.length - 1; town++) {
      var path = this.pathfinder.findPath(board.hw_towns[town], board.hw_towns[town + 1], ["town"], true);
      if (path == null || path.length > portNum) {
        path = this.pathfinder.findPath(board.hw_towns[town], board.hw_towns[town + 1], ["town"], false);
        pn++;
      }
      for (var pathIndex = 1; pathIndex < path.length - 1; pathIndex++) {
        if (path[pathIndex].type == "land" && path[pathIndex + 1].type == "water") {
          path[pathIndex].estate = "port";
          portNum++;
        }
        if (path[pathIndex].type == "land" && path[pathIndex - 1].type == "water") {
          path[pathIndex].estate = "port";
          portNum++;
        }
      }
    }
  }

  drawWaterAndPorts(board) {
    var portImageNum = [2,1,2,2,1,2];
    var flipX = [1,0,0,0,0,1];
    var flipY = [1,1,1,0,0,0];
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        if (this.getField(x, y, board).type == "water") {
          const waterImgSrc = "images/m_" + this.rand(6) + ".png";
          const flip1 = this.rand(2);
          const flip2 = this.rand(2);
          const rotateAngle = this.rand(2) * 180;
        }
      }
    }
  }

  assignTownNames(board) {
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        this.updateField(this.getField(x, y, board), board);
        switch (this.getField(x, y, board).estate) {
          case "town":
            this.addTown(x, y, board);
            this.getField(x, y, board).town_name = this.randTown();
            break;
          case "port":
            this.addTown(x, y, board);
            this.getField(x, y, board).town_name = this.randTown();
            break;
          default:
            var field = this.getField(x, y, board);
            if (!field.town_sign) {
              field.town_sign = {};
            }
            field.town_sign._visible = false;
        }
      }
    }
  }

  unitsSpawn(party, board) {
    var ucount = board.hw_parties_lands[party].length + board.hw_parties_ports[party].length * 5;
    ucount = Math.floor(ucount / board.hw_parties_towns[party].length);
    for (var partyIndex = 0; partyIndex < board.hw_parties_count; partyIndex++) {
      if (board.hw_parties_capitals[partyIndex].party == party) {
        var morale = board.hw_parties_morale[party];
        if (board.hw_parties_capitals[partyIndex].army) {
          morale = board.hw_parties_capitals[partyIndex].army.morale;
        }
        this.joinUnits(5, morale, party, board, null, board.hw_parties_capitals[partyIndex]);
      }
    }
    for (var townIndex = 0; townIndex < board.hw_parties_towns[party].length; townIndex++) {
      var morale = board.hw_parties_morale[party];
      if (board.hw_parties_towns[party][townIndex].army) {
        morale = board.hw_parties_towns[party][townIndex].army.morale;
      }
      this.joinUnits(5 + ucount, morale, party, board, null, board.hw_parties_towns[party][townIndex]);
    }
  }

  joinUnits(count, morale, party, board, army, field) {
    if (!army) {
      army = field.army;
    }
    if (!field) {
      field = army.field;
    }
    if (!army) {
      this.updateArmy(count, morale, party, board, army, field);
    } else {
      this.updateArmy(army.count + count, Math.floor((army.count * army.morale + count * morale) / (army.count + count)), party, board, army, field);
    }
  }

  updateArmy(count, morale, party, board, army, field) {
    if (!army) {
      army = field.army;
    }
    if (!field) {
      field = army.field;
    }
    if (!board) {
      throw 'Board is undefined';
    }
    if (!army) {
      if (count <= 0) {
        return;
      }
      board.hw_lAID = board.hw_lAID + 1;
      var alevel = -1; // TODO: find better value
      var aname = "army" + board.hw_lAID;
      board.armies[aname] = {};
      board.hw_aTL = alevel;
      board.armies[aname]._x = field._x;
      board.armies[aname]._y = field._y;
      board.armies[aname].field = field;
      board.armies[aname].party = party;
      board.armies[aname].remove_time = -1;
      board.armies[aname].exploding = null;
      board.armies[aname].remove = false;
      board.armies[aname].waiting = null;
      board.armies[aname].is_waiting = false;
      field.army = board.armies[aname];
      army = field.army;
      // Need to add to avoid undefined
      army.moved = false;
    } else if (count <= 0) {
      this.deleteArmy(army);
      return;
    }
    army.count = count >= 100 ? 99 : count;
    if (morale < 0) {
      morale = 0;
    }
    army.morale = morale >= army.count ? army.count : morale;
    army.party = party;
  }

  calcAIHelpers(board) {
    for (var partyIndex = 0; partyIndex < board.hw_parties_count; partyIndex++) {
      for (var x = 0; x < board.hw_xmax; x++) {
        for (var y = 0; y < board.hw_ymax; y++) {
          var field = this.getField(x, y, board);
          field.profitability[partyIndex] = -this.pathfinder.findPath(field, board.hw_parties_capitals[partyIndex], [], true).length;
          var neighbours = this.pathfinder.getFurtherNeighbours(field);
          neighbours.push(field);
          for (var n = 0; n < neighbours.length; n++) {
            if (!neighbours[n]) {
              continue;
            }
            if (neighbours[n].capital == partyIndex) {
              field.n_capital[partyIndex] = true;
            }
            if (neighbours[n].estate == "town") {
              field.n_town = true;
            }
          }
        }
      }
    }
  }

  cleanupTurn(board) {
    var partyArmies = board.hw_parties_armies[board.turn_party];
    for (var armyIndex = 0; armyIndex < partyArmies.length; armyIndex++) {
      if (partyArmies[armyIndex].moved) {
        partyArmies[armyIndex].moved = false;
      } else {
        partyArmies[armyIndex].morale--;
      }
    }
  }

  updateBoard(board) {
    this.listArmies(board);
    for (var p = 0; p < board.hw_parties_count; p++) {
      this.checkPartyState(p, board);
    }
    board.hw_parties_towns = [new Array(), new Array(), new Array(), new Array()];
    board.hw_parties_ports = [new Array(), new Array(), new Array(), new Array()];
    board.hw_parties_lands = [new Array(), new Array(), new Array(), new Array()];
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        var field = this.getField(x, y, board);
        var party = field.party;
        this.updateField(field, board);

        const targetParty = this.getFieldParty(field);
        if (board.hw_parties_status[targetParty] == 0) {
          if (board.hw_parties_capitals[field.party]) {
            field.party = board.hw_parties_capitals[field.party].party;
            if (field.army) {
              this.setExplosion(field.army, field.army, null);
              this.updateGameLog("Disbanded " + board.hw_parties_names[targetParty] + " army at (" + field.fx + ", " + field.fy + ")");
            }
          }
        }
        if (party >= 0) {
          if (field.estate == "town") {
            board.hw_parties_towns[party].push(field);
          } else if (field.estate == "port") {
            board.hw_parties_ports[party].push(field);
          } else {
            board.hw_parties_lands[party].push(field);
          }
        }
      }
    }
    for (var partyIndex = 0; partyIndex < board.hw_parties_count; partyIndex++) {
      var morale = 0;
      if (board.hw_parties_armies[partyIndex].length > 0) {
        for (var armyIndex = 0; armyIndex < board.hw_parties_armies[partyIndex].length; armyIndex++) {
          if (board.hw_parties_armies[partyIndex][armyIndex].morale < Math.floor(board.hw_parties_total_count[partyIndex] / 50)) {
            board.hw_parties_armies[partyIndex][armyIndex].morale = Math.floor(board.hw_parties_total_count[partyIndex] / 50);
            // Morale can't be greater than the number of units
            if (board.hw_parties_armies[partyIndex][armyIndex].morale > board.hw_parties_armies[partyIndex][armyIndex].count) {
              board.hw_parties_armies[partyIndex][armyIndex].morale = board.hw_parties_armies[partyIndex][armyIndex].count;
            }
          }
          morale = morale + board.hw_parties_armies[partyIndex][armyIndex].morale;
        }
        morale = morale / board.hw_parties_armies[partyIndex].length;
      } else {
        morale = 10;
      }
      board.hw_parties_morale[partyIndex] = Math.floor(morale);
    }
    var humanTotalPower = board.hw_parties_morale[board.human] + board.hw_parties_total_count[board.human];
    var humanCondition = 1;
    for (var partyIndex = 0; partyIndex < board.hw_parties_count; partyIndex++) {
      if (partyIndex != board.human && board.hw_parties_status[partyIndex]) {
        if (humanTotalPower < 0.3 * (board.hw_parties_morale[partyIndex] + board.hw_parties_total_count[partyIndex])) {
          humanCondition = 3;
        } else if (humanCondition < 3
          && humanTotalPower < 0.6 * (board.hw_parties_morale[partyIndex] + board.hw_parties_total_count[partyIndex])) {
          humanCondition = 2;
        } else if (board.hw_parties_provinces_cp[board.human]
            && board.hw_parties_provinces_cp[board.human].length >= 2
            && humanTotalPower > 2 * (board.hw_parties_morale[partyIndex] + board.hw_parties_total_count[partyIndex])) {
          humanCondition = 0;
        }
      }
    }
    board.human_condition = humanCondition;
  }

  getFieldParty(field) {
    if (field.army) {
      return field.army.party;
    }
    return field.party;
  }

  listArmies(board) {
    for (var p = 0; p < board.hw_parties_count; p++) {
      board.hw_parties_armies[p] = [];
      board.hw_parties_total_count[p] = 0;
      board.hw_parties_total_power[p] = 0;
    }
    for (var x = 0; x < board.hw_xmax; x++) {
      for (var y = 0; y < board.hw_ymax; y++) {
        if (this.getField(x, y, board).army && this.getField(x, y, board).army.remove_time < 0) {
          const armyParty = this.getField(x, y, board).army.party;
          board.hw_parties_armies[armyParty].push(this.getField(x, y, board).army);
          board.hw_parties_total_count[armyParty] += this.getField(x, y, board).army.count;
          board.hw_parties_total_power[armyParty] += this.getField(x, y, board).army.count + this.getField(x, y, board).army.morale;
        }
      }
    }
  }

  checkPartyState(party, board) {
    if (board.hw_init) {
      board.hw_parties_status[party] = -1;
      return;
    }
    var otherCapitals = [];
    board.hw_parties_provinces_cp[party] = null;
    for (var p = 0; p < board.hw_parties_count; p++) {
      if (board.hw_parties_capitals[p].party == party
        && p != party
        && !board.hw_parties_armies[p].length
      ) {
        otherCapitals.push(board.hw_parties_capitals[p]);
      }
    }
    if (board.hw_parties_capitals[party].party != party) {
      // Original party no longer controls capital
      board.hw_parties_status[party] = 0;
    } else if (otherCapitals.length > 0) {
      // Controls own capital and other capitals
      board.hw_parties_status[party] = 1 + otherCapitals.length;
      board.hw_parties_provinces_cp[party] = otherCapitals;
    } else {
      // Only controls own capital
      board.hw_parties_status[party] = 1;
    }
  }

  isVictory(board) {
    for (var p = 0; p < board.hw_parties_count; p++) {
      if (board.hw_parties_provinces_cp[p] &&
        board.hw_parties_provinces_cp[p].length == board.hw_parties_count - 1) {
        return true;
      }
    }
    return false;
  }

  annexLand(party, field, board, startup) {
    var self = this;
    function moraleEarned(party, field) {
      if (field.capital >= 0) {
        if (board.human == party
          && board.hw_parties_provinces_cp[party]
          && board.hw_parties_provinces_cp[party].length >= 2) {
          this.updateBoard(board);
          board.win = true;
        }
        if (field.capital == field.party) {
          if (board.human == party) {
            board.subject = field;
            board.news = "province_conquered";
          }
          self.updateGameLog(board.hw_parties_names[party] + " conquered " + board.hw_parties_names[field.party]);
          return [50, 30];
        }
        if (board.human == party) {
          board.subject = field;
          board.news = "town_captured";
          self.updateGameLog(board.hw_parties_names[party] + " captured former " + board.hw_parties_names[field.party] +
            + " capital city from " + board.hw_parties_names[field.party]);
        }
        return [30, 20];
      }
      if (field.estate == "town") {
        if (/*board.human == party && */ (!board.subject || board.subject.capital < 0)) {
          board.subject = field;
          if (field.party >= 0) {
            board.news = "town_captured";
            self.updateGameLog(board.hw_parties_names[party] + " captured town " + field.town_name + " from " + board.hw_parties_names[field.party]);
          } else {
            board.news = "town_annexed";
            self.updateGameLog(board.hw_parties_names[party] + " annexed town " + field.town_name);
          }
        }
        return [10, 10];
      }
      if (field.estate == "port") {
        if (/*board.human == party &&*/ (!board.subject || board.subject.estate != "town")) {
          board.subject = field;
          if (field.party >= 0) {
            board.news = "town_captured";
            self.updateGameLog(board.hw_parties_names[party] + " captured port " + field.town_name + " from " + board.hw_parties_names[field.party]);
          } else {
            board.news = "town_annexed";
            self.updateGameLog(board.hw_parties_names[party] + " annexed port " + field.town_name);
          }
        }
        return [5, 5];
      }
      if (field.type == "land") {
         return [1, 0];
      }
      return [0, 0];
   }
    function moraleLost(party, field) {
      if (field.capital == party) {
        if (board.human == party) {
          updateBoard(board);
          board.win = false;
        }
      } else {
        if (field.capital >= 0) {
          if (board.human == party) {
            board.subject = field;
            board.news = "town_lost";
          }
          return -30;
        }
        if (field.estate == "town") {
          if (board.human == party && (!board.subject || board.subject.capital < 0)) {
            board.subject = field;
            board.news = "town_lost";
          }
          return -10;
        }
        if (field.estate == "port") {
          if (board.human == party && (!board.subject || board.subject.estate != "town")) {
            board.subject = field;
            board.news = "town_lost";
          }
          return -5;
        }
      }
      return 0;
    }

    if (!field.army && !startup) {
      return;
    }
    if (field.type == "land") {
      if (field.party >= 0 && field.party != party) {
        this.addMoraleForAll(moraleLost(field.party, field), field.party, board);
        if (field.capital >= 0
          && field.capital == field.party
          && board.hw_parties_provinces_cp[field.party]
          && board.hw_parties_provinces_cp[field.party].length) {
          // If you conquer another party that has control of capitals other than their own, liberate those capitals
          for (var capitalIndex = 0; capitalIndex < board.hw_parties_provinces_cp[field.party].length; capitalIndex++) {
            if (board.hw_parties_provinces_cp[field.party][capitalIndex].army) {
              this.setExplosion(board.hw_parties_provinces_cp[field.party][capitalIndex].army, board.hw_parties_provinces_cp[field.party][capitalIndex].army, null);
              board.hw_parties_provinces_cp[field.party][capitalIndex].army = null;
            }
            // Liberate capitals and give original owner new army
            this.updateArmy(99, 99, board.hw_parties_provinces_cp[field.party][capitalIndex].capital, board, null, board.hw_parties_provinces_cp[field.party][capitalIndex]);
            this.annexLand(board.hw_parties_provinces_cp[field.party][capitalIndex].capital, board.hw_parties_provinces_cp[field.party][capitalIndex], board, true);
          }
        }
      }
      if (!startup && field.party != party) {
        this.addMoraleForAA(moraleEarned(party,field), field.army, board);
      }
      field.party = party;
      for (var n = 0; n < 6; n++) {
        if (!field.neighbours[n]) {
          continue;
        }
        if (field.neighbours[n].type == "land"
          && !field.neighbours[n].estate
          && !field.neighbours[n].army
          && !(board.hw_peace >= 0
            && ((field.neighbours[n].party == board.hw_peace && party == board.human)
            || (party == board.hw_peace && field.neighbours[n].party == board.human)))
        ) {
            if (!startup && field.neighbours[n].party != party) {
               this.addMoraleForAA(moraleEarned(party,field.neighbours[n]), field.army, board);
            }
            field.neighbours[n].party = party;
        }
      }
    }
  }

  makeMove(party, board, init) {
    var profitability = this.calcArmiesProfitability(party, board);
    profitability.sort(orderArmies);

    function orderArmies(a, b) {
      var armyAProfitability = a.profitability;
      var armyBProfitability = b.profitability;
      if (armyAProfitability > armyBProfitability) {
        return -1;
      }
      if (armyAProfitability < armyBProfitability) {
        return 1;
      }
      var armyATotal = a.count + a.morale;
      var armyBTotal = b.count + b.morale;
      if (armyATotal > armyBTotal) {
        return -1;
      }
      if (armyATotal < armyBTotal) {
        return 1;
      }
      return 0;
    }

    if (profitability.length == 0) {
      console.warn('No possible moves for party ', board.hw_parties_names[party]);
      return;
    }

    if (!profitability[0].move.wait_for_support) {
      board.hw_parties_wait_for_support_field[party] = null;
      board.hw_parties_wait_for_support_count[party] = 0;
      this.moveArmy(profitability[0], profitability[0].move, board);
    } else {
      if (profitability[0].move == board.hw_parties_wait_for_support_field[party]) {
        board.hw_parties_wait_for_support_count[party] = board.hw_parties_wait_for_support_count[party] + 1;
      } else {
        board.hw_parties_wait_for_support_field[party] = profitability[0].move;
        board.hw_parties_wait_for_support_count[party] = 0;
      }
      var supportArmies = this.supportArmy(party, profitability[0], profitability[0].move, board);
      if (supportArmies.length > 0) {
        supportArmies.sort(orderArmies);
        this.moveArmy(supportArmies[0], supportArmies[0].move, board);
      } else {
        this.moveArmy(profitability[0], profitability[0].move, board);
      }
    }
  }

  moveArmy(army, field, board) {
    var afield = army.field;
    this.updateGameLog(board.hw_parties_names[army.party] + " moved unit from " +
      "(" + army.field.fx + "," + army.field.fy  + ") to (" + field.fx + "," + field.fy + ")");

    // Pact was just broken
    if (board.hw_peace >= 0
      && ((field.party == board.hw_peace && army.party == board.human)
      || (army.party == board.hw_peace && field.party == board.human))) {
        this.addMoraleForAll(30, field.party, board);
        board.hw_pact_just_broken = board.hw_peace;
        board.hw_peace = -1;
    }
    army.field.army = null;
    army.field = field;
    army.moved = true;
    if (field.army && field.party != army.party) {
      // Unit is in contact with enemy party
      if (!this.attack(army, field, board)) {
        this.updateBoard(board);
        return false;
      }
    } else if (field.army && field.party == army.party) {
      // Unit is joining with other friendly units
      if (field.army.count + army.count <= 99) {
        this.joinUnits(army.count, army.morale, army.party, board, field.army);
      } else {
        // Only move enough units to fill other army up to 99 units
        var chng = field.army.count + army.count - 99;
        this.joinUnits(99 - field.army.count, army.morale, army.party, board, field.army);
        this.joinUnits(chng, army.morale, army.party, board, null, afield);
      }
      this.setArmyRemoval(army, field.army);
      field.army.moved = true;
      this.annexLand(army.party, field, board, false);
      this.updateBoard(board);
      return false;
    }
    field.army = army;
    this.annexLand(army.party, field, board, false);
    this.updateBoard(board);
    return true;
  }

  calcArmiesProfitability(party, board) {
    var self = this;
    function finalProfitability(field, army) {
      var totalProfitability = -10000000;
      var canTakeCapital = false;
      for (var partyIndex = 0; partyIndex < board.hw_parties_count; partyIndex++) {
        if (partyIndex != party) {
          var profitability = -10000000;
          // Other party still owns original capital city (party is currently owning party, capital is original owner)
          if (board.hw_parties_capitals[partyIndex].party == board.hw_parties_capitals[partyIndex].capital) {
            profitability = field.profitability[partyIndex];
            if (board.hw_parties_control[partyIndex] == "human") {
              profitability = profitability + board.difficulty * 2;
            }
          }
          // Don't betray the pact unless there are only 2 powers left, human and other power
          if (board.hw_peace == party && partyIndex == board.human && !board.duel) {
            profitability = profitability - 500;
          }
          // Update total profitability
          if (totalProfitability < profitability) {
            totalProfitability = profitability;
          }
        }
      }
      if (board.hw_peace == party && board.human == field.party && !board.duel) {
        totalProfitability = totalProfitability - 500;
      }
      // Taking enemy land
      if (field.type == "land" && field.party != party) {
        // Original enemy capital can be captured
        if (field.capital >= 0 && field.capital == field.party && army.count + army.morale > field.army.count + field.army.morale) {
          totalProfitability = totalProfitability + 1000000;
          canTakeCapital = true;
        } else if (field.capital >= 0) {
          // Can attack enemy capital, but don't have enough forces to take it
          totalProfitability = totalProfitability + 20;
        } else if (field.estate == "town") {
          // Enemy town can be taken and units can respawn
          totalProfitability = totalProfitability + 5;
        } else if (field.estate == "port") {
          // Enemy port can be taken
          totalProfitability = totalProfitability + 3;
        } else if (field.n_town) {
          // Any town
          totalProfitability = totalProfitability + 3;
        }
      }
      // Field has enemy army
      if (field.army && field.army.party != party) {
        // Field is neighbour of own capital
        if (field.n_capital[party]) {
          totalProfitability = totalProfitability + 1000;
        }
        // Opponent computer player with over 1.5 * total power of current party
        // and they are both on left side (0,1) or right side (2,3)
        if (field.army.party != board.human
          && (board.hw_parties_total_power[field.party] > 1.5 * board.hw_parties_total_power[party])
          && (field.army.count + field.army.morale > army.count + army.morale)
          && ((field.party < 2 && party < 2) || (field.party > 1 && party > 1))) {
          totalProfitability = totalProfitability + 200;
        }
        // On higher difficulty levels, attack computer party less and focus more on human party
        if (board.difficulty > 5 && field.army.party != board.human) {
          totalProfitability = totalProfitability - 250;
        }
      }

      // Join with own forces
      if (field.army && field.army.party == party) {
        // Small chance of joining forces if army is small enough
        if (field.army.count > army.count && field.army.count < 70) {
          totalProfitability = totalProfitability + 2;
        }
      }

      // Army is stationed in capital, field has no army
      if (army.field.capital == party && !field.army && board.turns < 5) {
        totalProfitability = totalProfitability + 50;
      }
      var neighbour = self.calcNeighboursInfo(party, field);
      var enemyNeighbour = self.calcEnemyNeighboursPower(party, field);
      var fieldArmyTotal = field.army ? field.army.count + field.army.morale : 0;
      if ((neighbour.power < enemyNeighbour && neighbour.power < 300 || (army.count + army.morale < fieldArmyTotal) && army.count < 90)
        && !field.n_capital[party]
        && !canTakeCapital) {
          if (board.hw_parties_wait_for_support_field[party] == field) {
            if (board.hw_parties_wait_for_support_count[party] < 5) {
              field.wait_for_support = true;
            } else {
              totalProfitability = totalProfitability - 5;
            }
          } else {
            field.wait_for_support = true;
          }
      }
      return totalProfitability;
    }
    function orderMoves(a, b) {
      // Sort by profitability
      var aValue = a.tmp_prof;
      var bValue = b.tmp_prof;
      if (aValue > bValue) {
        return -1;
      }
      if (aValue < bValue) {
        return 1;
      }
      return 0;
    }
    function findBestMoveVal(army) {
      var moves = self.pathfinder.getPossibleMoves(army.field, true, false);
      for (var i = 0; i < moves.length; i++) {
        moves[i].wait_for_support = false;
        moves[i].tmp_prof = finalProfitability(moves[i], army);
      }
      moves.sort(orderMoves);
      return moves[0];
    }
    var movableArmies = this.getMovableArmies(party, board);
    for (var armyIndex = 0; armyIndex < movableArmies.length; armyIndex++) {
      var bestMove = findBestMoveVal(movableArmies[armyIndex]);
      if (!bestMove) {
        console.warn("No move found for army: ", movableArmies[armyIndex]);
        continue;
      }
      movableArmies[armyIndex].move = bestMove;
      movableArmies[armyIndex].profitability = movableArmies[armyIndex].move.tmp_prof;
      if (movableArmies[armyIndex].field.capital == movableArmies[armyIndex].party && board.turns > 5) {
        movableArmies[armyIndex].profitability = movableArmies[armyIndex].profitability - 1000;
      }
    }
    return movableArmies;
  }

  calcNeighboursInfo(party, field) {
    var power = 0;
    var count = 0;
    var nonEnemyLand = 0;
    var waitForSupport = false;
    var furtherNeighbours = this.pathfinder.getFurtherNeighbours(field);
    // TODO: Should this be deleted?
    // field.push.field;
    for (var i = 0; i < furtherNeighbours.length; i++) {
      if (!furtherNeighbours[i]) {
        continue;
      }

      if (furtherNeighbours[i].army && furtherNeighbours[i].army.party == party) {
        power = power + (furtherNeighbours[i].army.count + furtherNeighbours[i].army.morale);
        count = count + 1;
      }
      if (furtherNeighbours[i].type == field.type && (furtherNeighbours[i].party == party || furtherNeighbours[i].party < 0)) {
        nonEnemyLand = nonEnemyLand + 1;
      }
      if (furtherNeighbours[i].wait_for_support) {
        waitForSupport = true;
      }
    }
    return {
      power: power,
      count: count,
      non_enemy_land: nonEnemyLand,
      wait_for_support: waitForSupport,
    };
  }

  calcEnemyNeighboursPower(party, field) {
    var furtherNeighbours = this.pathfinder.getFurtherNeighbours(field);
    var power = 0;
    // TODO: Should this be deleted?
    // field.push.field;
    for (var i = 0; i < furtherNeighbours.length; i++) {
      if (!furtherNeighbours[i]) {
        continue;
      }
      if (furtherNeighbours[i].army && furtherNeighbours[i].army.party != party) {
        power = power + (furtherNeighbours[i].army.count + furtherNeighbours[i].army.morale);
      }
    }
    return power;
  }

  supportArmy(party, army, field, board) {
    var self = this;
    function orderMoves(a, b) {
      var aValue = a.tmp_prof;
      var bValue = b.tmp_prof;
      if (aValue > bValue) {
        return -1;
      }
      if (aValue < bValue) {
        return 1;
      }
      return 0;
    }
    function findBestMoveVal(army) {
      var moves = self.pathfinder.getPossibleMoves(army.field, true, false);
      var supportMoves = [];

      for (var i = 0; i < moves.length; i++) {
        if (moves[i] != field && (!moves[i].army || moves[i].army.party < 0 || moves[i].army.party == party)) {
          moves[i].tmp_prof = -self.pathfinder.getDistance(moves[i], field);
          supportMoves.push(moves[i]);
        }
      }
      supportMoves.sort(orderMoves);
      return supportMoves[0];
    }
    var moveableArmies = this.getMovableArmies(party, board);
    var supportArmies = new Array();
    for (var armyIndex = 0; armyIndex < moveableArmies.length; armyIndex++) {
      if (moveableArmies[armyIndex] != army && moveableArmies[armyIndex].field.capital != party) {
        var bestMove = findBestMoveVal(moveableArmies[armyIndex]);
        if (!bestMove) {
          console.warn("No move found for army: ", moveableArmies[armyIndex]);
          continue;
        }
        moveableArmies[armyIndex].move = bestMove;
        moveableArmies[armyIndex].profitability = moveableArmies[armyIndex].move.tmp_prof;
        if (moveableArmies[armyIndex].move != field
          && (!moveableArmies[armyIndex].move.army
              || moveableArmies[armyIndex].move.army.party < 0
              || moveableArmies[armyIndex].move.army.party == party)
        ) {
          supportArmies.push(moveableArmies[armyIndex]);
        }
      }
    }
    return supportArmies;
  }

  getMovableArmies(party, board) {
    var movableArmies = [];
    for (var i = 0; i < board.hw_parties_armies[party].length; i++) {
      if (!board.hw_parties_armies[party][i].moved) {
        movableArmies.push(board.hw_parties_armies[party][i]);
      }
    }
    return movableArmies;
  }

  attack(army1, field, board) {
    var army2 = field.army;
    if (!army2) {
      return true;
    }
    var army1_pw = army1.count + army1.morale;
    var army2_pw = army2.count + army2.morale;
    if (army1_pw > army2_pw) {
      this.addMoraleForAll(-Math.floor(army2.count / 10), army2.party, board);
      army1.count = army1.count - Math.floor(army2_pw / army1_pw * army1.count);
      army1.count = army1.count <= 0 ? 1 : army1.count;
      army1.morale = army1.morale > army1.count ? army1.count : army1.morale;
      this.setExplosion(army1, army2, army1);
      return true;
    }
    this.addMoraleForAll(-Math.floor(army1.count / 10), army1.party, board);
    army2.count = army2.count - Math.floor(army1_pw / army2_pw * army1.count);
    army2.count = army2.count <= 0 ? 1 : army2.count;
    army2.morale = army2.morale > army2.count ? army2.count : army2.morale;
    this.setExplosion(army1, army1, army2);
    return false;
  }

  setArmyRemoval(army, army_waiting) {
    army.remove = true;
    army.remove_time = 24;
    if (army_waiting) {
      army.waiting = army_waiting;
      army_waiting.is_waiting = true;
    }
  }

  setExplosion(attacking, exploding, army_waiting) {
    if (!exploding) {
      exploding = attacking;
    }
    attacking.exploding = exploding;
    exploding.remove_time = 36;
    if (army_waiting) {
      attacking.waiting = army_waiting;
      army_waiting.is_waiting = true;
    }
  }

  deleteArmy(army) {
    if (army.field.army == army) {
      army.field.army = null;
    }
  }

  addMorale(morale, army) {
    morale = morale + army.morale;
    if (morale < 0) {
      morale = 0;
    }
    army.morale = morale >= army.count ? army.count : morale;
  }

  addMoraleForAll(morale, party, board) {
    if (morale == 0) {
      return;
    }
    for (var armyIndex = 0; armyIndex < board.hw_parties_armies[party].length; armyIndex++) {
      this.addMorale(morale, board.hw_parties_armies[party][armyIndex]);
    }
  }

  addMoraleForAA(morale, army, board) {
    this.addMorale(morale[1], army);
    if (morale[0] != 0) {
      this.addMoraleForAll(morale[0], army.party, board);
    }
  }

  updateArmies(board) {
    for (const [key, value] of Object.entries(board.armies)) {
      var army = value;
      if (board.hw_parties_status[army.party] == 0) {
        this.deleteArmy(army);
        delete board.armies[key];
        continue;
      }

      if (army._x != army.field._x || army._y != army.field._y) {
        army._x = army._x - (army._x - army.field._x) / 2;
        army._y = army._y - (army._y - army.field._y) / 2;
        if (Math.abs(army._x - army.field._x) <= 1 && Math.abs(army._y - army.field._y) <= 1) {
          army._x = army.field._x;
          army._y = army.field._y;
        }
      } else {
         if (army.remove || army.remove_time > 0) {
           if (!army.waiting) {
             army.waiting = {};
           }
            army.waiting.is_waiting = false;
            this.deleteArmy(army);
            delete board.armies[key];
         }
      }
    }
  }

  resetGameLog() {
    let gamelogElement = document.getElementById('gamelog');
    gamelogElement.innerHTML = "";
  }

  updateGameLog(message) {
    let gamelogElement = document.getElementById('gamelog');
    gamelogElement.innerHTML += message + "<br/>";
  }
};

export { Map }
