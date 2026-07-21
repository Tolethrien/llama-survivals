import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import { EnemyPerceptionData } from "./AIPerception";
import { assert } from "@/utils/utils";
import Vec2D from "@/utils/vec2D";
import SpatialHash from "@/utils/spatialHash";

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
    const { spacialHash } = this.getSharedData<{ spacialHash: SpatialHash }>(
      "scene",
      "spacialHash",
    )!;
    const playerTransform = this.getComponentWithMarker("Player", "Transform")!;

    swarm.forEach((ID) => {
      const transform = this.getComponent(ID, "Transform")!;
      const rigid = this.getComponent(ID, "Rigid")!;
      const enemy = this.getComponent(ID, "EnemyAI")!;

      let desiredX = 0;
      let desiredY = 0;
      let separation = Vec2D.create([0, 0]);
      let stopDistance =
        (enemy.attackRangeType === "projectile"
          ? enemy.flankRange
          : enemy.attackRange) * 0.8;

      const distToPlayer = new Vec2D([
        playerTransform.position.x - transform.position.x,
        playerTransform.position.y - transform.position.y,
      ]);
      const distToPlayerSq = distToPlayer.lengthSquared();
      const stopDistanceSq = stopDistance * stopDistance;

      if (distToPlayerSq > stopDistanceSq && distToPlayerSq > 1) {
        const dir = distToPlayer.normalize();
        desiredX = dir.x * rigid.speed;
        desiredY = dir.y * rigid.speed;
      }

      const candidates = spacialHash.getCollisionsBroad(transform);
      for (const otherID of candidates) {
        const otherTransform = this.getComponent(otherID, "Transform");
        const otherEnemy = this.getComponent(otherID, "EnemyAI");
        if (!otherTransform || !otherEnemy) continue;
        const diff = new Vec2D([
          transform.position.x - otherTransform.position.x,
          transform.position.y - otherTransform.position.y,
        ]);
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
          const push = diff.normalize().multiply(finalForce);
          separation = separation.add(push);
        }
      }
      let finalVelocityX = desiredX + separation.x;
      let finalVelocityY = desiredY + separation.y;

      const totalSpeedSq =
        finalVelocityX * finalVelocityX + finalVelocityY * finalVelocityY;
      const maxAllowedSpeed = rigid.speed * 1.3;
      const maxAllowedSpeedSq = maxAllowedSpeed * maxAllowedSpeed;

      if (totalSpeedSq > maxAllowedSpeedSq) {
        const totalSpeed = Math.sqrt(totalSpeedSq);
        finalVelocityX = (finalVelocityX / totalSpeed) * maxAllowedSpeed;
        finalVelocityY = (finalVelocityY / totalSpeed) * maxAllowedSpeed;
      }

      const lerpFactor = 0.2;
      const desiredSpeedSq = desiredX * desiredX + desiredY * desiredY;

      if (desiredSpeedSq === 0 && totalSpeedSq < 0.1) {
        rigid.velocity.x += (0 - rigid.velocity.x) * lerpFactor;
        rigid.velocity.y += (0 - rigid.velocity.y) * lerpFactor;
      } else {
        rigid.velocity.x += (finalVelocityX - rigid.velocity.x) * lerpFactor;
        rigid.velocity.y += (finalVelocityY - rigid.velocity.y) * lerpFactor;
      }
    });
  }
}
