import DogmaEntity from "@/core/dogma/entity";
import items from "../assets/items.json";
import { RENDER_LAYER } from "../scenes/battleScene";

export default class XPSmall extends DogmaEntity {
  constructor(pos: Position2D, target: Symbol) {
    super();
    this.addTag("Item");
    this.addTag("XP");
    this.addTag("XP_Small");
    const crop = items.xpSmall;
    this.addComponent("Transform", {
      position: pos,
      size: {
        height: crop.height * 1.2,
        width: crop.width * 1.2,
      },
    });
    this.addComponent("Magnet", {
      pullStrength: 2,
      speed: 550,
      targetID: target,
    });
    this.addComponent("Sprite", {
      spriteName: "items",
      crop: crop,
      renderMode: "lerpPos",
      layer: RENDER_LAYER.onGround,
    });
  }
}
