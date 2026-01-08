export const Config = {
    MAP: {
        WIDTH: 20,
        HEIGHT: 11,
        HEX_WIDTH: 50,
        HEX_HEIGHT: 40,
        TOP_FIELD_DEPTH: 0,
    },
    COLORS: {
        PARTY_RGB: [
            "255, 0, 0",      // Red
            "255, 0, 255",    // Magenta
            "0, 187, 255",    // Cyan
            "0, 255, 0"       // Green
        ],
        FACTION_NAMES: ["Redosia", "Violetnam", "Bluegaria", "Greenland"],
        FACTION_COLORS_NAME: ["red", "purple", "blue", "green"],
        TINT_MOVABLE: "rgba(255, 225, 0, 0.6)",
        GLOW_MOVABLE: "rgba(255, 225, 0, 1.0)",
        BORDER_DEFAULT: "rgba(255, 255, 102, 0.3)",
        SHADOW_SAND: "rgba(210, 180, 140, 1)",
    },
    UNITS: {
        MAX_COUNT: 99,
        SCALE: {
            INFANTRY: 0.07,
            ARTILLERY: 0.12,
            TANK: 0.13,
            WARSHIP: 0.13,
        },
        THRESHOLD: {
            TANK: 75,
            ARTILLERY: 40
        }
    },
    ANIMATION: {
        MOVE_DURATION: 0.5,
        MOVE_WAIT: 550,
        MOVE_WAIT_MIN: 50,
        MERGE_DURATION: 0.4,
        MERGE_SCALE: 1.3,
        ATTACK_LUNGE_DURATION: 0.3,
        ATTACK_IMPACT_DURATION: 0.2,
        ATTACK_RETURN_DURATION: 0.35,
        ATTACK_LUNGE_SCALE: 1.15,
        ATTACK_RECOIL_DISTANCE: 5,
        EXPLOSION_COMPRESS_DURATION: 0.2,
        EXPLOSION_EXPAND_DURATION: 0.5,
        EXPLOSION_SCALE: 1.4
    },
    IMAGES: {
        GRASS_BG: { prefix: 'l_', count: 6 },
        SEA_BG: { prefix: 'm_', count: 6 },
        TOWN_BG_GRASS: { prefix: 'c_', count: 6 },
        TOWN_BG_DIRT: { prefix: 'cd_', count: 6 },
        CITY: 'city.png',
        PORT: 'port.png',
        CAPITALS: ['capital_red.png', 'capital_violet.png', 'capital_blue.png', 'capital_green.png'],
        UNITS: {
            infantry: 'infantry.png',
            artillery: 'artillery.png',
            tank: 'tank.png',
            warship: 'warship.png'
        }
    }
};
