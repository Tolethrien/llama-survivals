import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import Time from "@/core/engine/time";
import { BUFF_POOL } from "../db/buffs";

export class Buffs extends DogmaSystem {
  constructor(internal: InternalDSProps) {
    super(internal);
  }
  public onStart(): void {
    this.subscribeToPhase({
      callback: this.update.bind(this),
      phase: "update",
    });
  }
  private update() {
    const buffs = this.getComponentList("BuffList");
    if (!buffs) return;
    const dt = Time.getUnscaledDeltaTime();
    buffs.forEach((component) => {
      for (let i = component.buffs.length - 1; i >= 0; i--) {
        const buffEntry = component.buffs[i];
        console.log("tick");
        if (buffEntry.type !== "time") continue;
        buffEntry.timer -= dt;
        if (buffEntry.timer <= 0) {
          const buff = BUFF_POOL[buffEntry.name];
          component.buffs.splice(i, 1);
          buff.onExpire(component.ID, this);
        }
      }
    });
  }
}
