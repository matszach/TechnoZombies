const MxEx = {

    BasicCooldownAbility: class {

        constructor(userRef, cooldown = 0) {
            this.userRef = userRef;
            this.cooldownMax = cooldown;
            this.cooldownLeft = 0;
        }
    
        handle(args, shouldFire = false) {
            this.cooldownLeft--;
            if(shouldFire && this.cooldownLeft < 0) {
                this.use(...args);
                this.cooldownLeft = this.cooldownMax;
            }
        }
    
        use(...args) {
            // abstract
        }
    
    }

}


// enabling node.js imports
if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = MxEx;
}