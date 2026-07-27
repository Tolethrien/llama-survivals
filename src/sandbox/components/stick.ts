import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
interface StickProps {
  distance: number;
  angle: number;
  targetID: Symbol;
  anchor: "feet" | "center";
}
export default class Stick extends DogmaComponent {
  public distance: number;
  public angle: number;
  public targetID: Symbol;
  public anchor: "feet" | "center";
  constructor(internalProps: InternalDCProps, props: StickProps) {
    super(internalProps);
    this.distance = props.distance;
    this.targetID = props.targetID;
    this.angle = props.angle;
    this.anchor = props.anchor;
  }
}
