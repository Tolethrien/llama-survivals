import { RENDER_LAYER } from "@/sandbox/scenes/battleScene";

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
    tint: [255, 255, 255, 255],
    crop: { x: 94, y: 0, width: 94, height: 94 },
    texture: "auras",
    layer: "groundAttacks",
    size: { width: 300, height: 300 },
    collider: { shape: "circle" },
  },

  skull: {
    tint: [0, 0, 255, 255],
    crop: { x: 94, y: 0, width: 94, height: 94 },
    texture: "auras",
    layer: "main",
    size: { width: 40, height: 40 },
    collider: { shape: "circle" },
  },
  arrow: {
    tint: [255, 255, 255, 255],
    crop: { x: 0, y: 0, width: 32, height: 32 },
    texture: "spells",
    layer: "main",
    size: { width: 64, height: 64 },
    collider: {
      shape: "circle",
      sizeOffset: { width: -10, height: -10 },
      posOffset: { x: 0, y: -5 },
    },
  },
  purpleArrow: {
    tint: [128, 0, 128, 255],
    crop: { x: 0, y: 0, width: 32, height: 32 },
    texture: "spells",
    layer: "main",
    size: { width: 64, height: 64 },
    collider: {
      shape: "circle",
      sizeOffset: { width: -10, height: -10 },
      posOffset: { x: 0, y: -5 },
    },
  },
} satisfies Record<string, AttackEntry>;
