class PlayerLaserAttackAbility extends MxEx.BasicCooldownAbility {

    use(direction) {
        const {x, y, viewRef} = this.userRef;
        const p = new ProjectileEntity(x, y, viewRef, PROJECTILE_TMPL.PLAYER_LASER).fire(direction);
        viewRef.projectiles.add(p);
    }

}