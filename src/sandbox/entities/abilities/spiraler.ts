import DogmaEntity from "@/core/dogma/entity";

export default class Spiraler extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("Spiraler");

    this.addComponent("Ability", {
      attackBehavior: {
        name: "projectile",
        movementSpeed: 500,
        direction: { name: "angle", deg: 0 },
      },
      attackMeta: {
        baseDmg: 15,
        lifeSpan: 2,
        attackName: "purpleArrow",
        hitType: "pierce",
        attackRange: "projectile",
        damageType: "physical",
        impactType: "impact",
      },
      spawnMode: {
        type: "spawnOnDelay",
        abilityDelay: 3,
        where: "onSelf",
        count: 10,
        angleStep: 360 / 10, // 16 × 22.5° = 360° — pełny obrót
        delay: 0.3, // odstęp między kolejnymi strzałami w serii (dawne burstInterval)
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
