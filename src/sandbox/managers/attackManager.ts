import { SystemComponent } from "@/core/dogma/system";
import Vec2D from "@/utils/vec2D";
import { getRandomInt } from "@/utils/utils";
import InputManager from "@/core/engine/inputManager";
import BaseAttack from "../entities/baseAttack";
import AuroraCamera from "@/core/aurora/camera";
import { RENDER_LAYER } from "../scenes/battleScene";

export type DamageImpactType = "impact" | "overTime";
export type AttackRange = "melee" | "projectile";
export type ImpactBehavior = "destroy" | "live";
export type DmgType =
  | "physical"
  | "fire"
  | "cold"
  | "energy"
  | "poison"
  | "heal";
export type HitTrackingKeys = "hit" | "pierce" | "aura";
export type HitTracking =
  | { hitType: "hit"; hitList: Set<Symbol> }
  | { hitType: "pierce"; hitList: Set<Symbol> }
  | { hitType: "aura"; hitList: Map<Symbol, number> };
export interface TargetingContext {
  casterTransform: SystemComponent<"Transform">;
  targetTransform: SystemComponent<"Transform">;
}
export type TargetingResult = { position: Position2D; velocity?: Position2D };
interface ATTEntry {
  tint?: RGBA;
  texture: string;
  crop: Crop;
  shape: "circle" | "rect";
  layer: keyof typeof RENDER_LAYER;
  size: Size2D;
  colliderOffsets?: {
    pos?: Position2D;
    size?: Size2D;
  };
}
//TODO: jedno zrodlo prawdy dla wszyzstkich typow bo teraz mam tutaj i w ability
export type AttackDisplayKey = keyof typeof ATT;
//TODO: bez sensu to, roznie dobrze moge sobie gdzies opisac pozniej ataki i uzywac tamtego, narazie zostanie do czasu az wymysle lepiej
export const ATT: Record<string, ATTEntry> = {
  fireball: {
    tint: [255, 255, 255, 255],
    crop: { x: 94, y: 0, width: 94, height: 94 },
    texture: "auras",
    shape: "circle",
    layer: "groundAttacks",
    size: { width: 300, height: 300 },
  },
  skull: {
    tint: [0, 0, 255, 255],
    crop: { x: 94, y: 0, width: 94, height: 94 },
    texture: "auras",
    shape: "circle",
    layer: "charAttacks",
    size: { width: 40, height: 40 },
  },
  arrow: {
    tint: [255, 255, 255, 255],
    crop: { x: 0, y: 0, width: 32, height: 32 },
    texture: "spells",
    shape: "circle",
    layer: "charAttacks",
    size: { width: 64, height: 64 },
    colliderOffsets: {
      size: { width: -10, height: -20 },
      pos: { x: 0, y: -5 },
    },
  },
};
/**
 * nie dzialajace polaczenia do assertu:
 * spawnStatic oraz jakikolwiek direction
 */
/**
 * pomysly na dodanie:
 * random off screen + toward center
 */
export default class AttackManager {
  public static build(
    ability: SystemComponent<"Ability">,
    relation: SystemComponent<"Relation">,
    casterTransform: SystemComponent<"Transform">,
    targetTransform: SystemComponent<"Transform">,
  ) {
    //TODO: to jest swietne miejsce do object pooling bo to sie bedzie tworzylo w dziesiatkach co frame
    //TODO: nie dziala radom point i towards target ob uzywa pozycji castera do obliczen a nie randomPointu
    const pos = this.getSpawnPoint(ability, casterTransform, targetTransform);
    const dir = this.getDirection(ability, casterTransform, targetTransform);
    const builder = new BaseAttack({
      abilityID: ability.ID,
      casterID: relation.parentChar!,
      attackMeta: {
        baseDmg: ability.attackMeta.baseDmg,
        damageType: "physical",
        impactType: "impact",
        lifeSpan: ability.attackMeta.lifespan,
        onImpact: "destroy",
        hitType: ability.attackMeta.hitType,
      },
      attackName: ability.attackMeta.name,
      attackRange: "projectile",
      behavior: {
        attackBehavior: ability.attackBehavior,
        directionStrategy: ability.directionStrategy,
      },
      spawn: ability.spawnMode,
      transform: {
        position: pos,
        velocity: dir,
      },
    });
    return builder;
  }
  private static getSpawnPoint(
    ability: SystemComponent<"Ability">,
    casterTransform: SystemComponent<"Transform">,
    targetTransform: SystemComponent<"Transform">,
  ): Position2D {
    switch (ability.spawnMode.where) {
      case "onSelf": {
        return {
          x:
            casterTransform.position.x +
            casterTransform.size.width / 2 -
            casterTransform.size.width / 2,
          y:
            casterTransform.position.y +
            casterTransform.size.height / 2 -
            casterTransform.size.height / 2,
        };
      }
      case "onTarget": {
        return {
          x:
            targetTransform.position.x +
            targetTransform.size.width / 2 -
            casterTransform.size.width / 2,
          y:
            targetTransform.position.y +
            targetTransform.size.height / 2 -
            casterTransform.size.height / 2,
        };
      }
      case "randomPoint": {
        const viewBox = AuroraCamera.getViewBox();
        const boundaries = viewBox.h / 100;
        const x = getRandomInt(
          viewBox.x + boundaries,
          viewBox.x + viewBox.w - boundaries,
        );
        const y = getRandomInt(
          viewBox.y + boundaries / 2,
          viewBox.y + viewBox.h - boundaries / 2,
        );
        return { x, y };
      }
    }
  }
  private static getDirection(
    ability: SystemComponent<"Ability">,
    casterTransform: SystemComponent<"Transform">,
    targetTransform: SystemComponent<"Transform">,
  ): Position2D {
    switch (ability.directionStrategy) {
      case "none": {
        return { x: 0, y: 0 };
      }
      case "randomDirection": {
        const angle = Math.random() * Math.PI * 2;
        return { x: Math.cos(angle), y: Math.sin(angle) };
      }
      case "towardsMouse": {
        const dir = InputManager.getMouseDirFromCenter();
        const vec = Vec2D.create([dir.x, dir.y]);
        const length = vec.length();
        return { x: dir.x / length, y: dir.y / length };
      }
      case "towardsTarget": {
        const posDiff = Vec2D.create([
          targetTransform.position.x - casterTransform.position.x,
          targetTransform.position.y - casterTransform.position.y,
        ]);
        const length = posDiff.length();
        return { x: posDiff.x / length, y: posDiff.y / length };
      }
    }
  }
}
