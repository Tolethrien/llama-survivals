import DogmaEntity from "@/core/dogma/entity";

export default class FireWall extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("Firewall");

    this.addComponent("Ability", {
      attackBehavior: {
        name: "static",
      },
      attackMeta: {
        baseDmg: 10,
        lifeSpan: 4,
        attackName: "firewall",
        hitType: "pierce",
        attackRange: "melee",
        damageType: "physical",
        impactType: "impact",
        onCasterDeath: "live",
      },
      spawnMode: {
        type: "spawnAtOnce",
        abilityDelay: 2,
        count: 1,
        where: "randomPoint",
        angleStep: 0,
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
