import DogmaEntity from "@/core/dogma/entity";

export default class FireMachineGun extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("FireMachine");

    this.addComponent("Ability", {
      attackBehavior: {
        name: "stick",
        distance: 0,
        angle: 0,
      },
      attackMeta: {
        baseDmg: 6,
        lifespan: 0,
        name: "fireball",
        hitType: "aura",
      },
      spawnMode: { type: "persistent", delay: 1, where: "onSelf" },
      directionStrategy: "none",
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
