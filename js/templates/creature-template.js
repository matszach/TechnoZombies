const CREATURE_TMPL = {
    PLAYER: {
        hitCircleRadius: 30, 
        spriteSheet: 'player',
        shadowColor: '#000000',
        shadowBlur: 20,
        moveAnimationBreakpoins: [15, 30, 45, 60],
        moveSpeed: 3,
        cooldowns: {
            laserAttack: 4
        }
    },
    ZOMBIE_1: {
        hitCircleRadius: 30, 
        spriteSheet: 'zombie_1',
        shadowColor: '#000000',
        shadowBlur: 20,
        moveAnimationBreakpoins: [30, 60, 90, 120],
        moveSpeed: 0.5,
        cooldowns: {
            
        }
    }
}