import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";

interface FractionProps {
  team: "player" | "enemy";
}
export default class Fraction extends DogmaComponent {
  team: FractionProps["team"];
  constructor(internal: InternalDCProps, props: FractionProps) {
    super(internal);
    this.team = props.team;
  }
}
