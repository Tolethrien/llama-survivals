import DogmaEntity from "@/core/dogma/entity";

export default class Fireball extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("Fireball");

    this.addComponent("Ability", {
      attackBehavior: {
        name: "projectile",
        direction: { name: "towardsFacing" },
        movementSpeed: 500,
      },
      attackMeta: {
        baseDmg: 20,
        lifeSpan: 2,
        attackName: "fireball",
        hitType: "hit",
        attackRange: "projectile",
        damageType: "physical",
        impactType: "impact",
        onCasterDeath: "live",
      },
      spawnMode: {
        type: "spawnAtOnce",
        abilityDelay: 1,
        count: 1,
        where: "onSelf",
        angleStep: 0,
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
