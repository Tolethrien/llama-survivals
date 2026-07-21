import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
interface TransformProps {
  position: Position2D;
  size: Size2D;
}
export default class Transform extends DogmaComponent {
  public position: Position2D;
  public prevPosition: Position2D;
  public size: Size2D;
  constructor(internalProps: InternalDCProps, props: TransformProps) {
    super(internalProps);
    this.position = { x: props.position.x, y: props.position.y };
    this.prevPosition = { x: props.position.x, y: props.position.y };
    this.size = { width: props.size.width, height: props.size.height };
  }
}
