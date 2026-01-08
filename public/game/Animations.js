import { Config } from './Config.js';

/**
 * Animation manager for game units
 * Handles all GSAP-based animations for merging, attacking, and explosions
 */
export class Animations {
    /**
     * Animate two units merging together
     * @param {Object} movingArmy - The army that is moving and will be absorbed
     * @param {Object} targetArmy - The army that will receive the moving army
     */
    static animateMerge(movingArmy, targetArmy) {
        if (typeof gsap === 'undefined') return;

        // Ensure visual objects exist
        if (!movingArmy.visual) movingArmy.visual = { x: movingArmy.field._x, y: movingArmy.field._y };
        if (!targetArmy.visual) targetArmy.visual = { x: targetArmy.field._x, y: targetArmy.field._y };

        // Create a timeline for the merge animation
        const tl = gsap.timeline();

        // 1. Scale up both units slightly
        tl.to([movingArmy.visual, targetArmy.visual], {
            scale: Config.ANIMATION.MERGE_SCALE,
            duration: Config.ANIMATION.MERGE_DURATION * 0.5,
            ease: "back.out(2)"
        }, 0);

        // 2. Add a subtle rotation to the moving army
        tl.to(movingArmy.visual, {
            rotation: 360,
            duration: Config.ANIMATION.MERGE_DURATION,
            ease: "power2.inOut"
        }, 0);

        // 3. Fade out the moving army while scaling back the target
        tl.to(movingArmy.visual, {
            opacity: 0,
            duration: Config.ANIMATION.MERGE_DURATION * 0.5,
            ease: "power2.in"
        }, Config.ANIMATION.MERGE_DURATION * 0.5);

        // 4. Scale target back to normal with a bounce
        tl.to(targetArmy.visual, {
            scale: 1,
            duration: Config.ANIMATION.MERGE_DURATION * 0.5,
            ease: "elastic.out(1, 0.5)"
        }, Config.ANIMATION.MERGE_DURATION * 0.5);

        // Reset properties after animation
        tl.set(movingArmy.visual, { scale: 1, rotation: 0, opacity: 1 });
    }

    /**
     * Animate an attack between two units
     * @param {Object} attacker - The attacking army
     * @param {Object} defender - The defending army
     */
    static animateAttack(attacker, defender) {
        if (typeof gsap === 'undefined') return;

        // Ensure visual objects exist with all properties
        if (!attacker.visual) {
            attacker.visual = { x: attacker.field._x, y: attacker.field._y, scale: 1, rotation: 0, opacity: 1 };
        }
        if (!defender.visual) {
            defender.visual = { x: defender.field._x, y: defender.field._y, scale: 1, rotation: 0, opacity: 1 };
        }

        // Store original positions
        const attackerOrigX = attacker.field._x;
        const attackerOrigY = attacker.field._y;
        const defenderOrigX = defender.field._x;
        const defenderOrigY = defender.field._y;

        const tl = gsap.timeline();

        // 1. Attacker lunges forward with slight scale increase
        const dx = defenderOrigX - attackerOrigX;
        const dy = defenderOrigY - attackerOrigY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const lungeDistance = distance * 0.35;
        const lungeX = attackerOrigX + (dx / distance) * lungeDistance;
        const lungeY = attackerOrigY + (dy / distance) * lungeDistance;

        tl.to(attacker.visual, {
            x: lungeX,
            y: lungeY,
            scale: Config.ANIMATION.ATTACK_LUNGE_SCALE,
            duration: Config.ANIMATION.ATTACK_LUNGE_DURATION,
            ease: "power3.out"
        }, 0);

        // 2. Impact - defender recoils and both flash briefly
        tl.to(defender.visual, {
            x: defenderOrigX + (dx / distance) * Config.ANIMATION.ATTACK_RECOIL_DISTANCE,
            y: defenderOrigY + (dy / distance) * Config.ANIMATION.ATTACK_RECOIL_DISTANCE,
            scale: 0.9,
            duration: Config.ANIMATION.ATTACK_IMPACT_DURATION,
            ease: "power2.out"
        }, Config.ANIMATION.ATTACK_LUNGE_DURATION);

        tl.to([attacker.visual, defender.visual], {
            opacity: 0.6,
            duration: Config.ANIMATION.ATTACK_IMPACT_DURATION * 0.3,
            ease: "none"
        }, Config.ANIMATION.ATTACK_LUNGE_DURATION);

        // 3. Defender bounces back
        tl.to(defender.visual, {
            x: defenderOrigX,
            y: defenderOrigY,
            scale: 1,
            duration: Config.ANIMATION.ATTACK_IMPACT_DURATION * 0.8,
            ease: "elastic.out(1.5, 0.3)"
        }, Config.ANIMATION.ATTACK_LUNGE_DURATION + Config.ANIMATION.ATTACK_IMPACT_DURATION);

        // 4. Attacker returns smoothly
        tl.to(attacker.visual, {
            x: attackerOrigX,
            y: attackerOrigY,
            scale: 1,
            duration: Config.ANIMATION.ATTACK_RETURN_DURATION,
            ease: "power2.inOut"
        }, Config.ANIMATION.ATTACK_LUNGE_DURATION + Config.ANIMATION.ATTACK_IMPACT_DURATION * 0.3);

        // 5. Restore opacity
        tl.to([attacker.visual, defender.visual], {
            opacity: 1,
            duration: Config.ANIMATION.ATTACK_IMPACT_DURATION,
            ease: "none"
        }, Config.ANIMATION.ATTACK_LUNGE_DURATION + Config.ANIMATION.ATTACK_IMPACT_DURATION);

        // 6. Reset all properties to ensure clean state
        tl.set([attacker.visual, defender.visual], {
            x: (index) => index === 0 ? attackerOrigX : defenderOrigX,
            y: (index) => index === 0 ? attackerOrigY : defenderOrigY,
            opacity: 1,
            scale: 1,
            rotation: 0
        });
    }

    /**
     * Animate a unit explosion (when destroyed)
     * @param {Object} army - The army that is being destroyed
     */
    static animateExplosion(army) {
        if (typeof gsap === 'undefined') return;

        // Ensure visual object exists with all properties
        if (!army.visual) {
            army.visual = { x: army.field._x, y: army.field._y, scale: 1, rotation: 0, opacity: 1 };
        }

        // Store original position
        const origX = army.field._x;
        const origY = army.field._y;

        const tl = gsap.timeline();

        // 1. Brief compression before explosion
        tl.to(army.visual, {
            scale: 0.85,
            duration: Config.ANIMATION.EXPLOSION_COMPRESS_DURATION,
            ease: "power2.in"
        }, 0);

        // 2. Quick fade during compression
        tl.to(army.visual, {
            opacity: 0.7,
            duration: Config.ANIMATION.EXPLOSION_COMPRESS_DURATION,
            ease: "none"
        }, 0);

        // 3. Rapid expansion and fade out (explosion effect)
        tl.to(army.visual, {
            scale: Config.ANIMATION.EXPLOSION_SCALE,
            opacity: 0,
            duration: Config.ANIMATION.EXPLOSION_EXPAND_DURATION,
            ease: "power3.out"
        }, Config.ANIMATION.EXPLOSION_COMPRESS_DURATION);

        // 4. Subtle rotation during explosion
        tl.to(army.visual, {
            rotation: 45,
            duration: Config.ANIMATION.EXPLOSION_EXPAND_DURATION,
            ease: "power1.out"
        }, Config.ANIMATION.EXPLOSION_COMPRESS_DURATION);

        // 5. Keep unit hidden after explosion (don't reset opacity to 1)
        tl.set(army.visual, {
            scale: 1,
            opacity: 0,
            rotation: 0,
            x: origX,
            y: origY
        });
    }

    /**
     * Animate unit movement (basic position transition)
     * @param {Object} army - The army to move
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     */
    static animateMove(army, targetX, targetY) {
        if (typeof gsap === 'undefined') {
            // Fallback: Snap to target
            if (army.visual) {
                army.visual.x = targetX;
                army.visual.y = targetY;
            }
            return;
        }

        if (!army.visual) {
            army.visual = { x: army.field._x, y: army.field._y };
        }

        gsap.to(army.visual, {
            x: targetX,
            y: targetY,
            duration: Config.ANIMATION.MOVE_DURATION,
            ease: "power1.inOut"
        });
    }
}
