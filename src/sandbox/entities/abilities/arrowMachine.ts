import DogmaEntity from "@/core/dogma/entity";

export default class ArrowMachine extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("ArrowMachine");
    this.addComponent("Ability", {
      attackBehavior: {
        name: "rigid",
        movementSpeed: 500,
      },
      attackMeta: { baseDmg: 1, lifespan: 2, name: "arrow", hitType: "hit" },
      spawnMode: { type: "spawn", delay: 4, where: "onSelf" },
      directionStrategy: "towardsTarget",
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
