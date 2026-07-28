import DogmaEntity from "@/core/dogma/entity";

export default class WorldDir extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("WorldDir");

    // this.addComponent("Ability", {
    //   attackBehavior: {
    //     name: "rigid",
    //     movementSpeed: 500,
    //   },
    //   attackMeta: {
    //     baseDmg: 15,
    //     lifespan: 2,
    //     name: "purpleArrow",
    //     hitType: "pierce",
    //   },
    //   spawnMode: {
    //     type: "spawnOnDelay",
    //     delay: 3,
    //     where: "onSelf",
    //     count: 16,
    //     angleStep: 22.5, // 16 × 22.5° = 360° — pełny obrót
    //     burstInterval: 0.06,
    //   },
    //   directionStrategy: { name: "angle", deg: 0 },
    // });
    this.addComponent("Ability", {
      attackBehavior: {
        name: "projectile",
        movementSpeed: 500,
        direction: { name: "angle", deg: 45 },
      },
      attackMeta: {
        baseDmg: 15,
        lifeSpan: 2,
        attackName: "purpleArrow",
        hitType: "pierce",
        attackRange: "projectile",
        damageType: "physical",
        impactType: "impact",
        onCasterDeath: "live",
      },
      spawnMode: {
        type: "spawnAtOnce",
        abilityDelay: 3,
        where: "onSelf",
        count: 4,
        angleStep: 90,
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
