class CreatureEntity extends GameEntity {

    constructor(x, y, viewRef, opts) {
        super(x, y, viewRef, opts);
        const sheet = SpriteSheetSvc[opts.spriteSheet];
        this.bottom = sheet.get(0, 0).place(x, y);
        this.bottom.setShadow(opts.shadowColor, opts.shadowBlur);
        this.top = sheet.get(0, 1).place(x, y);
        this.top.setShadow(opts.shadowColor, opts.shadowBlur);
        this.adds(this.bottom, this.top);
        this.moveAnimation.set(this.bottom, opts.moveAnimationBreakpoins);
    }

    movePolar(phi, r) {
        super.movePolar(phi, r);
        this.bottom.setRotation(phi + Math.PI/2);
        return this;
    }

}