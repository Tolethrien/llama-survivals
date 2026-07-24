import DogmaEntity from "@/core/dogma/entity";

export default class Skulls extends DogmaEntity {
  constructor(parentID: Symbol) {
    super();
    this.addTag("ability");
    this.addTag("Skulls");

    this.addComponent("Ability", {
      attackBehavior: {
        name: "orbit",
        orbitSpeed: 100,
        radius: { x: 400, y: 400 },
        startAngle: 0,
      },
      attackMeta: {
        baseDmg: 15,
        lifespan: 3.5,
        name: "skull",
        hitType: "pierce",
      },
      spawnMode: { type: "spawn", delay: 0.5, where: "onSelf" },
      directionStrategy: "none",
    });
    this.addComponent("Relation", { parentChar: parentID });
  }
}
