import DogmaSystem from "@/core/dogma/system";
import Time from "@/core/engine/time";

export type BuffDefinition = {
  label: string;
  onApply: (ownerID: Symbol, system: DogmaSystem) => void;
  onExpire: (ownerID: Symbol, system: DogmaSystem) => void;
};

export const BUFF_POOL = {
  speedBuff: {
    label: "Speed Buff",
    onApply: (ownerID, system) => {
      const stats = system.getComponent(ownerID, "Rigid")!;
      stats.speed += 200;
    },
    onExpire: (ownerID, system) => {
      const stats = system.getComponent(ownerID, "Rigid")!;
      stats.speed += 200;
    },
  },
  timeSlow: {
    label: "Time is like something... slower",
    onApply: () => {
      Time.setLerpTimeSpeed(0.1, 1);
    },
    onExpire: () => {
      Time.setLerpTimeSpeed(1, 1);
    },
  },
} satisfies Record<string, BuffDefinition>;
