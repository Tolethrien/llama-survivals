import DogmaSystem from "@/core/dogma/system";
import { BUFF_POOL } from "./buffs";
import icons from "@sandbox/assets/icons.json";
import EntityManager from "@/core/dogma/entityManager";
import { CoinSpawnEvent } from "../systems/xPGather";
import AuroraCamera from "@/core/aurora/camera";
import AxiomCollision from "@/core/axiom/collision";
import AABB from "@/core/axiom/AABB";
export type ItemDefinition = {
  label: string;
  apply: (system: DogmaSystem) => void;
  crop: Crop;
  cap?: number;
};

export const ITEM_POOL = {
  gatherXP: {
    label: "gather all XP from map",
    crop: icons.energyBurstColor,
    apply: (system) => {
      system.events.emitDeferred("gatherAllCoins", {});
    },
  },
  teleportVial: {
    label: "opens teleport to random place on map for 10s",
    crop: icons.phantomAuraColor,
    apply: (system) => {
      //TODO
      console.log("opens portal");
    },
  },
  slowTime: {
    label: "time slow down for 8s",
    crop: icons.hasteRunColor,
    apply: (system) => {
      const buffList = system.getComponentWithMarker("Player", "BuffList")!;
      buffList.buffs.push({
        timer: 8,
        currentTime: 8,
        name: "timeSlow",
        type: "time",
      });
      BUFF_POOL.timeSlow.onApply();
    },
  },
  invincible: {
    label: "cover player with invincible magic barier for 5s",
    crop: icons.spiritGuardColor,
    apply: (system) => {
      const buffList = system.getComponentWithMarker("Player", "BuffList")!;
      buffList.buffs.push({
        timer: 5,
        currentTime: 5,
        name: "invincible",
        type: "time",
      });
      BUFF_POOL.invincible.onApply(buffList.ID, system);
    },
  },
  deathIsNotTheAnser: {
    label: "deathIsNotTheAnser - you will live somewhere else now!",
    crop: icons.heartBeastColor,
    apply: (system) => {
      const buffList = system.getComponentWithMarker("Player", "BuffList")!;
      buffList.buffs.push({
        timer: 20,
        currentTime: 20,
        name: "deathIsNotTheAnser",
        type: "time",
      });
      BUFF_POOL.deathIsNotTheAnser.onApply(buffList.ID, system);
    },
  },
  deathToAll: {
    label: "death to all enemy's of kingdom!",
    crop: icons.fireSpearColor,
    apply: (system) => {
      const view = AuroraCamera.getViewBox();
      const mobsIDs = system.getComponentsGroup(["EnemyAI", "Transform"]);
      mobsIDs.forEach((ID) => {
        const transform = system.getComponent(ID, "Transform")!;
        const contained = AABB.containsPoint(view, transform.position);
        if (!contained) return;
        EntityManager.removeEntity(ID, "battle");
        system.events.emitCascade<CoinSpawnEvent>("spawnCoinEvent", {
          deadPos: transform.position,
        });
      });
    },
  },
  likeAnOgre: {
    label:
      "you'r strong as ogre and fast as cheetah... for 30s and then you sore for 10s!",
    crop: icons.strengthFireArmColor,
    apply: (system) => {
      const buffList = system.getComponentWithMarker("Player", "BuffList")!;
      buffList.buffs.push({
        timer: 30,
        currentTime: 30,
        name: "likeAnOgre",
        type: "time",
      });
      BUFF_POOL.likeAnOgre.onApply(buffList.ID, system);
    },
  },
} satisfies Record<string, ItemDefinition>;
export const ITEM_KEYS = Object.keys(ITEM_POOL) as (keyof typeof ITEM_POOL)[];
