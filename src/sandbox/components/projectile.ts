import Vec2 from "@/core/axiom/vec2";
import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
interface ProjectileProps {
  velocity?: Position2D;
  speed?: number;
}
export default class Projectile extends DogmaComponent {
  public velocity: Vec2;
  public speed: number;

  constructor(internalProps: InternalDCProps, props?: ProjectileProps) {
    super(internalProps);
    this.velocity = props?.velocity
      ? Vec2.create(props.velocity.x, props.velocity.y)
      : Vec2.Zero;
    this.speed = props?.speed ?? 300;
  }
}
