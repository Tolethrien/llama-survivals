import { SystemComponent } from "@/core/dogma/system";
import { AttackDisplayKey, AttackShapeList } from "../entities/attacks";
import BaseAttack from "../entities/baseAttack";
import { getColliderCenter, getStickPosition } from "@/utils/utils";
import AuroraCamera from "@/core/aurora/camera";
import AxiomMath from "@/core/axiom/math";

export type AttackBehavior =
  | { name: "static" }
  | { name: "projectile"; movementSpeed: number; direction: DirectionStrategy }
  | {
      name: "orbit";
      orbitSpeed: number;
      radius: Position2D;
      startAngle?: number;
    }
  | {
      name: "stick";
      distance: number;
      angle: number;
      direction: DirectionStrategy;
    };

type SpawnCommon = {
  abilityDelay: number;
  spawned: boolean;
  where: "randomPoint" | "onTarget" | "onSelf" | "inFront";
  count: number;
  angleStep: number;
};
export type SpawnMode =
  | (SpawnCommon & { type: "spawnAtOnce" })
  | (SpawnCommon & { type: "spawnOnDelay"; delay: number })
  | (SpawnCommon & { type: "persistent" });

export type DirectionStrategy =
  | { name: "none" }
  | { name: "angle"; deg: number }
  | { name: "random" }
  | { name: "towardsFacing" };

export type AttackMeta = {
  attackName: AttackDisplayKey;
  damageType: "physical" | "fire" | "cold" | "energy" | "poison" | "heal";
  impactType: "impact" | "overTime";
  lifeSpan: number;
  baseDmg: number;
  hitType: "hit" | "pierce" | "aura";
  attackRange: "melee" | "projectile";
  onCasterDeath: "live" | "remove";
};

export type HitTracking =
  | { hitType: "hit"; hitList: Set<Symbol> }
  | { hitType: "pierce"; hitList: Set<Symbol> }
  | { hitType: "aura"; hitList: Map<Symbol, number> };

export default class AttackManager {
  public static build(
    ability: SystemComponent<"Ability">,
    relation: SystemComponent<"Relation">,
    casterTransform: SystemComponent<"Transform">,
    casterCollider: SystemComponent<"Collider">,
    targetTransform: SystemComponent<"Transform">,
    targetCollider: SystemComponent<"Collider">,
    spreadIndex: number,
  ) {
    const displayData = AttackShapeList[ability.attackMeta.attackName];
    const angleOffsetDeg = this.getAngleOffset(ability.spawnMode, spreadIndex);

    const { behavior: attackBehavior, velocity } = this.resolveBehavior(
      ability.attackBehavior,
      casterTransform,
      angleOffsetDeg,
    );

    const pos =
      attackBehavior.name === "stick"
        ? getStickPosition(
            attackBehavior.angle,
            attackBehavior.distance,
            displayData.layer === "groundAttacks" ? "feet" : "center",
            casterTransform,
            displayData.size,
          )
        : this.getSpawnPoint(
            ability,
            casterTransform,
            casterCollider,
            targetTransform,
            targetCollider,
            displayData.size,
          );
    const builder = new BaseAttack({
      abilityID: ability.ID,
      casterID: relation.parentChar!,
      attackMeta: ability.attackMeta,
      attackBehavior,
      spawn: ability.spawnMode,
      transform: { position: pos, velocity },
    });
    return builder;
  }

  private static getAngleOffset(spawnMode: SpawnMode, spreadIndex: number) {
    const { count, angleStep } = spawnMode;
    if (count <= 1) return 0;
    return (spreadIndex - (count - 1) / 2) * angleStep;
  }

  private static resolveDirectionAngleDeg(
    direction: DirectionStrategy,
    casterTransform: SystemComponent<"Transform">,
  ): number | null {
    switch (direction.name) {
      case "none":
        return null;
      case "angle":
        return direction.deg;
      case "random":
        return Math.random() * 360;
      case "towardsFacing": {
        const face = casterTransform.faceDir;
        return (Math.atan2(face.x, -face.y) * 180) / Math.PI;
      }
    }
  }

  private static resolveBehavior(
    behavior: AttackBehavior,
    casterTransform: SystemComponent<"Transform">,
    angleOffsetDeg: number,
  ): { behavior: AttackBehavior; velocity: Position2D } {
    switch (behavior.name) {
      case "orbit": {
        const nextBehavior =
          angleOffsetDeg === 0
            ? behavior
            : {
                ...behavior,
                startAngle: (behavior.startAngle ?? 0) + angleOffsetDeg,
              };
        return { behavior: nextBehavior, velocity: { x: 0, y: 0 } };
      }
      case "stick": {
        const baseDeg =
          this.resolveDirectionAngleDeg(behavior.direction, casterTransform) ??
          0;
        return {
          behavior: {
            ...behavior,
            angle: behavior.angle + baseDeg + angleOffsetDeg,
          },
          velocity: { x: 0, y: 0 },
        };
      }
      case "projectile": {
        const baseDeg =
          this.resolveDirectionAngleDeg(behavior.direction, casterTransform) ??
          0;
        return {
          behavior,
          velocity: this.unitVectorFromAngleDeg(baseDeg + angleOffsetDeg),
        };
      }
      case "static":
        return { behavior, velocity: { x: 0, y: 0 } };
    }
  }

  private static unitVectorFromAngleDeg(angleDeg: number): Position2D {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: Math.sin(rad), y: -Math.cos(rad) };
  }

  private static getSpawnPoint(
    ability: SystemComponent<"Ability">,
    casterTransform: SystemComponent<"Transform">,
    casterCollider: SystemComponent<"Collider">,
    targetTransform: SystemComponent<"Transform">,
    targetCollider: SystemComponent<"Collider">,
    attackSize: Size2D,
  ): Position2D {
    switch (ability.spawnMode.where) {
      case "onSelf": {
        const casterCenter = getColliderCenter(casterTransform, casterCollider);
        return {
          x: casterCenter.x - attackSize.width / 2,
          y: casterCenter.y - attackSize.height / 2,
        };
      }
      case "inFront": {
        const casterCenter = getColliderCenter(casterTransform, casterCollider);
        const face = casterTransform.faceDir;
        const offsetDist = casterTransform.size.width * 0.5;
        return {
          x: casterCenter.x + face.x * offsetDist - attackSize.width / 2,
          y: casterCenter.y + face.y * offsetDist - attackSize.height / 2,
        };
      }
      case "onTarget": {
        const targetCenter = getColliderCenter(targetTransform, targetCollider);
        return {
          x: targetCenter.x - attackSize.width / 2,
          y: targetCenter.y - attackSize.height / 2,
        };
      }
      case "randomPoint": {
        const viewBox = AuroraCamera.getViewBox();
        return AxiomMath.randomInRectPoint(viewBox);
      }
      default: {
        return { x: 0, y: 0 };
      }
    }
  }
}
