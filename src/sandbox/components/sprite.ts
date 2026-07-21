import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
type LerpMode = "lerpAngle" | "lerpPos";
interface SpriteProps {
  spriteName: string;
  crop: Crop;
  tint?: RGBA;
  renderMode: LerpMode;
  layer: number;
}
export default class Sprite extends DogmaComponent {
  spriteName: string;
  crop: Crop;
  tint: RGBA;
  renderMode: LerpMode;
  layer: number;

  constructor(internalProps: InternalDCProps, props: SpriteProps) {
    super(internalProps);
    this.spriteName = props.spriteName;
    this.crop = props.crop;
    this.tint = props.tint ?? [255, 255, 255, 255];
    this.renderMode = props.renderMode;
    this.layer = props.layer;
  }
}
