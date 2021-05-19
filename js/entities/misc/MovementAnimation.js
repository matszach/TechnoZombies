class MovementAnimation {

    constructor(sprite, breakpoins) {
        this.frame = 0;
        this.sprite = sprite;
        this.breakpoins = breakpoins;
    }

    set(sprite, breakpoins) {
        this.frame = 0;
        this.sprite = sprite;
        this.breakpoins = breakpoins;
    }

    tick(shouldTick = true) {
        if(shouldTick) {
            this.frame++;
            const t = this.frame % this.breakpoins[3];
            if(t < this.breakpoins[0]) {
                this.sprite.setFrame(0, 0);
            } else if(t < this.breakpoins[1]) {
                this.sprite.setFrame(1, 0);
            } else if(t < this.breakpoins[2]) {
                this.sprite.setFrame(0, 0);
            } else {
                this.sprite.setFrame(2, 0);
            }
        }
    }

}