import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
interface RigidProps {
  velocity?: Position2D;
  speed?: number;
  friction?: number;
}
export default class Rigid extends DogmaComponent {
  public velocity: Position2D;
  public speed: number;
  public friction: number;

  constructor(internalProps: InternalDCProps, props?: RigidProps) {
    super(internalProps);
    this.velocity = props?.velocity
      ? { x: props.velocity.x, y: props.velocity.y }
      : { x: 0, y: 0 };
    this.speed = props?.speed ?? 300;
    this.friction = props?.friction ?? 0.85;
  }
}
