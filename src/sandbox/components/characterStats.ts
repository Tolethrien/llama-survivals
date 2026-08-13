import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
import { AttackMeta } from "../managers/attackManager";
interface CharStats {
  minHP: number;
  maxHP: number;
  swingSpeedInc: number;
  damageIncrease: number;
  DamageTypeIncrease: Record<AttackMeta["damageType"], number>;
  resist: Record<AttackMeta["damageType"], number>;
  maxResist: Record<AttackMeta["damageType"], number>;
  coinCollectRadius: number;
  healOnKill: number;
  passiveHeal: number;
}
interface StatsProps {
  minHP: CharStats["minHP"];
  maxHP: CharStats["maxHP"];
  swingSpeedInc: CharStats["swingSpeedInc"];
  damageIncrease: CharStats["damageIncrease"];
  DamageTypeIncrease: CharStats["DamageTypeIncrease"];
  resist: CharStats["resist"];
  maxResist: CharStats["maxResist"];
  coinCollectRadius?: CharStats["coinCollectRadius"];
  healOnKill?: CharStats["healOnKill"];
  passiveHeal?: CharStats["passiveHeal"];
}
export default class CharacterStats extends DogmaComponent {
  public minHP: CharStats["minHP"];
  public maxHP: CharStats["maxHP"];
  public currentHP: number;
  public swingSpeedInc: CharStats["swingSpeedInc"];
  public damageIncrease: CharStats["damageIncrease"];
  public DamageTypeIncrease: CharStats["DamageTypeIncrease"];
  public resist: CharStats["resist"];
  public maxResist: CharStats["maxResist"];
  public coinCollectRadius: CharStats["coinCollectRadius"];
  public healOnKill: CharStats["healOnKill"];
  public passiveHeal: CharStats["passiveHeal"];
  constructor(internalProps: InternalDCProps, props: StatsProps) {
    super(internalProps);
    this.minHP = props.minHP;
    this.maxHP = props.maxHP;
    this.currentHP = props.maxHP;
    this.swingSpeedInc = props.swingSpeedInc;
    this.damageIncrease = props.damageIncrease;
    this.DamageTypeIncrease = props.DamageTypeIncrease;
    this.resist = props.resist;
    this.maxResist = props.maxResist;
    this.coinCollectRadius = props.coinCollectRadius ?? 0;
    this.healOnKill = props.healOnKill ?? 0.005;
    this.passiveHeal = props.passiveHeal ?? 0.0001;
  }
}
