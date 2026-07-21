import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import Time from "@/core/engine/time";
import Vec2D from "@/utils/vec2D";

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
    this.updateOrbitalMovement(dt);
    this.updateStickMovement();
    // this.updateReboundMovement(dt);
    // this.updatePtoPMovement(dt);
  }
  private updateRigidMovements(dt: number) {
    // velocity based movement
    const components = this.getComponentsGroup(["Rigid", "Transform"]);
    components.forEach((ID) => {
      const rigid = this.getComponent(ID, "Rigid");
      const transform = this.getComponent(ID, "Transform");
      if (!rigid || !transform) return;
      transform.prevPosition.x = transform.position.x;
      transform.prevPosition.y = transform.position.y;
      transform.position.x += rigid.velocity.x * dt;
      transform.position.y += rigid.velocity.y * dt;

      rigid.velocity.x *= Math.pow(rigid.friction, dt * 60);
      rigid.velocity.y *= Math.pow(rigid.friction, dt * 60);

      if (Math.abs(rigid.velocity.x) < 0.1) rigid.velocity.x = 0;
      if (Math.abs(rigid.velocity.y) < 0.1) rigid.velocity.y = 0;
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

      const pos = this.getOrbitPosition(orbit, targetTransform, orbit.angleDeg);

      transform.prevPosition.x = transform.position.x;
      transform.prevPosition.y = transform.position.y;
      transform.position.x = pos.x;
      transform.position.y = pos.y;
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

      const targetCenter = Vec2D.create([
        targetTransform.position.x + targetTransform.size.width * 0.5,
        targetTransform.position.y + targetTransform.size.height * 0.5,
      ]);
      const angleRad = (stick.angle * Math.PI) / 180;
      const offsetDir = Vec2D.create([Math.sin(angleRad), -Math.cos(angleRad)]);
      const offset = offsetDir.multiply(stick.distance);
      const desired = targetCenter
        .sub(offset)
        .sub([transform.size.width / 2, transform.size.height / 2]);

      transform.prevPosition.x = transform.position.x;
      transform.prevPosition.y = transform.position.y;
      transform.position.x = desired.x;
      transform.position.y = desired.y;
    });
  }
  private getOrbitPosition(
    orbit: SystemComponent<"Orbit">,
    targetTransform: SystemComponent<"Transform">,
    angleDeg: number,
  ): Position2D {
    const angleRad = (angleDeg * Math.PI) / 180;
    const centerX =
      targetTransform.position.x + targetTransform.size.width * 0.5;
    const centerY =
      targetTransform.position.y + targetTransform.size.height * 0.5;
    return {
      x:
        centerX +
        Math.sin(angleRad) * orbit.radius.x -
        targetTransform.size.width / 2,
      y:
        centerY -
        Math.cos(angleRad) * orbit.radius.y -
        targetTransform.size.height / 2,
    };
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
