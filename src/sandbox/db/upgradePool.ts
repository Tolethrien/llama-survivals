import { SystemComponent } from "@/core/dogma/system";
import { abilities } from "../configs";

export type UpgradeDefinition =
  | {
      kind: "abilityUpgrade";
      label: string;
      abilityTag: keyof typeof abilities;
      apply: (ability: SystemComponent<"Ability">) => void;
      isMaxed?: (ability: SystemComponent<"Ability">) => boolean;
    }
  | {
      kind: "newAbility";
      label: string;
      abilityTag: keyof typeof abilities;
    }
  | {
      kind: "statUpgrade";
      label: string;
      apply: (stats: SystemComponent<"CharacterStats">) => void;
    };

export const UPGRADE_POOL: Record<string, UpgradeDefinition> = {
  skullsCount: {
    kind: "abilityUpgrade",
    label: "+ 2 Sculls",
    isMaxed: (ability) => ability.spawnMode.count >= 8,
    apply: (ability) => {
      ability.spawnMode.count += 2;
      ability.spawnMode.angleStep = 360 / ability.spawnMode.count;
    },
    abilityTag: "Skulls",
  },
  worldDirCount: {
    kind: "abilityUpgrade",
    label: "WorldDir: -0.5s daley",
    apply: (ability) => {
      ability.abilityDelay -= 0.5;
    },
    abilityTag: "WorldDir",
  },
  spawnSkulls: {
    kind: "newAbility",
    abilityTag: "Skulls",
    label:
      "New Ability - Skulls: spawn 6 skulls that orbit around player and do dmg on impact",
  },
  spawnWorldDir: {
    kind: "newAbility",
    abilityTag: "WorldDir",
    label: "New Ability - WorldDir: spawn 4 world direction fireballs every 5s",
  },
  incDmg: {
    kind: "statUpgrade",
    apply: (stats) => {
      stats.damageIncrease += 10;
    },
    label: "Increase Overall Damage by 10",
  },
};
