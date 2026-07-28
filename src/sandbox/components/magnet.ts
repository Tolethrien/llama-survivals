import Vec2 from "@/core/axiom/vec2";
import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
type State = "idle" | "follow" | "gathered";
interface MagnetProps {
  targetID: Symbol;
  speed: number;
  pullStrength: number;
  range: number;
}
export default class Magnet extends DogmaComponent {
  public targetID: Symbol;
  public speed: number;
  public pullStrength: number;
  public range: number;
  public velocity: Vec2;
  public state: State;

  constructor(internalProps: InternalDCProps, props: MagnetProps) {
    super(internalProps);
    this.targetID = props.targetID;
    this.speed = props.speed;
    this.pullStrength = props.pullStrength;
    this.range = props.range;
    this.velocity = Vec2.Zero;
    this.state = "idle";
  }
}
