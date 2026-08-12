import Vec2 from "@/core/axiom/vec2";
import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import Time from "@/core/engine/time";
import { getOrbitPosition, getStickPosition } from "@/utils/utils";
import { CoinReachedEvent, CONSOLIDATE_UNIT } from "./xPGather";
import InputManager from "@/core/engine/inputManager";

//DO NOT USE 2 TYPES OF MOVEMENT AT ONES IN ENTITY!
export default class Physics extends DogmaSystem {
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }
  public onStart(): void {
    this.subscribeToPhase({
      phase: "fixedUpdate",
      callback: this.physSystem.bind(this),
    });
  }
  private physSystem() {
    if (InputManager.isKeyPressed("p")) {
      Time.setPaused(!Time.getPaused());
    }
    let sdt = Time.getFixedDeltaTime();
    let udt = Time.getUnscaledFixedDeltaTime();
    this.updateRigidMovements(sdt, udt);
    this.updateProjectileMovements(sdt, udt);
    this.updateOrbitalMovement(sdt, udt);
    this.updateStickMovement();
    this.updateMagnetMovement(sdt, udt);
    // this.updateReboundMovement(dt);
    // this.updatePtoPMovement(dt);
  }
  private updateRigidMovements(sdt: number, udt: number) {
    // mobs movement
    const components = this.getComponentsGroup(["Rigid", "Transform"]);
    components.forEach((ID) => {
      const rigid = this.getComponent(ID, "Rigid");
      const transform = this.getComponent(ID, "Transform");
      if (!rigid || !transform) return;
      const dt = transform.tags.has("timeImmune") ? udt : sdt;
      transform.prevPosition.copy(transform.position);
      transform.position.add(rigid.velocity.clone().scale(dt));

      rigid.velocity.scale(Math.pow(rigid.friction, dt * 60));
      if (Math.abs(rigid.velocity.x) < 0.1) rigid.velocity.setAxis("x", 0);
      if (Math.abs(rigid.velocity.y) < 0.1) rigid.velocity.setAxis("y", 0);
    });
  }
  private updateProjectileMovements(sdt: number, udt: number) {
    const components = this.getComponentsGroup(["Projectile", "Transform"]);
    components.forEach((ID) => {
      const rigid = this.getComponent(ID, "Rigid");
      const transform = this.getComponent(ID, "Transform");
      if (!rigid || !transform) return;
      const dt = transform.tags.has("timeImmune") ? udt : sdt;
      transform.prevPosition.copy(transform.position);
      transform.position.add(rigid.velocity.clone().scale(dt));
    });
  }
  private updateOrbitalMovement(sdt: number, udt: number) {
    const components = this.getComponentsGroup(["Orbit", "Transform"]);
    components.forEach((ID) => {
      const orbit = this.getComponent(ID, "Orbit");
      const transform = this.getComponent(ID, "Transform");
      if (!orbit || !transform) return;

      const targetTransform = this.getComponent(orbit.targetID, "Transform");
      if (!targetTransform) return;
      const dt = transform.tags.has("timeImmune") ? udt : sdt;

      orbit.prevAngle = orbit.angleDeg;
      orbit.angleDeg = (orbit.angleDeg + orbit.orbitSpeed * dt + 360) % 360;

      const pos = getOrbitPosition(
        orbit,
        targetTransform,
        transform.size,
        orbit.angleDeg,
      );
      transform.prevPosition.copy(transform.position);
      transform.position.set(pos.x, pos.y);
    });
  }
  private updateStickMovement() {
    const components = this.getComponentsGroup(["Stick", "Transform"]);
    components.forEach((ID) => {
      const stick = this.getComponent(ID, "Stick");
      const transform = this.getComponent(ID, "Transform");
      if (!stick || !transform) return;

      const targetTransform = this.getComponent(stick.targetID, "Transform");
      if (!targetTransform) return;

      const pos = getStickPosition(
        stick.angle,
        stick.distance,
        stick.anchor,
        targetTransform,
        transform.size,
      );
      transform.prevPosition.copy(transform.position);
      transform.position.set(pos.x, pos.y);
    });
  }
  private updateMagnetMovement(sdt: number, udt: number) {
    const components = this.getComponentList("Magnet");
    if (!components) return;
    components.forEach((magnet) => {
      if (magnet.state !== "follow") return;
      const transform = this.getComponent(magnet.ID, "Transform");
      const targetTransform = this.getComponent(magnet.targetID, "Transform");
      if (!transform || !targetTransform) return;

      const selfCenter = Vec2.create(
        transform.position.x + transform.size.width * 0.5,
        transform.position.y + transform.size.height * 0.5,
      );
      const targetCenter = Vec2.create(
        targetTransform.position.x + targetTransform.size.width * 0.5,
        targetTransform.position.y + targetTransform.size.height * 0.5,
      );
      const toTarget = targetCenter.sub(selfCenter);
      const distSq = toTarget.lengthSquared();

      const pickupRadius =
        transform.size.width * 0.5 + targetTransform.size.width * 0.5;
      if (distSq <= pickupRadius * pickupRadius) {
        const value = magnet.tags.has("XP_Small") ? 1 : CONSOLIDATE_UNIT;
        magnet.state = "gathered";
        this.events.emitCascade<CoinReachedEvent>("coinReached", {
          ID: magnet.ID,
          value: value,
        });
        return;
      }
      const desiredVelocity =
        distSq > 1 ? toTarget.normalize().scale(magnet.speed) : Vec2.Zero;
      const dt = transform.tags.has("timeImmune") ? udt : sdt;

      magnet.velocity.lerp(desiredVelocity, magnet.pullStrength * dt);
      transform.prevPosition.copy(transform.position);
      transform.position.add(magnet.velocity.clone().scale(dt));
    });
  }

  // private updateReboundMovement(dt: number) {
  // bounce of targets
  //   const components = this.getComponentsGroup(["Rebound", "Transform"]);
  // }
  // private updatePtoPMovement(dt: number) {
  // static movement form A to B
  //   const components = this.getComponentsGroup(["PToPw", "Transform"]);
  // }
}
