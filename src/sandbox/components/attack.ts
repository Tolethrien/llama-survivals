import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
import { DmgType, HitTracking } from "../managers/attackManager";
interface AttackProps {
  baseDamage: number;
  damageType: DmgType;
  hitType: HitTracking["hitType"];
  // impactType: number;
  // range: "melee" | "projectile";
}

export default class Attack extends DogmaComponent {
  public baseDamage: AttackProps["baseDamage"];
  public damageType: AttackProps["damageType"];
  public hitType: HitTracking["hitType"];
  public hitList: Set<Symbol> | Map<Symbol, number>;
  // public impactType: AttackProps["impactType"];
  // public attackRange: AttackProps["range"];
  constructor(internalProps: InternalDCProps, props: AttackProps) {
    super(internalProps);
    this.baseDamage = props.baseDamage;
    this.damageType = props.damageType;
    this.hitType = props.hitType;
    if (props.hitType === "aura") this.hitList = new Map();
    else this.hitList = new Set();
    // this.impactType = props.impactType;
    // this.attackRange = props.range;
  }
}
