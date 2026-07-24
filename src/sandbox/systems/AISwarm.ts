import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import { EnemyPerceptionData } from "./AIPerception";
import { assert, createColliderBox, getColliderCenter } from "@/utils/utils";
import SpatialGrid from "@/core/axiom/SpatialGrid";
import Vec2 from "@/core/axiom/vec2";

export default class AISwarm extends DogmaSystem {
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }

  public onStart(): void {
    this.subscribeToPhase({
      callback: this.swarm.bind(this),
      phase: "preUpdate",
    });
  }
  private swarm() {
    const perceptionData =
      this.events.getCascade<EnemyPerceptionData[]>("EnemyPerception")?.[0];
    assert(
      perceptionData !== undefined,
      "AI swarm: there is no perception list for Ai to deal with",
    );

    const swarm = perceptionData.swarm;
    const { spatialGrid } = this.getSharedData<{
      spatialGrid: SpatialGrid<Symbol>;
    }>("scene", "spatialGrid")!;
    const playerTransform = this.getComponentWithMarker("Player", "Transform")!;
    const playerCollider = this.getComponentWithMarker("Player", "Collider")!;

    swarm.forEach((ID) => {
      const transform = this.getComponent(ID, "Transform")!;
      const rigid = this.getComponent(ID, "Rigid")!;
      const enemy = this.getComponent(ID, "EnemyAI")!;
      const collider = this.getComponent(ID, "Collider")!;

      const desired = Vec2.Zero;
      const separation = Vec2.Zero;
      let stopDistance =
        (enemy.attackRangeType === "projectile"
          ? enemy.flankRange
          : enemy.attackRange) * 0.8;

      const selfCenter = getColliderCenter(transform, collider);
      const playerCenter = getColliderCenter(playerTransform, playerCollider);
      const distToPlayer = playerCenter.sub(selfCenter);

      const distToPlayerSq = distToPlayer.lengthSquared();
      const stopDistanceSq = stopDistance * stopDistance;

      if (distToPlayerSq > stopDistanceSq && distToPlayerSq > 1) {
        distToPlayer.normalize();
        desired.copy(distToPlayer).scale(rigid.speed);
      }
      const colliderBox = createColliderBox(transform, collider);
      const candidates = spatialGrid.query(colliderBox);
      for (const otherID of candidates) {
        const otherTransform = this.getComponent(otherID, "Transform");
        const otherEnemy = this.getComponent(otherID, "EnemyAI");
        const otherCollider = this.getComponent(otherID, "Collider");
        if (!otherTransform || !otherEnemy || !otherCollider) continue;

        const otherCenter = getColliderCenter(otherTransform, otherCollider);
        const diff = selfCenter.clone().sub(otherCenter); // .clone()! selfCenter używany w każdej iteracji

        const distSq = diff.lengthSquared();

        const radiusSelf = transform.size.width / 2;
        const radiusOther = otherTransform.size.width / 2;

        const spaceMultiplier =
          enemy.personalSpace * (otherEnemy?.personalSpace ?? 1.0);
        const minDistance = (radiusSelf + radiusOther) * spaceMultiplier;
        const minDistanceSq = minDistance * minDistance;

        if (distSq < minDistanceSq && distSq > 0.001) {
          const distance = Math.sqrt(distSq);
          const overlapRatio = (minDistance - distance) / minDistance;

          const finalForce = overlapRatio * rigid.speed * enemy.pushForce;
          const push = diff.normalize().scale(finalForce);
          separation.add(push);
        }
      }
      const finalVel = desired.clone().add(separation);

      const totalSpeedSq = finalVel.lengthSquared();
      const maxAllowedSpeed = rigid.speed * 1.3;
      const maxAllowedSpeedSq = maxAllowedSpeed * maxAllowedSpeed;

      if (totalSpeedSq > maxAllowedSpeedSq) {
        const totalSpeed = Math.sqrt(totalSpeedSq);
        finalVel.divideScalar(totalSpeed).scale(maxAllowedSpeed);
      }

      const lerpFactor = 0.2;
      const desiredSpeedSq = desired.lengthSquared();
      if (desiredSpeedSq === 0 && totalSpeedSq < 0.1) {
        rigid.velocity.lerp(Vec2.Zero, lerpFactor);
      } else {
        rigid.velocity.lerp(finalVel, lerpFactor);
      }
    });
  }
}
