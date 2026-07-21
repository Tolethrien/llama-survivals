import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
import { AttackRange } from "../managers/attackManager";

interface EnemyAIProps {
  pushForce?: number;
  personalSpace?: number;
  attackRange: number;
  flankRange: number;
  attackRangeType: AttackRange;
}
export type EnemyState = "swarm" | "combat";
export default class EnemyAI extends DogmaComponent {
  public pushForce: number;
  public personalSpace: number;
  public state: EnemyState;
  public attackRange: number;
  public flankRange: number;
  public attackRangeType: AttackRange;
  constructor(internalProps: InternalDCProps, props?: EnemyAIProps) {
    super(internalProps);
    this.pushForce = props?.pushForce ?? 1.5;
    this.personalSpace = props?.personalSpace ?? 1.2;
    this.attackRange = props?.attackRange ?? 100;
    this.flankRange = props?.flankRange ?? 0;
    this.attackRangeType = props?.attackRangeType ?? "melee";
    this.state = "swarm";
  }
}
