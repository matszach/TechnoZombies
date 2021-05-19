class PlayerEntity extends CreatureEntity {

    constructor(x, y, viewRef, opts) {
        super(x, y, viewRef, opts);
    }

    update() {
        this.faceCursor();
        this.handleMovementKeys();
    }

    faceCursor() {
        this.top.setRotation(this.directionToCursor() + Math.PI/2);
    }

    handleMovementKeys() {
        // get input 
        const {KeyW, KeyA, KeyS, KeyD} = this.viewRef.input.keys();
        const {xInMouse: mx, yInMouse: my, left: mleft, right: mright} = this.viewRef.input.mouse();
        const mdir = this.directionToCursor();
        // movement
        const x = 0 + (KeyA ? -1 : 1) + (KeyD ? 1 : -1);
        const y = 0 + (KeyW ? -1 : 1) + (KeyS ? 1 : -1);
        if(!(x === 0 && y === 0)) {
            const {phi} = Mx.Geo.toPolar(x, y);
            this.movePolar(phi, this.moveSpeed);
        }
        // attacks
        if(mleft) {
            const p = new ProjectileEntity(this.x, this.y, this.viewRef, PROJECTILE_TMPL.PLAYER_LASER_1).fire(mdir);
            this.viewRef.projectiles.add(p);
        }
    }

}