import DogmaSystem from "@/core/dogma/system";
import Time from "@/core/engine/time";
import icons from "@sandbox/assets/icons.json";
export type BuffDefinition = {
  label: string;
  crop: Crop;
  onApply: (ownerID: Symbol, system: DogmaSystem) => void;
  onExpire: (ownerID: Symbol, system: DogmaSystem) => void;
};
export const BUFF_POOL = {
  timeSlow: {
    label: "time slow down for 8s",
    crop: icons.hasteRunColor,
    onApply: () => {
      Time.setLerpTimeSpeed(0.3, 1);
    },
    onExpire: () => {
      Time.setLerpTimeSpeed(1, 1);
    },
  },
  invincible: {
    label: "cover player with invincible magic barier for 5s",
    crop: icons.spiritGuardColor,
    onApply: (_, system) => {
      const transform = system.getComponentWithMarker("Player", "Transform")!;
      transform.tags.add("invincible");
    },
    onExpire: (_, system) => {
      const transform = system.getComponentWithMarker("Player", "Transform")!;
      transform.tags.delete("invincible");
    },
  },
  deathIsNotTheAnser: {
    label: "deathIsNotTheAnser - you will live somewhere else now!",
    crop: icons.heartBeastColor,
    onApply: (_, system) => {
      const transform = system.getComponentWithMarker("Player", "Transform")!;
      transform.tags.add("secondLife");
    },
    onExpire: (_, system) => {
      const transform = system.getComponentWithMarker("Player", "Transform")!;
      transform.tags.delete("secondLife");
    },
  },
  likeAnOgre: {
    label: "you'r strong as ogre and fast as cheetah... for 30s",
    crop: icons.strengthFireArmColor,
    onApply: (_, system) => {
      const stats = system.getComponentWithMarker("Player", "CharacterStats")!;
      const rigid = system.getComponentWithMarker("Player", "Rigid")!;
      stats.damageIncrease += 0.2;
      stats.swingSpeedInc += 0.2;
      rigid.speed += 100;
    },
    onExpire: (_, system) => {
      const stats = system.getComponentWithMarker("Player", "CharacterStats")!;
      const rigid = system.getComponentWithMarker("Player", "Rigid")!;
      stats.damageIncrease -= 0.2;
      stats.swingSpeedInc -= 0.2;
      rigid.speed -= 100;
      const playerBuffs = system.getComponentWithMarker("Player", "BuffList")!;
      playerBuffs.buffs.push({
        currentTime: 10,
        timer: 10,
        name: "likeABitch",
        type: "time",
      });
      BUFF_POOL.likeABitch.onApply(stats.ID, system);
    },
  },
  likeABitch: {
    label: "you had to feel strong didn't ya?! now you sore for 10s!",
    crop: icons.flashGrayColor,
    onApply: (_, system) => {
      const stats = system.getComponentWithMarker("Player", "CharacterStats")!;
      const rigid = system.getComponentWithMarker("Player", "Rigid")!;
      stats.damageIncrease -= 0.05;
      stats.swingSpeedInc -= 0.05;
      rigid.speed -= 50;
    },
    onExpire: (_, system) => {
      const stats = system.getComponentWithMarker("Player", "CharacterStats")!;
      const rigid = system.getComponentWithMarker("Player", "Rigid")!;
      stats.damageIncrease += 0.05;
      stats.swingSpeedInc += 0.05;
      rigid.speed += 50;
    },
  },
} satisfies Record<string, BuffDefinition>;
export const BUFF_KEYS = Object.keys(BUFF_POOL) as (keyof typeof BUFF_POOL)[];
