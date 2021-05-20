class FadingDebrisEntity extends GameEntity {

    constructor(x, y, viewRef, opts) {
        super(x, y, viewRef, opts);
        const sheet = SpriteSheetSvc[opts.spriteSheet];
        this.sprite = sheet.get(
            viewRef.rng.int(0, opts.spriteChoiceRange.x),
            viewRef.rng.int(0, opts.spriteChoiceRange.y)
        ).place(x, y).rotate(viewRef.rng.float(0, Math.PI * 2));
        this.sprite.setShadow(opts.shadowColor, opts.shadowBlur);
        this.adds(this.sprite);
        this.duration = new DurationCounter(viewRef.rng.float(opts.duration.min, opts.duration.max));
        this.moveAnimation.disable();
    }

    update() {
        this.sprite.setAlpha(this.duration.fract());
        if(this.duration.tick().over()) {
            this.destroy();
        }
    }

}