import DogmaEntity from "@/core/dogma/entity";

export default class VoidSpawn extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("VoidSpawn");
    this.addComponent("Ability", {
      attackBehavior: {
        name: "projectile",
        direction: { deg: 0, name: "angle" },
        movementSpeed: 300,
      },
      attackMeta: {
        baseDmg: 8,
        lifeSpan: 4,
        attackName: "vortex",
        hitType: "pierce",
        attackRange: "melee",
        damageType: "physical",
        impactType: "impact",
        onCasterDeath: "live",
      },
      spawnMode: {
        type: "spawnAtOnce",
        abilityDelay: 2,
        count: 2,
        where: "onSelf",
        angleStep: 360 / 2,
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
