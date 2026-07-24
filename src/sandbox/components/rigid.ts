import Vec2 from "@/core/axiom/vec2";
import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
interface RigidProps {
  velocity?: Position2D;
  speed?: number;
  friction?: number;
}
export default class Rigid extends DogmaComponent {
  public velocity: Vec2;
  public speed: number;
  public friction: number;

  constructor(internalProps: InternalDCProps, props?: RigidProps) {
    super(internalProps);
    this.velocity = props?.velocity
      ? Vec2.create(props.velocity.x, props.velocity.y)
      : Vec2.Zero;
    this.speed = props?.speed ?? 300;
    this.friction = props?.friction ?? 0.85;
  }
}
