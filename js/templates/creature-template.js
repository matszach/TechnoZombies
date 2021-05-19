const CREATURE_TMPL = {
    PLAYER: {
        hitCircleRadius: 30, 
        spriteSheet: 'player',
        shadowColor: '#000000',
        shadowBlur: 20,
        moveAnimationBreakpoins: [15, 30, 45, 60],
        moveSpeed: 2,
        cooldowns: {
            laserAttack: 3
        }
    }
}