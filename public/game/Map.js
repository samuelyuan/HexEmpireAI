import { Bot } from './Bot.js'
import { Pathfinder } from './Pathfinder.js'

class Map {
  constructor(mapNumber, images) {
    this.towns = this.generateAllTowns();
    this.mapNumber = mapNumber;
    if (this.mapNumber < 0) {
      this.mapNumber = Math.floor(Math.random() * 999999);
    }
    this.resetGameLog();
    this.updateGameLog(`Map #${this.mapNumber}`, 'map', null);
    this.setSeed(this.mapNumber);

    this.pathfinder = new Pathfinder();
    this.bot = new Bot(this.pathfinder);
    this.images = images;
  }

  setSeed(seed) {
    this.rnd_seed = seed;
  }

  generateAllTowns() {
    return [
      "Abu Dhabi", "Abuja", "Accra", "Addis Ababa", "Algiers", "Amman", "Amsterdam", "Ankara", "Antananarivo", "Apia", "Ashgabat", "Asmara", "Astana", "Asunción", "Athens",
		  "Baghdad", "Baku", "Bamako", "Bangkok", "Bangui", "Banjul", "Basseterre", "Beijing", "Beirut", "Belgrade", "Belmopan", "Berlin", "Bern", "Bishkek", "Bissau", "Bogotá",
		  "Brasília", "Bratislava", "Brazzaville", "Bridgetown", "Brussels", "Bucharest", "Budapest", "Buenos Aires", "Bujumbura", "Cairo", "Canberra",
		  "Cape Town", "Caracas", "Castries", "Chisinau", "Conakry", "Copenhagen", "Cotonou",
		  "Dakar", "Damascus", "Dhaka", "Dili", "Djibouti", "Dodoma", "Doha", "Dublin", "Dushanbe", "Delhi",
		  "Freetown", "Funafuti", "Gabarone", "Georgetown", "Guatemala City", "Hague", "Hanoi", "Harare", "Havana", "Helsinki", "Honiara", "Hong Kong",
		  "Islamabad", "Jakarta", "Jerusalem", "Kabul", "Kampala", "Kathmandu", "Khartoum", "Kyiv", "Kigali", "Kingston", "Kingstown", "Kinshasa", "Kuala Lumpur", "Kuwait City",
		  "La Paz", "Liberville", "Lilongwe", "Lima", "Lisbon", "Ljubljana", "Lobamba", "Lomé", "London", "Luanda", "Lusaka", "Luxembourg",
		  "Madrid", "Majuro", "Malé", "Managua", "Manama", "Manila", "Maputo", "Maseru", "Mbabane", "Melekeok", "Mexico City", "Minsk", "Mogadishu", "Monaco", "Monrovia", "Montevideo", "Moroni", "Moscow", "Muscat",
		  "Nairobi", "Nassau", "Naypyidaw", "N'Djamena", "New Delhi", "Niamey", "Nicosia", "Nouakchott", "Nuku'alofa", "Nuuk",
		  "Oslo", "Ottawa", "Ouagadougou", "Palikir", "Panama City", "Paramaribo", "Paris", "Phnom Penh", "Podgorica", "Prague", "Praia", "Pretoria", "Pyongyang",
		  "Quito", "Rabat", "Ramallah", "Reykjavík", "Riga", "Riyadh", "Rome", "Roseau",
		  "San José", "San Marino", "San Salvador", "Sanaá", "Santiago", "Santo Domingo", "Sao Tomé", "Sarajevo", "Seoul", "Singapore", "Skopje", "Sofia", "South Tarawa", "St. George's", "St. John's", "Stockholm", "Sucre", "Suva",
		  "Taipei", "Tallinn", "Tashkent", "Tbilisi", "Tegucigalpa", "Teheran", "Thimphu", "Tirana", "Tokyo", "Tripoli", "Tunis", "Ulaanbaatar",
		  "Vaduz", "Valletta", "Victoria", "Vienna", "Vientiane", "Vilnius", "Warsaw", "Washington", "Wellington", "Windhoek", "Yamoussoukro", "Yaoundé", "Yerevan", "Zagreb", "Zielona Góra",
		  "Poznań", "Wrocław", "Gdańsk", "Szczecin", "Łódź", "Białystok", "Toruń", "St. Petersburg", "Turku", "Örebro", "Chengdu",
		  "Wuppertal", "Frankfurt", "Düsseldorf", "Essen", "Duisburg", "Magdeburg", "Bonn", "Brno", "Tours", "Bordeaux", "Nice", "Lyon", "Stara Zagora", "Milan", "Bologna", "Sydney", "Venice", "New York",
		  "Barcelona", "Zaragoza", "Valencia", "Seville", "Graz", "Munich", "Birmingham", "Naples", "Cologne", "Turin", "Marseille", "Leeds", "Kraków", "Palermo", "Genoa",
		  "Stuttgart", "Dortmund", "Rotterdam", "Glasgow", "Málaga", "Bremen", "Sheffield", "Antwerp", "Plovdiv", "Thessaloniki", "Kaunas", "Lublin", "Varna", "Ostrava", "Iaşi", "Katowice",
		  "Cluj-Napoca", "Timişoara", "Constanţa", "Pskov", "Vitebsk", "Arkhangelsk", "Novosibirsk", "Samara", "Omsk", "Chelyabinsk", "Ufa", "Volgograd", "Perm", "Kharkiv", "Odessa", "Donetsk", "Dnipropetrovsk",
		  "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "Dallas", "Detroit", "Indianapolis", "San Francisco", "Atlanta", "Austin", "Vermont", "Toronto", "Montreal", "Vancouver", "Gdynia", "Edmonton",
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
    const townBgDirtImg = `images/cd_${this.rand(6)}.png`;
    const townBgGrassImg = this.images[`townBgGrass${this.rand(6) + 1}`].img;
    const flipH = this.rand(2);
    const flipV = this.rand(2);
    const rotateDegrees = this.rand(360);

    const ctx = board.background_2.getContext('2d');
    const img = townBgGrassImg;
    const width = img.width;
    const height = img.height;
    const field = this.getField(x, y, board);
    const destX = field._x - (width / 2);
    const destY = field._y - (height / 2);

    ctx.translate(destX, destY);
    this.rotateImageMatrix(ctx, img, rotateDegrees);
    this.flipImageMatrix(ctx, img, flipH, flipV);
    ctx.drawImage(img, 0, 0);
    ctx.resetTransform();

    let region = new Path2D();
    region.rect(0, 0, 750, 465);
    ctx.clip(region);
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

  flipImageMatrix(ctx, image, flipH, flipV) {
    const width = image.width;
    const height = image.height;

    if (flipH > 0 && flipV > 0) {
      ctx.translate(width, height);
      ctx.scale(-1, -1);
    } else if (flipH > 0) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    } else if (flipV > 0) {
      ctx.translate(0, height);
      ctx.scale(1, -1);
    }
  }

  degreesToRadians(degrees) {
	   return (Math.PI / 180) * degrees;
  }

  rotateImageMatrix(ctx, image, rotateDegrees) {
    const width = image.width;
    const height = image.height;

    ctx.translate(width / 2, height / 2);
    ctx.rotate(this.degreesToRadians(rotateDegrees));
    ctx.translate(-width / 2, -height / 2);
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

        gridImages[index].dirtBg.src = `images/ld_${this.rand(6) + 1}.png`;
        gridImages[index].grassBg = this.images[`grassBg${this.rand(6) + 1}`].img;

        const flipH = this.rand(2);
        const flipV = this.rand(2);
        const rotateDegrees = this.rand(4) * 90;

        const ctx = board.background_2.getContext('2d');
        var img = gridImages[index].grassBg;
        var destX = (x * 125) - 15;
        var destY = (y * 125) - 15;

        ctx.translate(destX, destY);
        this.rotateImageMatrix(ctx, img, rotateDegrees);
        this.flipImageMatrix(ctx, img, flipH, flipV);

        ctx.drawImage(img, 0, 0);
        ctx.resetTransform();

        let region = new Path2D();
        region.rect(0, 0, 800, 465);
        ctx.clip(region);
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
        const field = this.getField(x, y, board);
        if (field.type == "water") {
          const seaBg = this.images[`seaBg${this.rand(6) + 1}`].img;
          const flipH = this.rand(2);
          const flipV = this.rand(2);
          const rotateDegrees = this.rand(2) * 180;
          const ctx = board.background_sea.getContext('2d');

          const img = seaBg;
          const width = seaBg.width;
          const height = seaBg.height;
          const destX = field._x - (width / 2.0);
          const destY = field._y - (height / 2.0);
          ctx.translate(destX, destY);
          this.rotateImageMatrix(ctx, img, rotateDegrees);
          this.flipImageMatrix(ctx, img, flipH, flipV);
          ctx.drawImage(img, 0, 0);
          ctx.resetTransform();
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
      var aname = `army${board.hw_lAID}`;
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
          var path = this.pathfinder.findPath(field, board.hw_parties_capitals[partyIndex], [], true);
          if (!path) {
            console.warn(`Path is undefined for (${x},${y})`);
            continue;
          }
          field.profitability[partyIndex] = -path.length;
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
              this.updateGameLog(`Disbanded ${board.hw_parties_names[targetParty]} army at (${field.fx}, ${field.fy})`, 'disband', board);
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
          self.updateGameLog(`${board.hw_parties_names[party]} conquered ${board.hw_parties_names[field.party]}`, 'conquest', board);
          return [50, 30];
        }
        if (board.human == party) {
          board.subject = field;
          board.news = "town_captured";
          self.updateGameLog(`${board.hw_parties_names[party]} captured former ${board.hw_parties_names[field.party]} capital city from ${board.hw_parties_names[field.party]}`, 'conquest', board);
        }
        return [30, 20];
      }
      if (field.estate == "town") {
        if (/*board.human == party && */ (!board.subject || board.subject.capital < 0)) {
          board.subject = field;
          if (field.party >= 0) {
            board.news = "town_captured";
            self.updateGameLog(`${board.hw_parties_names[party]} captured town ${field.town_name} from ${board.hw_parties_names[field.party]}`, 'capture', board);
          } else {
            board.news = "town_annexed";
            self.updateGameLog(`${board.hw_parties_names[party]} annexed town ${field.town_name}`, 'annex', board);
          }
        }
        return [10, 10];
      }
      if (field.estate == "port") {
        if (/*board.human == party &&*/ (!board.subject || board.subject.estate != "town")) {
          board.subject = field;
          if (field.party >= 0) {
            board.news = "town_captured";
            self.updateGameLog(`${board.hw_parties_names[party]} captured port ${field.town_name} from ${board.hw_parties_names[field.party]}`, 'capture', board);
          } else {
            board.news = "town_annexed";
            self.updateGameLog(`${board.hw_parties_names[party]} annexed port ${field.town_name}`, 'annex', board);
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
    var profitability = this.bot.calcArmiesProfitability(party, board);
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
      var supportArmies = this.bot.supportArmy(party, profitability[0], profitability[0].move, board);
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
    this.updateGameLog(`${board.hw_parties_names[army.party]} moved unit from (${army.field.fx},${army.field.fy}) to (${field.fx},${field.fy})`, 'move', board);

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

  getMovePoints(turnParty, board) {
    var movePoints = 5;
    var movableArmyCount = this.bot.getMovableArmies(turnParty, board).length;
    if (movePoints > movableArmyCount) {
      movePoints = movableArmyCount;
    }
    return movePoints;
  }

  resetGameLog() {
    let gamelogElement = document.getElementById('gamelog');
    gamelogElement.innerHTML = "";
  }

  updateGameLog(message, type = 'info', board = null) {
    // Use the current turn container if available, otherwise fall back to gamelog element
    const targetContainer = window.currentTurnLogContainer || document.getElementById('gamelog');
    if (!targetContainer) return;
    
    // Get current turn number for grepping/searching
    const turnNumber = board && board.turns !== undefined ? board.turns + 1 : '?';
    
    // Format party names with colors
    let formattedMessage = message;
    if (board && board.hw_parties_names) {
      for (let i = 0; i < board.hw_parties_names.length; i++) {
        const partyName = board.hw_parties_names[i];
        const regex = new RegExp(partyName, 'g');
        formattedMessage = formattedMessage.replace(regex, `<span class="party-name party-${i}">${partyName}</span>`);
      }
    }
    
    // Format coordinates
    formattedMessage = formattedMessage.replace(/\((\d+),(\d+)\)/g, '<span class="log-coords">($1,$2)</span>');
    
    // Format town/port names (more flexible pattern)
    formattedMessage = formattedMessage.replace(/(town|port) ([A-Z][a-zA-Z\s'\-]+?)(?:\s+from|\s+at|$)/g, 
      (match, type, name) => {
        const icon = type === 'town' ? '🏙️' : '⚓';
        return `${icon} <strong>${name.trim()}</strong> `;
      });
    
    // Add turn number to entry for grepping (visible but subtle)
    const entry = `<div class="log-entry log-${type}" data-turn="${turnNumber}"><span class="log-turn-number">[T${turnNumber}]</span> ${formattedMessage}</div>`;
    
    if (targetContainer === window.currentTurnLogContainer) {
      // Append to turn container
      targetContainer.insertAdjacentHTML('beforeend', entry);
    } else {
      // Fallback: append directly to gamelog element
      targetContainer.innerHTML += entry;
    }
    
    // Auto-scroll to bottom
    const gamelogElement = document.getElementById('gamelog');
    if (gamelogElement) {
      gamelogElement.scrollTop = gamelogElement.scrollHeight;
    }
  }
};

export { Map }
