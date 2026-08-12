import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import Time from "@/core/engine/time";
import SpatialGrid from "@/core/axiom/SpatialGrid";
import { createColliderBox, createColliderShape } from "@/utils/utils";
import AxiomCollision from "@/core/axiom/collision";

export type HitEvent = {
  attackerID: Symbol;
  targetID: Symbol;
  attackID: Symbol;
  abilityID: Symbol;
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

  //TODO: mam 2 osobne funckje koliderow dl spatiaal i do kolizji, bez sensu! zmien
  //TODO: w sumie fraction by moglo byc w relacji bo to ogolny komponent relacji moze byc
  private addPlayerToHash() {
    const { spatialGrid } = this.getSharedData<{
      spatialGrid: SpatialGrid<Symbol>;
    }>("scene", "spatialGrid")!;
    const transform = this.getComponentWithMarker("Player", "Transform")!;
    const collider = this.getComponentWithMarker("Player", "Collider")!;
    const box = createColliderBox(transform, collider);
    spatialGrid.insert({ bounds: box, data: transform.ID, ID: transform.ID });
  }
  private checkCollisions() {
    const { spatialGrid } = this.getSharedData<{
      spatialGrid: SpatialGrid<Symbol>;
    }>("scene", "spatialGrid")!;
    const attacks = this.getComponentsGroup([
      "Collider",
      "Attack",
      "Transform",
    ]);
    attacks.forEach((attackID) => {
      const collider = this.getComponent(attackID, "Collider")!;
      if (!collider.active) return;
      const attack = this.getComponent(attackID, "Attack")!;
      const transform = this.getComponent(attackID, "Transform")!;
      const sdt = Time.getDeltaTime();
      const udt = Time.getUnscaledDeltaTime();
      const dt = attack.tags.has("timeImmune") ? udt : sdt;
      this.calculateDT(attack, dt);
      const relation = this.getComponent(attack.ID, "Relation")!;
      const parentID = relation.parentChar!;
      const parentAbilityID = relation.parentAbility!;
      const parentFraction = this.getComponent(parentID, "Fraction");
      if (!parentFraction) {
        collider.active = false;
        return;
      }
      const box = createColliderBox(transform, collider);
      const broadCollisions = spatialGrid.query(box);
      let pierceList =
        attack.tracking.hitType === "pierce" ? new Set<Symbol>() : undefined;
      broadCollisions.forEach((ID) => {
        const targetFraction = this.getComponent(ID, "Fraction")!;
        if (parentID === ID) return;
        if (parentFraction.team === targetFraction.team) return;
        const targetTransform = this.getComponent(ID, "Transform")!;
        const targetCollider = this.getComponent(ID, "Collider")!;

        const isOverlapping = this.checkOverlap(
          transform,
          collider,
          targetTransform,
          targetCollider,
        );
        if (!isOverlapping) return;
        if (pierceList) pierceList.add(ID);
        const hitPosable = this.checkPosableHit(attack, ID);
        if (!hitPosable) return;
        this.registerNewHitInAttack(attack, ID, parentAbilityID);
        this.events.emitCascade<HitEvent>("attackHit", {
          attackerID: parentID,
          targetID: ID,
          attackID,
          abilityID: parentAbilityID,
        });
      });
      if (pierceList) this.updatePierseList(pierceList, attack);
    });
  }
  private calculateDT(attack: SystemComponent<"Attack">, dt: number) {
    if (attack.tracking.hitType !== "aura") return;
    const hitList = attack.tracking.hitList;

    hitList.forEach((cooldown, ID) => {
      const next = cooldown - dt;
      if (next <= 0) hitList.delete(ID);
      else hitList.set(ID, next);
    });
  }
  private checkPosableHit(
    attack: SystemComponent<"Attack">,
    targetID: Symbol,
  ): boolean {
    return !attack.tracking.hitList.has(targetID);
  }
  private checkOverlap(
    aTransform: SystemComponent<"Transform">,
    aCollider: SystemComponent<"Collider">,
    bTransform: SystemComponent<"Transform">,
    bCollider: SystemComponent<"Collider">,
  ): boolean {
    const aShape = createColliderShape(aTransform, aCollider);
    const bShape = createColliderShape(bTransform, bCollider);

    if (aCollider.shape === "rect" && bCollider.shape === "rect") {
      return AxiomCollision.rectVsRect(aShape as Rect, bShape as Rect).collided;
    }
    if (aCollider.shape === "circle" && bCollider.shape === "circle") {
      return AxiomCollision.circleVsCircle(aShape as Circle, bShape as Circle)
        .collided;
    }

    const [circleShape, rectShape] =
      aCollider.shape === "circle" ? [aShape, bShape] : [bShape, aShape];

    return AxiomCollision.circleVsRect(circleShape as Circle, rectShape as Rect)
      .collided;
  }
  private registerNewHitInAttack(
    attack: SystemComponent<"Attack">,
    targetID: Symbol,
    abilityID: Symbol,
  ) {
    const tracking = attack.tracking;
    if (tracking.hitType === "aura") {
      const ability = this.getComponent(abilityID, "Ability")!;
      tracking.hitList.set(targetID, ability.abilityDelay);
    } else {
      tracking.hitList.add(targetID);
    }
  }
  private updatePierseList(
    currentList: Set<Symbol>,
    attack: SystemComponent<"Attack">,
  ) {
    const attackList = attack.tracking.hitList as Set<Symbol>;
    attackList.forEach((ID) => {
      if (!currentList.has(ID)) attackList.delete(ID);
    });
  }
}
