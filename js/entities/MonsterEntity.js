class MonsterEntity extends CreatureEntity {

    constructor(x, y, viewRef, opts) {
        super(x, y, viewRef, opts);
    }

    update() {
        const {x, y} = this.viewRef.player;
        const dir = this.directionTo(x, y);
        this.movePolar(dir, this.moveSpeed);
        this.top.setRotation(dir + Math.PI/2);
    }

    onDamage(source) {
        const blood = new ParticleEntity(this.x, this.y, this.viewRef, PARTICLE_TMPL.BLOOD_AIR_1);
        blood.fire(this.viewRef.rng.float(0, Math.PI * 2));
        this.viewRef.airParticles.add(blood);
    }

    onDestroy(source) {
        console.log(source);
        for(let i = 0; i < 10; i++) {
            const blood = new ParticleEntity(this.x, this.y, this.viewRef, PARTICLE_TMPL.BLOOD_AIR_1);
            const dir = source.sprite.rotation - Math.PI/2 + this.viewRef.rng.float(-0.5, 0.5);
            blood.fire(dir);
            this.viewRef.airParticles.add(blood);
        }
    }

}