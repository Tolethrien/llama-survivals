import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
type ShapeType = "rect" | "circle";
interface ShapeProps {
  type: ShapeType;
  color: RGBA;
}
export default class Shape extends DogmaComponent {
  public color: RGBA;
  public type: ShapeType;

  constructor(internalProps: InternalDCProps, props: ShapeProps) {
    super(internalProps);
    this.color = props.color ?? [255, 255, 255, 255];
    this.type = props.type;
  }
}
