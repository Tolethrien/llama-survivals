import { RENDER_LAYER } from "@/sandbox/scenes/battleScene";
import spells from "@sandbox/assets/spells.json";
export interface AttackEntry {
  tint?: RGBA; // shading of a attack
  texture: string; // name of a texture to use
  crop: Crop; // crop of texture above
  layer: keyof typeof RENDER_LAYER; // sorting layer
  size: Size2D; //size of sprite
  collider: {
    shape: "circle" | "rect"; // shape of collider
    posOffset?: Position2D; // offset from center of sprite for collider, negative is left/up
    sizeOffset?: Size2D; // difference in a size of a collider to spite center, eg. (w: -5) is 2.5px smaller in x axis on both sides
  };
}
export type AttackDisplayKey = keyof typeof AttackShapeList;
export const AttackShapeList = {
  fireball: {
    crop: spells.fireball,
    texture: "spells",
    layer: "main",
    size: {
      width: spells.fireball.width * 1.5,
      height: spells.fireball.height * 1.5,
    },
    collider: { shape: "circle" },
  },

  skull: {
    tint: [255, 100, 100, 255],
    crop: spells.scull,
    texture: "spells",
    layer: "overlay",
    size: { width: spells.scull.width, height: spells.scull.height },
    collider: { shape: "circle" },
  },
  firewall: {
    crop: spells.fireColumn,
    texture: "spells",
    layer: "main",
    size: { width: spells.fireColumn.width, height: spells.fireColumn.height },
    collider: { shape: "rect" },
  },
  vortex: {
    crop: spells.voidVortex,
    texture: "spells",
    layer: "main",
    size: {
      width: spells.voidVortex.width * 1.5,
      height: spells.voidVortex.height * 1.5,
    },
    collider: { shape: "rect" },
  },
  auraRed: {
    crop: spells.auraRed,
    texture: "spells",
    layer: "groundAttacks",
    size: {
      width: spells.voidVortex.width * 5,
      height: spells.voidVortex.height * 5,
    },
    collider: { shape: "circle" },
  },
  auraGold: {
    crop: spells.auraGold,
    texture: "spells",
    layer: "groundAttacks",
    size: {
      width: spells.voidVortex.width * 5,
      height: spells.voidVortex.height * 5,
    },
    collider: { shape: "circle" },
  },
} satisfies Record<string, AttackEntry>;
