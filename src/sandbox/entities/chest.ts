import DogmaEntity from "@/core/dogma/entity";
import itemData from "@/sandbox/assets/items.json";
import { RENDER_LAYER } from "../scenes/battleScene";
export default class Chest extends DogmaEntity {
  constructor(pos: Position2D) {
    super();
    this.addTag("chest");
    const crop = itemData.chest;
    this.addComponent("Sprite", {
      crop,
      layer: RENDER_LAYER.main,
      renderMode: "lerpPos",
      spriteName: "items",
    });
    this.addComponent("Transform", {
      position: pos,
      size: { width: crop.width * 2, height: crop.height * 2 },
    });
    this.addComponent("ChestRoll");
  }
}
