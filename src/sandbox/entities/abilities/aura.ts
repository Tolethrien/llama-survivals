import DogmaEntity from "@/core/dogma/entity";

export default class aura extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("Aura");

    this.addComponent("Ability", {
      attackBehavior: {
        name: "stick",
        angle: 0,
        direction: { name: "none" },
        distance: 0,
      },
      attackMeta: {
        baseDmg: 6,
        lifeSpan: 0,
        attackName: "fireball",
        hitType: "aura",
        attackRange: "melee",
        damageType: "physical",
        impactType: "impact",
      },
      spawnMode: {
        type: "persistent",
        abilityDelay: 5,
        angleStep: 0,
        count: 1,
        where: "onSelf",
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
