import DogmaEntity from "@/core/dogma/entity";

export default class Skulls extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("Skulls");

    // this.addComponent("Ability", {
    //   attackBehavior: {
    //     name: "orbit",
    //     orbitSpeed: 100,
    //     radius: { x: 400, y: 400 },
    //     startAngle: 0,
    //   },
    //   attackMeta: {
    //     baseDmg: 15,
    //     lifespan: 0,
    //     name: "skull",
    //     hitType: "pierce",
    //   },
    //   spawnMode: {
    //     type: "persistent",
    //     delay: 0,
    //     where: "onSelf",
    //     count: 6,
    //     angleStep: 60,
    //   },
    //   directionStrategy: { name: "none" },
    // });

    this.addComponent("Ability", {
      attackBehavior: {
        name: "orbit",
        orbitSpeed: 50,
        radius: { x: 400, y: 400 },
        startAngle: 0,
      },
      attackMeta: {
        baseDmg: 15,
        lifeSpan: 0,
        attackName: "skull",
        hitType: "pierce",
        attackRange: "projectile",
        damageType: "physical",
        impactType: "impact",
        onCasterDeath: "remove",
      },
      spawnMode: {
        type: "persistent",
        abilityDelay: 0,
        where: "onSelf",
        count: 6,
        angleStep: 60,
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
