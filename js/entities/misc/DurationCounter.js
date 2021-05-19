class DurationCounter {

    constructor(duration) {
        this.max = duration;
        this.left = duration;
    }

    tick() {
        this.left--
        return this;
    }

    over() {
        return this.left < 0;
    }

    reset() {
        this.left = this.max;
        return this;
    }

    fract() {
        return this.left/this.max;
    }

}