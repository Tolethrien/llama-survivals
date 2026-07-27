import EntityManager from "@/core/dogma/entityManager";
import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import Time from "@/core/engine/time";
import Archer from "../entities/enemies/archer";
import AuroraCamera from "@/core/aurora/camera";
import AxiomMath from "@/core/axiom/math";
import Ork from "../entities/enemies/ork";
//spawner musi cala fale spawnowac naraz
//spawner musi miec jakis rodzaj delayu miedzy spawnami
//spawner musi miec build fali czyli ile i czego i gdzie i jak
type ViewSide = "top" | "right" | "bottom" | "left";
export default class Spawner extends DogmaSystem {
  private spawnDelay: number = 0.1; //s
  private currentTime: number = 0;
  constructor(internal: InternalDSProps) {
    super(internal);
  }
  public onStart(): void {
    this.subscribeToPhase({ phase: "update", callback: this.spawn.bind(this) });
    // const pos = this.getRandomOutsideViewPosition();
    // const archer = new Ork({ position: pos });
    // EntityManager.spawnEntity(archer, "battle");
  }
  private spawn() {
    const dt = Time.getDeltaTime();
    this.currentTime -= dt;
    if (this.currentTime <= 0) {
      this.spawnWave();
      this.currentTime = this.spawnDelay;
    }
  }
  private spawnWave() {
    const pos = this.getRandomOutsideViewPosition();
    const isArch = AxiomMath.randomBool();
    let mob: Ork | Archer | undefined = undefined;
    if (isArch) {
      mob = new Ork({ position: pos });
    } else mob = new Archer({ position: pos });
    EntityManager.spawnEntity(mob, "battle");
  }
  private getRandomOutsideViewPosition(
    side?: ViewSide,
    padding = 0,
  ): Position2D {
    const viewBox = AuroraCamera.getViewBox();
    const pickedSize = side ?? this.pickRandomSide();

    switch (pickedSize) {
      case "top":
        return {
          x: AxiomMath.randomFloat(viewBox.x, viewBox.x + viewBox.w),
          y: viewBox.y - padding,
        };
      case "right":
        return {
          x: viewBox.x + viewBox.w + padding,
          y: AxiomMath.randomFloat(viewBox.y, viewBox.y + viewBox.h),
        };
      case "bottom":
        return {
          x: AxiomMath.randomFloat(viewBox.x, viewBox.x + viewBox.w),
          y: viewBox.y + viewBox.h + padding,
        };
      case "left":
        return {
          x: viewBox.x - padding,
          y: AxiomMath.randomFloat(viewBox.y, viewBox.y + viewBox.h),
        };
    }
  }

  private pickRandomSide(): ViewSide {
    const sides: ViewSide[] = ["top", "right", "bottom", "left"];
    return sides[AxiomMath.randomInt(0, 3)];
  }
}
