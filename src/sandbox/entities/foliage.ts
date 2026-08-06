import AxiomMath from "@/core/axiom/math";
import DogmaEntity from "@/core/dogma/entity";
import foliageData from "@/sandbox/assets/foliage.json";
import { RENDER_LAYER } from "../scenes/battleScene";
const WEIGHTS = Object.entries(foliageData).map((item) => item[1].weight);
const KEYS = Object.entries(foliageData).map((item) => item[0]);
export default class Foliage extends DogmaEntity {
  constructor(pos: Position2D) {
    super();

    const randomFoliageKey = AxiomMath.weightedRandom(
      KEYS,
      WEIGHTS,
    ) as keyof typeof foliageData;
    const crop = foliageData[randomFoliageKey];
    this.addComponent("Sprite", {
      crop,
      layer: RENDER_LAYER.main,
      renderMode: "lerpPos",
      spriteName: "foliage",
    });
    this.addComponent("Transform", {
      position: pos,
      size: { width: 128, height: 128 },
    });
  }
}
