import EntityManager from "@/core/dogma/entityManager";
import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import Time from "@/core/engine/time";
import Archer from "../entities/enemies/archer";
import AuroraCamera from "@/core/aurora/camera";
import AxiomMath from "@/core/axiom/math";
import Ork from "../entities/enemies/ork";
import Dogma from "@/core/dogma/dogma";
//spawner musi cala fale spawnowac naraz
//spawner musi miec jakis rodzaj delayu miedzy spawnami
//spawner musi miec build fali czyli ile i czego i gdzie i jak
type ViewSide = "top" | "right" | "bottom" | "left";
export type BattleProgressData = {
  coins: number;
  lvl: number;
  nextLvlCoin: number;
  nextLvlMultiplier: number;
};
export type LvlUpEvent = {
  lvls: number;
};
const LVL_MULTI = 10;
const ENEMY_MULTI = 10;
export default class Spawner extends DogmaSystem {
  private spawnDelay: number = 0.1; //s
  private currentTime: number = 0;
  private lvlCheckInterval: number = 1; // s
  private lvlCheckTimer: number = 0;
  private pendingLevelUps: number = 0;
  declare private battleProgressData: BattleProgressData;
  constructor(internal: InternalDSProps) {
    super(internal);
  }
  public onStart(): void {
    this.subscribeToPhase({
      phase: "update",
      callback: this.spawnerUpdater.bind(this),
    });
    this.battleProgressData = {
      coins: 0,
      lvl: 1,
      nextLvlCoin: LVL_MULTI,
      nextLvlMultiplier: LVL_MULTI,
    };
    this.setSharedData<BattleProgressData>(
      "scene",
      "battleProgressData",
      this.battleProgressData,
    );
  }
  private spawnerUpdater() {
    this.tickLvlCheck();
    this.spawn();
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
    const enemies = this.getComponentsWithTags("Transform", ["enemy"]);
    if (enemies.size >= this.battleProgressData.lvl * ENEMY_MULTI) return;
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
  private tickLvlCheck() {
    const gained = this.validateLvl();
    this.pendingLevelUps += gained;
    const dt = Time.getDeltaTime();
    this.lvlCheckTimer -= dt;
    if (this.lvlCheckTimer <= 0) {
      if (this.pendingLevelUps > 0) {
        this.events.emitCascade<LvlUpEvent>("lvlUpEvent", {
          lvls: this.pendingLevelUps,
        });
      }
      this.pendingLevelUps = 0;
      this.lvlCheckTimer = this.lvlCheckInterval;
    }
  }
  private pickRandomSide(): ViewSide {
    const sides: ViewSide[] = ["top", "right", "bottom", "left"];
    return sides[AxiomMath.randomInt(0, 3)];
  }
  private validateLvl() {
    const { coins, lvl, nextLvlMultiplier } = this.battleProgressData;

    const a = nextLvlMultiplier / 2;
    const b = nextLvlMultiplier * (lvl - 0.5);
    const c = -coins;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return 0;

    const k = Math.floor((-b + Math.sqrt(discriminant)) / (2 * a));
    if (k <= 0) return 0;
    const cost = nextLvlMultiplier * (k * lvl + (k * (k - 1)) / 2);
    this.battleProgressData.lvl += k;
    this.battleProgressData.coins -= cost;
    this.battleProgressData.nextLvlCoin =
      this.battleProgressData.nextLvlMultiplier * this.battleProgressData.lvl;
    return k;
  }
}
