import DogmaEntity from "@/core/dogma/entity";

export default class Slash extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("Slash");
    this.addComponent("Ability", {
      attackBehavior: {
        name: "stick",
        angle: 0,
        distance: 0,
        direction: { name: "towardsFacing" },
      },
      attackMeta: {
        baseDmg: 12,
        lifeSpan: 1,
        attackName: "skull",
        hitType: "pierce",
        attackRange: "melee",
        damageType: "physical",
        impactType: "impact",
      },
      spawnMode: {
        type: "spawnAtOnce",
        where: "inFront",
        count: 1,
        angleStep: 0,
        abilityDelay: 3,
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
