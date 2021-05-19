class MonsterSpawner {

    constructor(viewRef) {
        this.viewRef = viewRef;
        this.rng = viewRef.rng;
    }

    handle() {
        if(this.rng.chance(0.05)) {
            const m = new MonsterEntity(this.rng.float(-800, 800), this.rng.float(-450, 450), this.viewRef, CREATURE_TMPL.ZOMBIE_1);
            this.viewRef.monsters.add(m);
            return this;
        }
        
    }

}