import Vec2 from "@/core/axiom/vec2";
import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import Time from "@/core/engine/time";
import { getOrbitPosition, getStickPosition } from "@/utils/utils";

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
    const dt = Time.getFixedDeltaTime();
    this.updateRigidMovements(dt);
    this.updateProjectileMovements(dt);
    this.updateOrbitalMovement(dt);
    this.updateStickMovement();
    // this.updateReboundMovement(dt);
    // this.updatePtoPMovement(dt);
  }
  private updateRigidMovements(dt: number) {
    // mobs movement
    const components = this.getComponentsGroup(["Rigid", "Transform"]);
    components.forEach((ID) => {
      const rigid = this.getComponent(ID, "Rigid");
      const transform = this.getComponent(ID, "Transform");
      if (!rigid || !transform) return;
      transform.prevPosition.copy(transform.position);
      transform.position.add(rigid.velocity.clone().scale(dt));

      rigid.velocity.scale(Math.pow(rigid.friction, dt * 60));
      if (Math.abs(rigid.velocity.x) < 0.1) rigid.velocity.setAxis("x", 0);
      if (Math.abs(rigid.velocity.y) < 0.1) rigid.velocity.setAxis("y", 0);
    });
  }
  private updateProjectileMovements(dt: number) {
    const components = this.getComponentsGroup(["Projectile", "Transform"]);
    components.forEach((ID) => {
      const rigid = this.getComponent(ID, "Rigid");
      const transform = this.getComponent(ID, "Transform");
      if (!rigid || !transform) return;
      transform.prevPosition.copy(transform.position);
      transform.position.add(rigid.velocity.clone().scale(dt));
    });
  }
  private updateOrbitalMovement(dt: number) {
    const components = this.getComponentsGroup(["Orbit", "Transform"]);
    components.forEach((ID) => {
      const orbit = this.getComponent(ID, "Orbit");
      const transform = this.getComponent(ID, "Transform");
      if (!orbit || !transform) return;

      const targetTransform = this.getComponent(orbit.targetID, "Transform");
      if (!targetTransform) return;

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

  // private updateReboundMovement(dt: number) {
  // bounce of targets
  //   const components = this.getComponentsGroup(["Rebound", "Transform"]);
  // }
  // private updatePtoPMovement(dt: number) {
  // static movement form A to B
  //   const components = this.getComponentsGroup(["PToPw", "Transform"]);
  // }
}
