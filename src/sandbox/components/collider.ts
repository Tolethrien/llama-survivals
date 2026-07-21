import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
export type ColliderShape = "rect" | "circle";
interface ColliderProps {
  shape: ColliderShape;
  active?: boolean;
  sizeOffset?: Size2D;
  posOffset?: Position2D;
}
export default class Collider extends DogmaComponent {
  shape: ColliderShape;
  active: boolean;
  sizeOffset: Size2D;
  posOffset: Position2D;
  constructor(internalProps: InternalDCProps, props: ColliderProps) {
    super(internalProps);
    this.shape = props.shape;
    this.active = props.active ?? true;
    this.sizeOffset = props.sizeOffset ?? { height: 0, width: 0 };
    this.posOffset = props.posOffset ?? { x: 0, y: 0 };
  }
}
