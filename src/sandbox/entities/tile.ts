import DogmaEntity from "@/core/dogma/entity";
import grounds from "../assets/ground.json";
import { RENDER_LAYER } from "../scenes/battleScene";
import AxiomMath from "@/core/axiom/math";

interface TileProps {
  position: Position2D;
}
export default class Tile extends DogmaEntity {
  constructor(props: TileProps) {
    super();
    this.addComponent("Transform", {
      position: props.position,
      size: { height: 64, width: 64 },
    });
    const int = AxiomMath.randomInt(0, 2);
    const crop = grounds[`tile${int}`] as Crop;
    this.addComponent("Sprite", {
      spriteName: "ground",
      crop: crop,
      renderMode: "lerpPos",
      layer: RENDER_LAYER.ground,
    });
  }
}
