import EntityManager from "@/core/dogma/entityManager";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import Time from "@/core/engine/time";
import Archer from "../entities/enemies/archer";
import AuroraCamera from "@/core/aurora/camera";
import AxiomMath from "@/core/axiom/math";
import Ork from "../entities/enemies/ork";
import Draw from "@/core/aurora/draw";
import Aurora from "@/core/aurora/core";
import Vec2 from "@/core/axiom/vec2";

type ViewSide = "top" | "right" | "bottom" | "left";
export type BattleProgressData = {
  currentLvlXP: number;
  lvl: number;
  nextLvlXP: number;
  nextLvlMultiplier: number;
  totalXP: number;
};
export type LvlUpEvent = {
  lvls: number;
};

const LVL_MULTI = 10;

// tempo bazowe (throughput mobów/s, niezależne od kształtu fal)
const BASE_SPAWN_DELAY = 3; // na starcie: ~1 mob / 3s
const MIN_SPAWN_DELAY = 0.1; // najszybsze możliwe "per-mob" tempo
const SPAWN_RATE_CURVE = 0.1; // o ile spawnDelay maleje na sekundę przeżycia

// kształt fal: 0 = dużo małych fal (jak dawniej, ~1 mob na tick), 1 = mało dużych fal
const WAVE_SHAPE = 0.8;
const MAX_WAVE_FACTOR = 12; // maks. zgrupowanie przy WAVE_SHAPE = 1
const WAVE_SIZE_GROWTH_PER_MIN = 2; // dodatkowy wzrost rozmiaru fali w czasie, niezależny od sliderka
const WAVE_SHAPE_RAMP_TIME = 90; // jak dlugo zajmie dojscie do docelowgo kształtu fali
const ATTACK_BASELINE = 0.15; // jak mocno wrogowie wychodzą na front graczowi
const SPAWN_PADDING = 100;
const BASE_CAP = 20;
const CAP_GROWTH_PER_MIN = 15; // ile capu przybywa na minutę przeżycia

export default class Spawner extends DogmaSystem {
  private currentTime: number = 0;
  private lvlCheckInterval: number = 1; // s
  private lvlCheckTimer: number = 0;
  private pendingLevelUps: number = 0;
  private elapsedTime = 0;
  private debugLogInterval = 5;
  private debugLogTimer = 0;
  declare private playerRigid: SystemComponent<"Rigid">;
  declare private battleProgressData: BattleProgressData;

  constructor(internal: InternalDSProps) {
    super(internal);
  }

  public onStart(): void {
    this.subscribeToPhase({
      phase: "update",
      callback: this.spawnerUpdater.bind(this),
    });
    this.subscribeToPhase({
      phase: "render",
      callback: this.renderUI.bind(this),
    });
    this.battleProgressData = {
      currentLvlXP: 0,
      lvl: 1,
      nextLvlXP: LVL_MULTI,
      nextLvlMultiplier: LVL_MULTI,
      totalXP: 0,
    };

    this.setSharedData<BattleProgressData>(
      "scene",
      "battleProgressData",
      this.battleProgressData,
    );
    this.playerRigid = this.getComponentWithMarker("Player", "Rigid")!;
  }

  private spawnerUpdater() {
    const dt = Time.getDeltaTime();
    this.elapsedTime += dt;
    this.tickLvlCheck(dt);
    this.spawn(dt);
    this.tickDebugLog(dt);
  }

  private spawn(dt: number) {
    this.currentTime -= dt;
    if (this.currentTime <= 0) {
      this.spawnWave();
      this.currentTime = this.getCurrentWaveInterval();
    }
  }

  private spawnWave() {
    const enemies = this.getComponentsWithTags("Transform", ["enemy"]);
    const cap = this.getCurrentCap();
    if (enemies.size >= cap) return;

    const waveSize = Math.min(this.getCurrentWaveSize(), cap - enemies.size);
    const side = this.pickRandomSide(); // ta sama strona dla całej fali

    for (let i = 0; i < waveSize; i++) {
      const pos = this.getRandomOutsideViewPosition(side, SPAWN_PADDING);
      const isOrk = AxiomMath.randomBool(0.8);
      const mob = isOrk
        ? new Ork({ position: pos })
        : new Archer({ position: pos });
      EntityManager.spawnEntity(mob, "battle");
    }
  }

  private getCurrentWaveSize(): number {
    const rampT = Math.min(1, this.elapsedTime / WAVE_SHAPE_RAMP_TIME);
    const shape = WAVE_SHAPE * rampT;
    const factor = AxiomMath.lerp(1, MAX_WAVE_FACTOR, shape);

    const minutes = this.elapsedTime / 60;
    return Math.max(1, Math.round(factor + WAVE_SIZE_GROWTH_PER_MIN * minutes));
  }

  private getCurrentWaveInterval(): number {
    return this.getCurrentSpawnDelay() * this.getCurrentWaveSize();
  }

  private getCurrentCap(): number {
    const minutes = this.elapsedTime / 60;
    return BASE_CAP + CAP_GROWTH_PER_MIN * minutes;
  }

  private getCurrentSpawnDelay(): number {
    return Math.max(
      MIN_SPAWN_DELAY,
      BASE_SPAWN_DELAY - SPAWN_RATE_CURVE * this.elapsedTime,
    );
  }

  private tickDebugLog(dt: number) {
    this.debugLogTimer -= dt;
    if (this.debugLogTimer > 0) return;
    this.debugLogTimer = this.debugLogInterval;

    const enemies = this.getComponentsWithTags("Transform", ["enemy"]);
    console.table({
      elapsed: this.formatTime(this.elapsedTime),
      "elapsed (s)": this.elapsedTime.toFixed(1),
      "per-mob delay (s)": this.getCurrentSpawnDelay().toFixed(3),
      "wave size": this.getCurrentWaveSize(),
      "wave interval (s)": this.getCurrentWaveInterval().toFixed(3),
      "current cap": Math.floor(this.getCurrentCap()),
      "enemies on map": enemies.size,
      "player lvl": this.battleProgressData.lvl,
    });
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

  private tickLvlCheck(dt: number) {
    const gained = this.validateLvl();
    this.pendingLevelUps += gained;
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
    const vel = this.playerRigid.velocity;
    if (vel.length() === 0) {
      const sides: ViewSide[] = ["top", "right", "bottom", "left"];
      return sides[AxiomMath.randomInt(0, 3)];
    }

    const dir = vel.clone().normalize();
    const SIDE_DIRS: Record<ViewSide, Vec2> = {
      top: Vec2.create(0, -1),
      bottom: Vec2.create(0, 1),
      left: Vec2.create(-1, 0),
      right: Vec2.create(1, 0),
    };

    const sides = Object.keys(SIDE_DIRS) as ViewSide[];
    const weights = sides.map(
      (side) => Math.max(0, dir.dot(SIDE_DIRS[side])) + ATTACK_BASELINE,
    );

    return AxiomMath.weightedRandom(sides, weights);
  }

  private validateLvl() {
    const { currentLvlXP, lvl, nextLvlMultiplier } = this.battleProgressData;

    const a = nextLvlMultiplier / 2;
    const b = nextLvlMultiplier * (lvl - 0.5);
    const c = -currentLvlXP;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return 0;

    const k = Math.floor((-b + Math.sqrt(discriminant)) / (2 * a));
    if (k <= 0) return 0;
    const cost = nextLvlMultiplier * (k * lvl + (k * (k - 1)) / 2);
    this.battleProgressData.lvl += k;
    this.battleProgressData.currentLvlXP -= cost;
    this.battleProgressData.nextLvlXP =
      this.battleProgressData.nextLvlMultiplier * this.battleProgressData.lvl;
    return k;
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  private renderUI() {
    this.renderInterface();
  }

  private renderInterface() {
    const stats = this.getComponentWithMarker("Player", "CharacterStats")!;
    const hp = AxiomMath.map(stats.currentHP, 0, stats.maxHP, 0, 50);
    //TODO: przeniesc bo to to nie ma senus tutaj
    Draw.guiRect({
      position: {
        x: Aurora.canvas.width / 2 - 25 - 2,
        y: Aurora.canvas.height / 2 - 30 - 2,
      },
      size: { width: 50 + 4, height: 4 + 4 },
      tint: [0, 0, 0, 170],
    });
    Draw.guiRect({
      position: {
        x: Aurora.canvas.width / 2 - 25,
        y: Aurora.canvas.height / 2 - 30,
      },
      size: { width: hp, height: 4 },
      tint: [255, 0, 0, 150],
    });

    // --- pionowy pasek XP/coins, teraz po prawej stronie ---
    const barWidth = 20;
    const barHeight = Aurora.canvas.height - 40;
    const barX = Aurora.canvas.width - 20 - barWidth;
    const barY = 20;

    Draw.guiRect({
      position: { x: barX, y: barY },
      size: { width: barWidth, height: barHeight },
      tint: [0, 0, 0, 255],
    });

    const innerX = barX + 5;
    const innerY = barY + 5;
    const innerWidth = barWidth - 10;
    const innerHeight = barHeight - 10;

    Draw.guiRect({
      position: { x: innerX, y: innerY },
      size: { width: innerWidth, height: innerHeight },
      tint: [150, 0, 0, 255],
    });

    const val = AxiomMath.map(
      this.battleProgressData.currentLvlXP,
      0,
      this.battleProgressData.nextLvlXP,
      0,
      innerHeight,
      true,
    );
    Draw.guiRect({
      position: { x: innerX, y: innerY + innerHeight - val },
      size: { width: innerWidth, height: val },
      tint: [105, 0, 0, 255],
    });

    // --- boks ze statami, prawy dolny róg, obok paska ---
    const boxWidth = 90;
    const boxHeight = 90;
    const boxX = barX - boxWidth - 2;
    const boxY = Aurora.canvas.height - boxHeight - 20;

    Draw.guiRect({
      position: { x: boxX, y: boxY },
      size: { width: boxWidth, height: boxHeight },
      tint: [0, 0, 0, 200],
    });
    Draw.guiText({
      font: "lato",
      fontSize: { mode: "pixel", size: 12 },
      position: { mode: "pixel", x: boxX + 8, y: boxY + 6 },
      text: `Lvl ${this.battleProgressData.lvl}`,
      fontColor: [255, 255, 255, 255],
    });
    Draw.guiText({
      font: "lato",
      fontSize: { mode: "pixel", size: 12 },
      position: { mode: "pixel", x: boxX + 8, y: boxY + 26 },
      text: `Gold: ${`100`}`,
      fontColor: [255, 255, 255, 255],
    });
    Draw.guiText({
      font: "lato",
      fontSize: { mode: "pixel", size: 12 },
      position: { mode: "pixel", x: boxX + 8, y: boxY + 46 },
      text: `total XP: ${this.battleProgressData.totalXP}`,
      fontColor: [255, 255, 255, 255],
    });
    Draw.guiText({
      font: "lato",
      fontSize: { mode: "pixel", size: 9 },
      position: { mode: "pixel", x: boxX + 8, y: boxY + 66 },
      text: `${this.battleProgressData.currentLvlXP}/${this.battleProgressData.nextLvlXP}`,
      fontColor: [200, 200, 200, 255],
    });
    Draw.guiText({
      font: "lato",
      fontSize: { mode: "pixel", size: 20 },
      position: { mode: "pixel", x: Aurora.canvas.width - 125, y: 10 },
      text: this.formatTime(this.elapsedTime),
      fontColor: [255, 255, 255, 255],
    });
  }
}
