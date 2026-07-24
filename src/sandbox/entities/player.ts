import DogmaEntity from "@/core/dogma/entity";
import MobCrops from "../assets/monsters.json";
import { RENDER_LAYER } from "../scenes/battleScene";

export default class Player extends DogmaEntity {
  constructor() {
    super();
    const pos: Position2D = { x: 1300, y: 1300 };
    this.setMarker("Player");
    this.addTag("Player");
    this.addTag("invincible");
    this.addComponent("Transform", {
      position: pos,
      size: { height: MobCrops.ork.height, width: MobCrops.ork.width },
    });
    this.addComponent("Fraction", { team: "player" });
    this.addComponent("CharacterStats", {
      maxHP: 100,
      minHP: 0,
      damageIncrease: 10,
      DamageTypeIncrease: {
        cold: 0,
        energy: 0,
        fire: 0,
        heal: 0,
        physical: 0,
        poison: 0,
      },
      maxResist: {
        cold: 0,
        energy: 0,
        fire: 0,
        heal: 0,
        physical: 0,
        poison: 0,
      },
      resist: { cold: 0, energy: 0, fire: 0, heal: 0, physical: 0, poison: 0 },
      swingSpeedInc: 0,
    });

    this.addComponent("Equipment", { slots: ["Skulls"] });
    this.addComponent("Rigid", { speed: 300 });
    this.addComponent("Collider", {
      shape: "rect",
      sizeOffset: { width: -30, height: -30 },
      posOffset: { x: 0, y: 15 },
    });
    this.addComponent("Sprite", {
      spriteName: "mobs",
      crop: MobCrops.ork,
      tint: [200, 100, 80, 255],
      renderMode: "lerpPos",
      layer: RENDER_LAYER.chars,
    });
  }
}
