class ProjectileEntity extends GameEntity {

    constructor(x, y, viewRef, opts) {
        super(x, y, viewRef, opts);
        const sheet = SpriteSheetSvc[opts.spriteSheet];
        this.sprite = sheet.get(0, 0).place(x, y);
        this.sprite.setShadow(opts.shadowColor, opts.shadowBlur);
        this.adds(this.sprite);
        this.accuracy = opts.accuracy;
        this.duration = new DurationCounter(opts.duration);
        this.moveAnimation.set(this.sprite, opts.moveAnimationBreakpoins);
    }

    update() {
        if(this.expired) {
            return;
        }
        // FIXME remove this test code
        for(let m of this.viewRef.monsters.children) {
            if(!m.expired && Mx.Geo.Collision.circleVsCircle(this.hitcircle, m.hitcircle)) {
                m.damage(0, this); // TODO damage calc here
                this.destroy();
            }
        }

        if(this.duration.tick().over()) {
            this.destroy();
        }
    }

    fire(dir) {
        // TODO this is default, could be overriden and dir replaced by ...args
        dir += this.viewRef.rng.float(-this.accuracy, this.accuracy);
        this.movePolar(dir, 40);
        this.acceleratePolar(dir, this.moveSpeed);
        return this;
    }

    movePolar(phi, r) {
        super.movePolar(phi, r);
        this.sprite.setRotation(phi + Math.PI/2);
        return this;
    }

}