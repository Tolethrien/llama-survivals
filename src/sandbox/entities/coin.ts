import DogmaEntity from "@/core/dogma/entity";
import items from "../assets/items.json";
import { RENDER_LAYER } from "../scenes/battleScene";

export default class Coin extends DogmaEntity {
  constructor(pos: Position2D, target: Symbol) {
    super();
    this.addTag("Item");
    this.addTag("Coin");
    this.addComponent("Transform", {
      position: pos,
      size: { height: items.coin.height, width: items.coin.width },
    });
    this.addComponent("Magnet", {
      pullStrength: 2,
      range: 200,
      speed: 350,
      targetID: target,
    });
    this.addComponent("Sprite", {
      spriteName: "items",
      crop: items.coin,
      renderMode: "lerpPos",
      layer: RENDER_LAYER.onGround,
    });
  }
}
