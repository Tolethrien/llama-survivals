import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
interface RelationProps {
  parentChar?: Symbol;
  parentAbility?: Symbol;
  children?: Symbol[];
}
export default class Relation extends DogmaComponent {
  public parentChar: Symbol | undefined;
  public parentAbility: Symbol | undefined;
  public children: Set<Symbol>;
  constructor(internalProps: InternalDCProps, props: RelationProps) {
    super(internalProps);
    this.parentChar = props.parentChar ?? undefined;
    this.parentAbility = props.parentAbility ?? undefined;
    this.children = new Set(props.children) ?? new Set();
  }
}
