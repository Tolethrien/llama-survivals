import DogmaEntity from "@/core/dogma/entity";

export default class ArrowMachine extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("ArrowMachine");

    this.addComponent("Ability", {
      attackBehavior: {
        name: "projectile",
        direction: { name: "towardsFacing" },
        movementSpeed: 500,
      },
      attackMeta: {
        baseDmg: 15,
        lifeSpan: 2,
        attackName: "arrow",
        hitType: "hit",
        attackRange: "projectile",
        damageType: "physical",
        impactType: "impact",
        onCasterDeath: "live",
      },
      spawnMode: {
        type: "spawnAtOnce",
        abilityDelay: 2,
        count: 1,
        where: "onSelf",
        angleStep: 0,
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
