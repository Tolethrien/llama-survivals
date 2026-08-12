import { SystemComponent } from "@/core/dogma/system";
import { abilities } from "../configs";

export type UpgradeDefinition =
  | {
      kind: "abilityUpgrade";
      label: string;
      abilityTag: keyof typeof abilities;
      apply: (ability: SystemComponent<"Ability">) => void;
      isMaxed?: (ability: SystemComponent<"Ability">) => boolean;
      isMin?: (ability: SystemComponent<"Ability">) => boolean;
      once?: boolean;
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
  newFireWall: {
    kind: "newAbility",
    abilityTag: "FireWall",
    label: "Unlock FireWall",
  },
  newSkulls: {
    kind: "newAbility",
    abilityTag: "Skulls",
    label: "Unlock Skulls",
  },
  newAura: {
    kind: "newAbility",
    abilityTag: "Aura",
    label: "Unlock Aura",
  },
  newVoidVortex: {
    kind: "newAbility",
    abilityTag: "VoidSpawn",
    label: "Unlock Void Vortex",
  },
  newBananaSpread: {
    kind: "newAbility",
    abilityTag: "BananaSpread",
    label: "Unlock Banana Spread",
  },
  fireballLvl1: {
    abilityTag: "Fireball",
    kind: "abilityUpgrade",
    label: "increase dmg by 10% and speed by 20%",
    apply: (ability) => {
      ability.attackMeta.baseDmg *= 1.1;
      ability.abilityDelay *= 0.8;
    },
    isMaxed: (ability) => ability.abilityDelay <= 0.5,
  },
  fireballLvl2: {
    abilityTag: "Fireball",
    kind: "abilityUpgrade",
    label: "+1 fireball shot",
    apply: (ability) => {
      ability.spawnMode = {
        ...ability.spawnMode,
        type: "spawnOnDelay",
        count: ability.spawnMode.count + 1,
        delay: 0.2,
      };
    },
    isMaxed: (ability) => {
      return ability.spawnMode.count === 3;
    },
  },
  fireballLvl3: {
    abilityTag: "Fireball",
    kind: "abilityUpgrade",
    label: "spread fireballs across 15deg",
    apply: (ability) => {
      ability.spawnMode.type = "spawnAtOnce";
      ability.spawnMode.angleStep = 5;
    },
    isMaxed: (ability) => {
      return ability.spawnMode.angleStep === 5;
    },
    isMin: (ability) => {
      return ability.spawnMode.count === 3;
    },
  },
  firewallLvl1: {
    abilityTag: "FireWall",
    kind: "abilityUpgrade",
    label: "inc dmg by 5% and lifespan by 20%",
    apply: (ability) => {
      ability.attackMeta.baseDmg *= 1.05;
      ability.attackMeta.lifeSpan *= 1.2;
    },
    isMaxed: (ability) => {
      return ability.attackMeta.lifeSpan <= 15;
    },
  },
  firewallLvl2: {
    abilityTag: "FireWall",
    kind: "abilityUpgrade",
    label: "4 more walls!",
    apply: (ability) => {
      ability.spawnMode.count = 5;
    },
    once: true,
  },
  firewallLvl3: {
    abilityTag: "FireWall",
    kind: "abilityUpgrade",
    label: "now dots enemy's standing in fire!",
    apply: (ability) => {
      // TODO: nie da sie jeszcze dotowac wrogow
    },
    isMin: (ability) => ability.spawnMode.count === 5,
    once: true,
  },
  skullsLvl1: {
    abilityTag: "Skulls",
    kind: "abilityUpgrade",
    label: "orbit size +2%",
    apply: (ability) => {
      if (ability.attackBehavior.name !== "orbit") return;
      ability.attackBehavior.radius.x *= 1.02;
      ability.attackBehavior.radius.y *= 1.02;
    },
  },
  skullsLvl2: {
    abilityTag: "Skulls",
    kind: "abilityUpgrade",
    label: "+2 skulls",
    apply: (ability) => {
      ability.spawnMode.count += 2;
      ability.spawnMode.angleStep = ability.spawnMode.count / 360;
      if (ability.attackBehavior.name !== "orbit") return;
      ability.attackBehavior.orbitSpeed += 25;
    },
    isMaxed: (ability) => ability.spawnMode.count <= 6,
  },
  skullsLvl3: {
    abilityTag: "Skulls",
    kind: "abilityUpgrade",
    label: "now 30% faster and 20% further",
    apply: (ability) => {
      if (ability.attackBehavior.name !== "orbit") return;
      ability.attackBehavior.orbitSpeed *= 1.3;
      ability.attackBehavior.radius.x * -1.2;
      ability.attackBehavior.radius.y * -1.2;
    },
    isMin: (ability) => ability.spawnMode.count === 6,
    once: true,
  },
  auraLvl1: {
    abilityTag: "Aura",
    kind: "abilityUpgrade",
    label: "aura size +2%",
    apply: (ability) => {
      ability.sizeMultiplier = (ability.sizeMultiplier ?? 1) * 1.02;
    },
  },
  auraLvl2: {
    abilityTag: "Aura",
    kind: "abilityUpgrade",
    label: "tick rate -20%",
    apply: (ability) => {
      ability.abilityDelay *= 0.8;
    },
    once: true,
  },
  auraLvl3: {
    abilityTag: "Aura",
    kind: "abilityUpgrade",
    label: "tick rate -30%",
    apply: (ability) => {
      ability.abilityDelay *= 0.3;
    },
    once: true,
  },
  voidVortexLvl1: {
    abilityTag: "VoidSpawn",
    kind: "abilityUpgrade",
    label: "+10% dmg and +15% projectile speed",
    apply: (ability) => {
      ability.attackMeta.baseDmg *= 1.1;
      if (ability.attackBehavior.name === "projectile") {
        ability.attackBehavior.movementSpeed *= 1.15;
      }
    },
  },
  voidVortexLvl2: {
    abilityTag: "VoidSpawn",
    kind: "abilityUpgrade",
    label: "4 directions instead of 2",
    apply: (ability) => {
      ability.spawnMode.count = 4;
      ability.spawnMode.angleStep = ability.spawnMode.count / 360;
    },
    isMaxed: (ability) => ability.spawnMode.count === 4,
  },
  bananaLvl1: {
    abilityTag: "BananaSpread",
    kind: "abilityUpgrade",
    label: "shot frequency +5%",
    apply: (ability) => {
      if (ability.spawnMode.type !== "spawnOnDelay") return;
      ability.spawnMode.delay *= 0.95;
    },
  },
  bananaLvl2: {
    abilityTag: "BananaSpread",
    kind: "abilityUpgrade",
    label: "+2 bananas",
    apply: (ability) => {
      if (ability.spawnMode.type !== "spawnOnDelay") return;
      ability.spawnMode.delay *= 0.8;
      ability.spawnMode.count += 2;
      ability.spawnMode.angleStep -= 5;
    },
    isMaxed: (ability) => ability.spawnMode.count === 10,
  },
  bananaLvl3: {
    abilityTag: "BananaSpread",
    kind: "abilityUpgrade",
    label: "+2 bananas",
    apply: (ability) => {
      if (ability.spawnMode.type !== "spawnOnDelay") return;
      ability.spawnMode.delay *= 0.8;
      ability.spawnMode.count += 2;
      ability.spawnMode.angleStep -= 5;
    },
    isMaxed: (ability) => ability.spawnMode.count === 10,
  },
  bananaLvl4: {
    abilityTag: "BananaSpread",
    kind: "abilityUpgrade",
    label: "projectile lifespan +50%",
    apply: (ability) => {
      ability.attackMeta.lifeSpan *= 1.5;
    },
    isMin: (ability) => ability.spawnMode.count === 10,
    once: true,
  },
};
