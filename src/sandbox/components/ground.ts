import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
interface TransformProps {
  cropRNG: number;
}
export default class Ground extends DogmaComponent {
  public crop: Crop;
  public spriteName: string;
  constructor(internalProps: InternalDCProps, props: TransformProps) {
    super(internalProps);
    this.spriteName = "ground";
    this.crop = {
      x: props.cropRNG * 64,
      y: 0,
      width: 64,
      height: 64,
    };
  }
}
