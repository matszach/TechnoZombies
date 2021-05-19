class SpriteSheetSvc {

    static _load(name, sw, sh, border = 1) {
        return new Mx.SpriteSheet(`./assets/img/${name}.png`,  sw * 4, sh * 4, border * 4);
    }

    static player = this._load('player', 24, 24);
    static green_laser = this._load('green_laser', 24, 24);
    static green_spark = this._load('green_spark', 24, 24);
    static background = this._load('background', 400, 225);
    static zombie1 = this._load('zombie1', 24, 24);

}
