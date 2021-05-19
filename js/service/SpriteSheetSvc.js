class SpriteSheetSvc {

    static _load(name, sw, sh, border = 1) {
        return new Mx.SpriteSheet(`./assets/img/${name}.png`,  sw * 4, sh * 4, border * 4);
    }

    static player = this._load('player', 24, 24);
    static player_laser_1 = this._load('player_laser_1', 24, 24);
    static background = this._load('background', 400, 225);

}
