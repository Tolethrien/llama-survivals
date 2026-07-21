import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
interface LifeSpanProps {
  span: number; // in seconds
}
export default class LifeSpan extends DogmaComponent {
  public span: number;
  public currentLife: number;
  constructor(internalProps: InternalDCProps, props: LifeSpanProps) {
    super(internalProps);
    this.span = props.span;
    this.currentLife = this.span;
  }
}
