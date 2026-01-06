export class Random {
    constructor(seed) {
        this.seed = seed || Math.floor(Math.random() * 999999);
    }

    // Linear Congruential Generator
    next(n) {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return Math.floor(this.seed / 233280 * n);
    }

    shuffle(arr) {
        const arrayCopy = [...arr];
        for (let index = 0; index < arrayCopy.length; index++) {
            const tmp = arrayCopy[index];
            const rn = this.next(arrayCopy.length);
            arrayCopy[index] = arrayCopy[rn];
            arrayCopy[rn] = tmp;
        }
        return arrayCopy;
    }
}

export const Utils = {
    // Helper to get image path
    getImagePath: (name) => `images/${name}`,
    
    // Degrees to Radians
    degToRad: (deg) => (Math.PI / 180) * deg,
};
