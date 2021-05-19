class MonsterEntity extends CreatureEntity {

    constructor(x, y, viewRef, opts) {
        super(x, y, viewRef, opts);
    }

    update() {
        const {x, y} = this.viewRef.player;
        const dir = this.directionTo(x, y);
        this.movePolar(dir, this.moveSpeed);
        this.top.rotation = dir + Math.PI/2;
    }

}