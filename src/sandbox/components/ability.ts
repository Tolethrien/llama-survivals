import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
import {
  AttackBehavior,
  AttackMeta,
  SpawnMode,
} from "../managers/attackManager";

interface AbilityProps {
  spawnMode: DistributiveOmit<SpawnMode, "spawned">;
  attackBehavior: AttackBehavior;
  attackMeta: AttackMeta;
}

export default class Ability extends DogmaComponent {
  public spawnMode: SpawnMode;
  public attackBehavior: AbilityProps["attackBehavior"];
  public attackLifespan: AbilityProps["attackMeta"];
  public abilityDelay: AbilityProps["spawnMode"]["abilityDelay"];
  public attackMeta: AbilityProps["attackMeta"];
  public cooldown: number = 0;
  public burstRemaining: number = 0;
  public burstIndex: number = 0;
  public burstTimer: number = 0;
  constructor(internalProps: InternalDCProps, props: AbilityProps) {
    super(internalProps);
    this.spawnMode = { ...props.spawnMode, spawned: false };
    this.attackBehavior = props.attackBehavior;
    this.attackLifespan = props.attackMeta;
    this.abilityDelay = props.spawnMode.abilityDelay;
    this.attackMeta = props.attackMeta;
  }
}
