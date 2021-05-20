const PARTICLE_TMPL = {
    GREEN_SPARK : {
        hitCircleRadius: 3, 
        spriteSheet: 'green_spark',
        shadowColor: '#00ff00',
        shadowBlur: 5,
        moveAnimationBreakpoins: [3, 6, 9, 12],
        moveSpeed: 5,
        moveSpeedOffset: 2,
        duration: {
            min: 20,
            max: 30
        }
    },
    BLOOD_AIR_1 : {
        hitCircleRadius: 3, 
        spriteSheet: 'blood_air_1',
        shadowColor: '#000000',
        shadowBlur: 5,
        moveAnimationBreakpoins: [10, 20, 30, 40],
        moveSpeed: 5,
        moveSpeedOffset: 4,
        duration: {
            min: 20,
            max: 70
        }
    },
    BLOOD_FLOOR_1 : {
        hitCircleRadius: 3, 
        spriteSheet: 'blood_floor_1',
        duration: {
            min: 300,
            max: 2000
        },
        spriteChoiceRange: {
            x: 4,
            y: 5
        }
    }
}