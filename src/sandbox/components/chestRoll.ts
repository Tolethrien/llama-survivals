import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
import { ITEM_POOL } from "../db/items";

export type ChestRollState =
  | { phase: "idle" }
  | {
      phase: "rolling";
      winningItem: keyof typeof ITEM_POOL;
      elapsed: number;
      duration: number;
      currentDisplay: keyof typeof ITEM_POOL;
      nextSwitchAt: number;
    }
  | {
      phase: "settled";
      item: keyof typeof ITEM_POOL;
      decayElapsed: number;
      decayDuration: number;
    };

export default class ChestRoll extends DogmaComponent {
  public state: ChestRollState;
  constructor(internal: InternalDCProps) {
    super(internal);
    this.state = { phase: "idle" };
  }
}
