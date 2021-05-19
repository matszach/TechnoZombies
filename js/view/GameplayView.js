class GameplayView extends Mx.View {

    onCreate() {
        // misc
        this.rng = Mx.Rng.fromMathRandom();
        // gameplay layer
        this.gameplayLayer = new Mx.Layer();
        this.background = SpriteSheetSvc.background.get(0, 0).place(0, 0);4
        this.floorParticles = new Mx.Container();
        this.monsters = new Mx.Container();
        this.player = new PlayerEntity(0, 0, this, CREATURE_TMPL.PLAYER);
        this.airParticles = new Mx.Container();
        this.projectiles = new Mx.Container();
        this.gameplayLayer.adds([
            this.background, 
            this.floorParticles, 
            this.monsters,
            this.player, 
            this.airParticles, 
            this.projectiles
        ]);
    }

    onResize() {
        this.gameplayLayer.center(this.handler).scaleToSize(this.handler, DIMS.VW, DIMS.VH);
    }

    onUpdate() {
        this.handler.clear();
        this.handler.handleLayers(this.gameplayLayer);
    }

}