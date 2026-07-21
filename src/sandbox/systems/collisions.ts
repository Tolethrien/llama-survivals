import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import SpatialHash from "@/utils/spatialHash";
import { DmgType } from "../managers/attackManager";
import Time from "@/core/engine/time";

export type HitEvent = {
  attackerID: Symbol;
  targetID: Symbol;
  attackID: Symbol;
  amount: number;
  damageType: DmgType;
};

export default class Collision extends DogmaSystem {
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }

  public onStart(): void {
    this.subscribeToPhase({
      callback: this.addPlayerToHash.bind(this),
      phase: "preUpdate",
      after: ["AIPerception"],
    });
    this.subscribeToPhase({
      callback: this.checkCollisions.bind(this),
      phase: "fixedUpdate",
    });
  }

  private addPlayerToHash() {
    const { spacialHash } = this.getSharedData<{ spacialHash: SpatialHash }>(
      "scene",
      "spacialHash",
    )!;
    const playerTransform = this.getComponentWithMarker("Player", "Transform")!;
    const playerCollider = this.getComponentWithMarker("Player", "Collider")!;
    const { position, size } = this.getColliderRect(
      playerTransform.position,
      playerTransform.size,
      playerCollider,
    );
    spacialHash.addToGrid({ position, size, ID: playerTransform.ID });
  }

  private checkCollisions() {
    const dt = Time.getFixedDeltaTime();
    const { spacialHash } = this.getSharedData<{ spacialHash: SpatialHash }>(
      "scene",
      "spacialHash",
    )!;
    const attacks = this.getComponentsGroup([
      "Collider",
      "Attack",
      "Transform",
    ]);

    attacks.forEach((attackID) => {
      const attackCollider = this.getComponent(attackID, "Collider")!;
      if (!attackCollider.active) return;

      const attackMeta = this.getComponent(attackID, "Attack")!;
      if (attackMeta.hitType === "aura") this.tickAuraCooldown(attackMeta, dt);

      const attackTransform = this.getComponent(attackID, "Transform")!;
      const relation = this.getComponent(attackID, "Relation")!;
      const parentID = relation.parentChar!;
      const attackerStats = this.getComponent(parentID, "CharacterStats");
      const attackerFraction = this.getComponent(parentID, "Fraction");
      if (!attackerStats || !attackerFraction) {
        attackCollider.active = false;
        return;
      }

      const hitInterval =
        attackMeta.hitType === "aura"
          ? this.getComponent(relation.parentAbility!, "Ability")!.spawnMode
              .delay
          : 0;

      const { position, size } = this.getColliderRect(
        attackTransform.position,
        attackTransform.size,
        attackCollider,
      );
      const candidates = spacialHash.getCollisionsBroad({
        position,
        size,
        ID: attackID,
      });

      const stillTouching =
        attackMeta.hitType === "pierce" ? new Set<Symbol>() : null;

      candidates.forEach((targetID) => {
        if (targetID === parentID) return;

        const targetFraction = this.getComponent(targetID, "Fraction")!;
        if (attackerFraction.team === targetFraction.team) return;

        const targetCollider = this.getComponent(targetID, "Collider")!;
        const targetTransform = this.getComponent(targetID, "Transform")!;
        if (
          !this.overlaps(
            attackTransform,
            attackCollider,
            targetTransform,
            targetCollider,
          )
        )
          return;

        stillTouching?.add(targetID);
        if (!this.canHit(attackMeta, targetID)) return;
        this.registerHit(attackMeta, targetID, hitInterval);

        this.events.emitCascade<HitEvent>("attackHit", {
          attackerID: parentID,
          targetID,
          attackID,
          amount: attackMeta.baseDamage,
          damageType: attackMeta.damageType,
        });
      });

      if (stillTouching) this.sweepPierce(attackMeta, stillTouching);
    });
  }

  private registerHit(
    attack: SystemComponent<"Attack">,
    targetID: Symbol,
    hitInterval: number,
  ) {
    if (attack.hitType === "aura") {
      (attack.hitList as Map<Symbol, number>).set(targetID, hitInterval);
      return;
    }
    (attack.hitList as Set<Symbol>).add(targetID);
  }

  private canHit(attack: SystemComponent<"Attack">, targetID: Symbol): boolean {
    if (attack.hitType === "aura") {
      return !(attack.hitList as Map<Symbol, number>).has(targetID);
    }
    return !(attack.hitList as Set<Symbol>).has(targetID);
  }

  private sweepPierce(
    attack: SystemComponent<"Attack">,
    stillTouching: Set<Symbol>,
  ) {
    const hits = attack.hitList as Set<Symbol>;
    hits.forEach((targetID) => {
      if (!stillTouching.has(targetID)) hits.delete(targetID);
    });
  }

  private tickAuraCooldown(attack: SystemComponent<"Attack">, dt: number) {
    const cooldowns = attack.hitList as Map<Symbol, number>;
    cooldowns.forEach((remaining, targetID) => {
      const next = remaining - dt;
      if (next <= 0) cooldowns.delete(targetID);
      else cooldowns.set(targetID, next);
    });
  }

  private overlaps(
    aT: SystemComponent<"Transform">,
    aC: SystemComponent<"Collider">,
    bT: SystemComponent<"Transform">,
    bC: SystemComponent<"Collider">,
  ): boolean {
    const aRect = this.getColliderRect(aT.position, aT.size, aC);
    const bRect = this.getColliderRect(bT.position, bT.size, bC);

    if (aC.shape === "rect" && bC.shape === "rect") {
      return (
        aRect.position.x < bRect.position.x + bRect.size.width &&
        aRect.position.x + aRect.size.width > bRect.position.x &&
        aRect.position.y < bRect.position.y + bRect.size.height &&
        aRect.position.y + aRect.size.height > bRect.position.y
      );
    }
    if (aC.shape === "circle" && bC.shape === "circle") {
      const ac = this.getCenter(aRect);
      const bc = this.getCenter(bRect);
      const r = aRect.size.width / 2 + bRect.size.width / 2;
      const dx = ac.x - bc.x;
      const dy = ac.y - bc.y;
      return dx * dx + dy * dy <= r * r;
    }

    const [rect, circle] =
      aC.shape === "rect" ? [aRect, bRect] : [bRect, aRect];
    const c = this.getCenter(circle);
    const radius = circle.size.width / 2;
    const closestX = Math.max(
      rect.position.x,
      Math.min(c.x, rect.position.x + rect.size.width),
    );
    const closestY = Math.max(
      rect.position.y,
      Math.min(c.y, rect.position.y + rect.size.height),
    );
    const dx = c.x - closestX;
    const dy = c.y - closestY;
    return dx * dx + dy * dy <= radius * radius;
  }

  private getCenter(rect: { position: Position2D; size: Size2D }) {
    return {
      x: rect.position.x + rect.size.width / 2,
      y: rect.position.y + rect.size.height / 2,
    };
  }

  private getColliderRect(
    position: Position2D,
    size: Size2D,
    collider: SystemComponent<"Collider">,
  ): { position: Position2D; size: Size2D } {
    const colliderSize: Size2D = {
      width: size.width + collider.sizeOffset.width,
      height: size.height + collider.sizeOffset.height,
    };
    const center = {
      x: position.x + size.width / 2 + collider.posOffset.x,
      y: position.y + size.height / 2 + collider.posOffset.y,
    };
    return {
      position: {
        x: center.x - colliderSize.width / 2,
        y: center.y - colliderSize.height / 2,
      },
      size: colliderSize,
    };
  }
}
