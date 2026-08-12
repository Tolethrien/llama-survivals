import DogmaEntity from "@/core/dogma/entity";

export default class BananaSpread extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("BananaSpread");

    this.addComponent("Ability", {
      attackBehavior: {
        name: "projectile",
        direction: { name: "angle", deg: 0 },
        movementSpeed: 400,
      },
      attackMeta: {
        baseDmg: 10,
        lifeSpan: 2,
        attackName: "fireball",
        hitType: "hit",
        attackRange: "projectile",
        damageType: "physical",
        impactType: "impact",
        onCasterDeath: "live",
      },
      spawnMode: {
        type: "spawnOnDelay",
        abilityDelay: 3,
        count: 6,
        where: "onSelf",
        angleStep: 360 / 6,
        delay: 0.2,
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
