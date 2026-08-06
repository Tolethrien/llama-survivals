import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
import { BUFF_POOL } from "../db/buffs";
interface BuffEntry {
  name: keyof typeof BUFF_POOL;
  timer: number;
  type: "time" | "permanent";
}
interface BuffProps {
  list?: BuffEntry[];
}
export default class BuffList extends DogmaComponent {
  public buffs: BuffEntry[];
  constructor(internal: InternalDCProps, props?: BuffProps) {
    super(internal);
    this.buffs = props?.list ?? [];
  }
}
