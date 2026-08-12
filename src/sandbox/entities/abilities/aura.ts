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
        attackName: "auraGold",
        hitType: "aura",
        attackRange: "melee",
        damageType: "physical",
        impactType: "overTime",
        onCasterDeath: "remove",
      },
      spawnMode: {
        type: "persistent",
        abilityDelay: 1,
        angleStep: 0,
        count: 1,
        where: "onSelf",
      },
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
