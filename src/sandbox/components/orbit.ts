import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";

interface OrbitProps {
  targetID: Symbol;
  radius: Position2D;
  orbitSpeed: number; // stopnie/sekunde, ujemne = przeciwny kierunek
  startAngle?: number;
}

export default class Orbit extends DogmaComponent {
  public targetID: Symbol;
  public radius: Position2D;
  public orbitSpeed: number;
  public angleDeg: number;
  public prevAngle: number;

  constructor(internalProps: InternalDCProps, props: OrbitProps) {
    super(internalProps);
    this.targetID = props.targetID;
    this.orbitSpeed = props.orbitSpeed;
    this.angleDeg = props.startAngle ?? 0;
    this.prevAngle = this.angleDeg;
    this.radius = props.radius;
  }
}
