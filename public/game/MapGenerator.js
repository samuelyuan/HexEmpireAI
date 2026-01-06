import { Config } from './Config.js';
import { Utils } from './Utils.js';

export class MapGenerator {
    constructor(gameState, random, pathfinder) {
        this.state = gameState;
        this.random = random; // Instance of Random class
        this.pathfinder = pathfinder;
        this.townNames = this.getTownNames();
    }

    generate() {
        // 1. Initialize Fields
        for (let x = 0; x < this.state.width; x++) {
            for (let y = 0; y < this.state.height; y++) {
                this.addField(x, y);
            }
        }

        // 2. Link Neighbours
        for (let x = 0; x < this.state.width; x++) {
            for (let y = 0; y < this.state.height; y++) {
                this.findNeighbours(this.state.getField(x, y));
            }
        }

        // 3. Define Land/Water shapes
        this.setLandFields();
        this.generateLands();

        // 4. Place Capitals
        this.generatePartyCapitals();

        // 5. Place Towns
        this.generateTowns();
        
        // 6. Shuffle Towns (for random port connections)
        this.state.allTowns = this.random.shuffle(this.state.allTowns);

        // 7. Place Ports
        this.generatePorts();

        // 8. Assign Names
        this.assignTownNames();
    }

    addField(x, y) {
        const field = {
            fx: x,
            fy: y,
            _x: 0,
            _y: 0,
            type: "water", // Default
            estate: null,
            party: -1,
            capital: -1,
            army: null,
            neighbours: new Array(6),
            town_name: null,
            // AI Helpers
            profitability: [0, 0, 0, 0],
            n_capital: [false, false, false, false],
            n_town: false,
            tl: false, // Temporary flag for land generation
            land_id: -1,
        };

        // Calculate Pixel Coordinates
        field._x = x * (this.state.hexWidth * 0.75) + this.state.hexWidth / 2;
        field._y = (x % 2 === 0) 
            ? y * this.state.hexHeight + this.state.hexHeight / 2 
            : y * this.state.hexHeight + this.state.hexHeight;

        // Top edge depth fix (legacy?)
        if (x === this.state.width - 1 && y === this.state.height - 1) {
            Config.MAP.TOP_FIELD_DEPTH = -1; 
        }

        // Initial Random Land/Water
        // Fixed corners are always land
        if ((x === 1 && y === 1) ||
            (x === this.state.width - 2 && y === 1) ||
            (x === this.state.width - 2 && y === this.state.height - 2) ||
            (x === 1 && y === this.state.height - 2)) {
            field.type = "land";
        } else {
            // 20% chance of land initially
            field.type = this.random.next(10) <= 1 ? "land" : "water";
        }

        this.state.setField(x, y, field);
    }

    findNeighbours(field) {
        const x = field.fx;
        const y = field.fy;
        const get = (nx, ny) => this.state.getField(nx, ny);

        if (x % 2 === 0) {
            field.neighbours[0] = get(x + 1, y);
            field.neighbours[1] = get(x, y + 1);
            field.neighbours[2] = get(x - 1, y);
            field.neighbours[3] = get(x - 1, y - 1);
            field.neighbours[4] = get(x, y - 1);
            field.neighbours[5] = get(x + 1, y - 1);
        } else {
            field.neighbours[0] = get(x + 1, y + 1);
            field.neighbours[1] = get(x, y + 1);
            field.neighbours[2] = get(x - 1, y + 1);
            field.neighbours[3] = get(x - 1, y);
            field.neighbours[4] = get(x, y - 1);
            field.neighbours[5] = get(x + 1, y);
        }
    }

    setLandFields() {
        // Expand land if surrounded by land
        for (let x = 0; x < this.state.width; x++) {
            for (let y = 0; y < this.state.height; y++) {
                const field = this.state.getField(x, y);
                if (field.type === "water") {
                    let landCount = 0;
                    for (let n = 0; n < 6; n++) {
                        if (field.neighbours[n] && field.neighbours[n].type === "land") {
                            landCount++;
                        }
                    }
                    if (landCount >= 1) field.tl = true;
                }
            }
        }
        // Apply expansion
        for (let x = 0; x < this.state.width; x++) {
            for (let y = 0; y < this.state.height; y++) {
                const field = this.state.getField(x, y);
                if (field.tl) field.type = "land";
            }
        }
        // Remove isolated water (lakes)
        for (let x = 0; x < this.state.width; x++) {
            for (let y = 0; y < this.state.height; y++) {
                const field = this.state.getField(x, y);
                if (field.type === "water") {
                    let waterCount = 0;
                    for (let n = 0; n < 6; n++) {
                        if (field.neighbours[n] && field.neighbours[n].type === "water") {
                            waterCount++;
                        }
                    }
                    if (waterCount === 0) field.type = "land";
                }
            }
        }
    }

    generateLands() {
        // Group connected lands into clusters
        for (let x = 0; x < this.state.width; x++) {
            for (let y = 0; y < this.state.height; y++) {
                const field = this.state.getField(x, y);
                if (field.type === "land" && field.land_id < 0) {
                    const landId = this.state.lands.length;
                    this.state.lands.push([]);
                    this.state.lands[landId].push(field);
                    field.land_id = landId;

                    // Flood fill
                    const stack = [field];
                    while (stack.length > 0) {
                        const current = stack.pop();
                        for (let n = 0; n < 6; n++) {
                            const neighbor = current.neighbours[n];
                            if (neighbor && neighbor.type === "land" && neighbor.land_id < 0) {
                                neighbor.land_id = landId;
                                this.state.lands[landId].push(neighbor);
                                stack.push(neighbor);
                            }
                        }
                    }
                }
            }
        }
    }

    generatePartyCapitals() {
        let cp = 0;
        // Fixed locations for capitals near corners
        const locations = [
            { x: 1, y: 1 },
            { x: this.state.width - 2, y: 1 },
            { x: this.state.width - 2, y: this.state.height - 2 },
            { x: 1, y: this.state.height - 2 }
        ];

        for (const loc of locations) {
            const field = this.state.getField(loc.x, loc.y);
            if (field) {
                field.estate = "town";
                this.state.allTowns.push(field);
                field.capital = cp;
                this.state.parties[cp].capital = field;
                // Annex immediately (handled by GameLogic usually, but here we set initial state)
                field.party = cp;
                this.state.parties[cp].towns.push(field);
                
                cp++;
            }
        }
    }

    generateTowns() {
        // Distribute towns based on land mass size
        for (let landNum = 0; landNum < this.state.lands.length; landNum++) {
            const landMass = this.state.lands[landNum];
            const townCount = Math.floor(landMass.length / 10) + 1;

            for (let i = 0; i < townCount; i++) {
                let created = false;
                let attempts = 0;
                while (!created && attempts < 10) {
                    attempts++;
                    const index = this.random.next(landMass.length);
                    const field = landMass[index];

                    if (!field.estate) {
                        // Check neighbours (don't place next to water or other estate)
                        let ok = true;
                        for (let n = 0; n < 6; n++) {
                            const nb = field.neighbours[n];
                            if (!nb || nb.type === "water" || nb.estate) {
                                ok = false;
                                break;
                            }
                        }
                        if (ok) {
                            field.estate = "town";
                            this.state.allTowns.push(field);
                            created = true;
                        }
                    }
                }
            }
        }
    }

    generatePorts() {
        // Connect towns with paths, if path crosses water, create port
        let portNum = 0;
        for (let i = 0; i < this.state.allTowns.length - 1; i++) {
            const start = this.state.allTowns[i];
            const end = this.state.allTowns[i + 1];

            // Try to find land path first
            let path = this.pathfinder.findPath(start, end, ["town"], true);
            
            // If no land path or too long, allow water (which creates ports)
            if (!path || path.length > portNum) {
                path = this.pathfinder.findPath(start, end, ["town"], false);
            }

            if (path) {
                for (let j = 1; j < path.length - 1; j++) {
                    const curr = path[j];
                    const next = path[j + 1];
                    const prev = path[j - 1];

                    if (curr.type === "land" && next.type === "water") {
                        curr.estate = "port";
                        portNum++;
                    }
                    if (curr.type === "land" && prev.type === "water") {
                        curr.estate = "port";
                        portNum++;
                    }
                }
            }
        }
    }

    assignTownNames() {
        for (let x = 0; x < this.state.width; x++) {
            for (let y = 0; y < this.state.height; y++) {
                const field = this.state.getField(x, y);
                if (field.estate === "town" || field.estate === "port") {
                    field.town_name = this.getRandomTownName();
                }
            }
        }
    }

    getRandomTownName() {
        const cnr = this.random.next(this.townNames.length);
        const name = this.townNames[cnr];
        // Swap to avoid repeats (Fisher-Yates style)
        this.townNames[cnr] = this.townNames[0];
        this.townNames[0] = name;
        return this.townNames.shift();
    }

    getTownNames() {
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
}
