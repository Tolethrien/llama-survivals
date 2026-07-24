import Vec2 from "@/core/axiom/vec2";
import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
interface TransformProps {
  position: Position2D;
  size: Size2D;
}
export default class Transform extends DogmaComponent {
  public position: Vec2;
  public prevPosition: Vec2;
  public size: Size2D;
  constructor(internalProps: InternalDCProps, props: TransformProps) {
    super(internalProps);
    this.position = Vec2.create(props.position.x, props.position.y);
    this.prevPosition = Vec2.create(props.position.x, props.position.y);
    this.size = { width: props.size.width, height: props.size.height };
  }
}
