class PlayerLaserAttackAbility extends MxEx.BasicCooldownAbility {

    use(direction) {
        const {x, y, viewRef} = this.userRef;
        const laser = new ProjectileEntity(x, y, viewRef, PROJECTILE_TMPL.GREEN_LASER).fire(direction);
        viewRef.playerProjectiles.add(laser);
    }

}