import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import Time from "@/core/engine/time";
import { BUFF_POOL } from "../db/buffs";
import Draw from "@/core/aurora/draw";
import Aurora from "@/core/aurora/core";
import AxiomMath from "@/core/axiom/math";
const GAP = 50;
export class Buffs extends DogmaSystem {
  constructor(internal: InternalDSProps) {
    super(internal);
  }
  public onStart(): void {
    this.subscribeToPhase({
      callback: this.update.bind(this),
      phase: "update",
    });
    this.subscribeToPhase({
      callback: this.buffRender.bind(this),
      phase: "render",
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
        buffEntry.currentTime -= dt;
        if (buffEntry.currentTime <= 0) {
          const buff = BUFF_POOL[buffEntry.name];
          component.buffs.splice(i, 1);
          buff.onExpire(component.ID, this);
        }
      }
    });
  }
  private buffRender() {
    const playerBuffs = this.getComponentWithMarker("Player", "BuffList")!;
    const buffList = playerBuffs.buffs;
    const iconSize = 44;
    const bottomGap = 50;
    const y = Aurora.canvas.height - bottomGap - iconSize;

    const totalWidth = (buffList.length - 1) * GAP + iconSize;
    const startX = (Aurora.canvas.width - totalWidth) / 2;

    for (let index = 0; index < buffList.length; index++) {
      const entry = buffList[index];
      const alpha = AxiomMath.map(entry.currentTime, 0, entry.timer, 0, 1);
      const def = BUFF_POOL[entry.name];
      Draw.guiRect({
        position: { x: startX + index * GAP, y },
        crop: def.crop,
        size: { width: iconSize, height: iconSize },
        background: "icons",
        tint: [255, 255, 255, alpha * 255],
      });
    }
  }
}
