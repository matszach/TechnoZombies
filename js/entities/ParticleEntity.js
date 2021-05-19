class ParticleEntity extends GameEntity {

    constructor(x, y, viewRef, opts) {
        super(x, y, viewRef, opts);
        const sheet = SpriteSheetSvc[opts.spriteSheet];
        this.sprite = sheet.get(0, 0).place(x, y);
        this.sprite.setShadow(opts.shadowColor, opts.shadowBlur);
        this.adds(this.sprite);
        this.duration = new DurationCounter(opts.duration);
        this.moveAnimation.set(this.sprite, opts.moveAnimationBreakpoins);
        this.moveSpeed += viewRef.rng.float(-opts.moveSpeedOffset, opts.moveSpeedOffset);
    }

    update() {
        this.traction(0.95); // TODO export this to templates ?
        this.rotate(0.04); // TODO export this to templates ?
        if(this.duration.tick().over()) {
            this.destroy();
        }
    }

    fire(dir) {
        // TODO this is default, could be overriden and dir replaced by ...args
        this.movePolar(dir, 20);
        this.acceleratePolar(dir, this.moveSpeed);
        return this;
    }

}