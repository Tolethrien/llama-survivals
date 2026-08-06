import DogmaEntity from "@/core/dogma/entity";
import items from "../assets/items.json";
import { RENDER_LAYER } from "../scenes/battleScene";

export default class XPSmall extends DogmaEntity {
  constructor(pos: Position2D, target: Symbol) {
    super();
    this.addTag("Item");
    this.addTag("XP");
    this.addTag("XP_Small");

    this.addComponent("Transform", {
      position: pos,
      size: { height: items.xp_small.height, width: items.xp_small.width },
    });
    this.addComponent("Magnet", {
      pullStrength: 2,
      speed: 550,
      targetID: target,
    });
    this.addComponent("Sprite", {
      spriteName: "items",
      crop: items.xp_small,
      renderMode: "lerpPos",
      layer: RENDER_LAYER.onGround,
    });
  }
}
