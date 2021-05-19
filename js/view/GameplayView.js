class GameplayView extends Mx.View {

    onCreate() {
        // misc
        this.rng = Mx.Rng.fromMathRandom();
        this.monsterSpawner = new MonsterSpawner(this);
        // gameplay layer
        this.gameplayLayer = new Mx.Layer();
        this.background = SpriteSheetSvc.background.get(0, 0).place(0, 0);
        this.floorParticles = new Mx.Container();
        this.monsters = new Mx.Container();
        this.player = new PlayerEntity(0, 0, this, CREATURE_TMPL.PLAYER);
        this.monsterProjectiles = new Mx.Container();
        this.playerProjectiles = new Mx.Container();
        this.airParticles = new Mx.Container();
        this.gameplayLayer.adds([
            this.background, 
            this.floorParticles, 
            this.monsters,
            this.player, 
            this.monsterProjectiles,
            this.playerProjectiles,
            this.airParticles, 
        ]);
    }

    onResize() {
        this.gameplayLayer.center(this.handler).scaleToSize(this.handler, DIMS.VW, DIMS.VH);
    }

    onUpdate() {
        this.cullEntities();
        this.monsterSpawner.handle();
        this.handler.clear();
        this.handler.handleLayers(this.gameplayLayer);
    }

    cullEntities() {
        if(this.loop.tickCount % 30 === 0) {
            this.floorParticles.cull();
            this.monsters.cull();
            this.monsterProjectiles.cull();
            this.playerProjectiles.cull();
            this.airParticles.cull();
        }
    } 

}