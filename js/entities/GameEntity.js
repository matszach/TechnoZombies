class GameEntity extends Mx.Container {

    constructor(x, y, viewRef, opts) {
        super(x, y);
        this.viewRef = viewRef;
        this.hitcircle = new Mx.Geo.Circle(x, y, opts.hitCircleRadius, COLOR.HITCIRCLE).hide();
        this.add(this.hitcircle);
        this.moveSpeed = opts.moveSpeed;
        this.moveAnimation = new MovementAnimation(null, null);
    }

    move(x, y) {
        super.move(x, y);
        this.moveAnimation.tick(x !== 0 || y !== 0);
        return this;
    }
    
    showHitCircle() {
        this.hitcircle.show();
        return this;
    }

    hideHitCircle() {
        this.hitcircle.hide();
        return this;
    }

    getBoundingCircle() {
        return this.hitcircle;
    }

}