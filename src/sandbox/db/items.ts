import DogmaSystem from "@/core/dogma/system";
import { BUFF_POOL } from "./buffs";

export type ItemDefinition = {
  label: string;
  apply: (system: DogmaSystem) => void;
};

export const ITEM_POOL = {
  gatherCoins: {
    label: "Gather all XP from the map at once",
    apply: (system) => {
      system.events.emitDeferred("gatherAllCoins", {});
    },
  },
  timeSlow: {
    label: "Slow Time",
    apply: (system) => {
      const playerBuffs = system.getComponentWithMarker("Player", "BuffList")!;
      playerBuffs.buffs.push({ name: "timeSlow", timer: 5, type: "time" });
      BUFF_POOL.timeSlow.onApply();
    },
  },
} satisfies Record<string, ItemDefinition>;
