import AxiomMath from "@/core/axiom/math";
import SpatialGrid from "@/core/axiom/SpatialGrid";
import AuroraCamera from "@/core/aurora/camera";
import Time from "@/core/engine/time";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import EntityManager from "@/core/dogma/entityManager";
import items from "../assets/items.json";
import { assert } from "@/utils/utils";
import InputManager from "@/core/engine/inputManager";
import { BattleProgressData } from "./spawner";
import XPSmall from "../entities/xpSmall";
import XPBig from "../entities/xpBig";

export type CoinSpawnEvent = {
  deadPos: Position2D;
};
export type CoinReachedEvent = {
  ID: Symbol;
  value: number;
};

const BASE_GATHER_RADIUS = 100;
const HEAT_CELL_SIZE = 400;
const CONSOLIDATE_THRESHOLD = 50;
export const CONSOLIDATE_UNIT = 10;
const SWEEP_INTERVAL = 5;

export default class XPGather extends DogmaSystem {
  declare private spatialGrid: SpatialGrid<CoinReachedEvent>;
  private currentCellSize = BASE_GATHER_RADIUS;
  declare private playerTransform: SystemComponent<"Transform">;
  declare private playerStats: SystemComponent<"CharacterStats">;
  declare private battleProgressData: BattleProgressData;
  private heatMap: Map<string, number> = new Map();
  private timeSinceSweep = 0;

  constructor(internal: InternalDSProps) {
    super(internal);
  }

  public onStart(): void {
    this.spatialGrid = new SpatialGrid({
      width: BASE_GATHER_RADIUS,
      height: BASE_GATHER_RADIUS,
    });

    this.subscribeToPhase({
      callback: this.updateGatherer.bind(this),
      phase: "update",
      after: ["DamageCalculator"],
    });
    this.events.subscribeToDeferred({
      callback: () => this.gatherAllCoinsFromMap(),
      eventName: "gatherAllCoins",
      sysRef: this,
    });

    const transform = this.getComponentWithMarker("Player", "Transform");
    const stats = this.getComponentWithMarker("Player", "CharacterStats")!;
    assert(
      transform !== undefined,
      "there is no player transform for coin gathering",
    );
    assert(stats !== undefined, "there is no player stats for coin gathering");

    const data = this.getSharedData<BattleProgressData>(
      "scene",
      "battleProgressData",
    );
    assert(
      data !== undefined,
      "there is no registered main battle data bucket",
    );
    this.battleProgressData = data;
    this.playerTransform = transform;
    this.playerStats = stats;
  }

  private updateGatherer() {
    this.checkPlayerGatherRange();
    this.addNewXPNodes();
    this.updateXPNodes();
    this.updateGathered();
    if (InputManager.isKeyPressed("g")) this.gatherAllCoinsFromMap();

    this.timeSinceSweep += Time.getFixedDeltaTime();
    if (this.timeSinceSweep >= SWEEP_INTERVAL) {
      this.timeSinceSweep = 0;
      this.sweepHeatmap();
    }
  }

  private checkPlayerGatherRange() {
    const gatherRadius = this.playerStats.coinCollectRadius;
    if (this.currentCellSize * 1.5 < gatherRadius) {
      this.regenerateGrid();
      this.currentCellSize = gatherRadius;
    }
  }

  private addNewXPNodes() {
    const events = this.events.getCascade<CoinSpawnEvent[]>("spawnCoinEvent");
    if (!events) return;
    const playerTransform = this.getComponentWithMarker("Player", "Transform")!;

    events.forEach((event) => {
      const coinPos = AxiomMath.randomInCirclePoint(event.deadPos, 50);
      const coin = new XPSmall(coinPos, playerTransform.ID);
      const coinCrop = items.xp_small;
      const box: Box = {
        x: coinPos.x,
        y: coinPos.y,
        w: coinCrop.width,
        h: coinCrop.height,
      };

      this.spatialGrid.insert({
        bounds: box,
        ID: coin.ID,
        data: { ID: coin.ID, value: 1 },
      });
      EntityManager.spawnEntity(coin, "battle");

      this.incrementHeat(coinPos);
    });
  }

  private updateXPNodes() {
    const box = this.getGatherBox();
    const candidates = this.spatialGrid.query(box);
    candidates.forEach(({ ID }) => {
      const magnet = this.getComponent(ID, "Magnet");
      if (!magnet) return;
      magnet.state = "follow";
      this.spatialGrid.remove(ID);

      const transform = this.getComponent(ID, "Transform");
      if (transform) this.decrementHeat(transform.position);
    });
  }

  private updateGathered() {
    const events = this.events.getCascade<CoinReachedEvent[]>("coinReached");
    if (!events) return;
    events.forEach(({ ID, value }) => {
      this.battleProgressData.coins += value;
      EntityManager.removeEntity(ID, "battle");
    });
  }

  private incrementHeat(pos: Position2D) {
    const key = this.heatCellKey(pos);
    this.heatMap.set(key, (this.heatMap.get(key) ?? 0) + 1);
  }

  private decrementHeat(pos: Position2D) {
    const key = this.heatCellKey(pos);
    const current = this.heatMap.get(key) ?? 0;
    this.heatMap.set(key, Math.max(0, current - 1));
  }

  private sweepHeatmap() {
    const viewBox = AuroraCamera.getViewBox();
    const playerTransform = this.getComponentWithMarker("Player", "Transform")!;

    for (const [key, count] of this.heatMap) {
      if (count < CONSOLIDATE_THRESHOLD) continue;
      const cellBox = this.heatCellBox(key);
      if (this.boxesIntersect(cellBox, viewBox)) continue;
      this.consolidateCell(key, cellBox, playerTransform.ID);
    }
  }

  private consolidateCell(key: string, cellBox: Box, targetID: Symbol) {
    const candidates = this.spatialGrid
      .query(cellBox)
      .filter((c) => c.value === 1);

    const bigCount = Math.floor(candidates.length / CONSOLIDATE_UNIT);
    if (bigCount < 1) return;

    const toRemove = candidates.slice(0, bigCount * CONSOLIDATE_UNIT);
    toRemove.forEach(({ ID }) => {
      this.spatialGrid.remove(ID);
      EntityManager.removeEntity(ID, "battle");
    });

    for (let i = 0; i < bigCount; i++) {
      const pos = AxiomMath.randomInRectPoint(cellBox);
      const big = new XPBig(pos, targetID);
      this.spatialGrid.insert({
        bounds: {
          x: pos.x,
          y: pos.y,
          w: items.xp_big.width,
          h: items.xp_big.height,
        },
        ID: big.ID,
        data: { ID: big.ID, value: CONSOLIDATE_UNIT },
      });
      console.log(CONSOLIDATE_UNIT);
      EntityManager.spawnEntity(big, "battle");
    }

    this.heatMap.set(key, candidates.length - toRemove.length);
  }

  private regenerateGrid() {
    const gatherRadius = this.playerStats.coinCollectRadius;
    const newGrid = new SpatialGrid<CoinReachedEvent>({
      width: gatherRadius,
      height: gatherRadius,
    });
    this.spatialGrid.entries().forEach((item) => newGrid.insert(item));
    this.spatialGrid = newGrid;
  }

  private getGatherBox(): Box {
    const radius = this.playerStats.coinCollectRadius;
    const centerX =
      this.playerTransform.position.x + this.playerTransform.size.width * 0.5;
    const centerY =
      this.playerTransform.position.y + this.playerTransform.size.height * 0.5;
    return {
      x: centerX - radius,
      y: centerY - radius,
      w: radius * 2,
      h: radius * 2,
    };
  }

  private gatherAllCoinsFromMap() {
    const magnets = this.getComponentList("Magnet");
    if (!magnets) return;
    magnets.forEach(
      (magnet) => magnet.state === "idle" && (magnet.state = "follow"),
    );
    this.spatialGrid.clearAll();
  }
  private heatCellKey(pos: Position2D): string {
    const cx = Math.floor(pos.x / HEAT_CELL_SIZE);
    const cy = Math.floor(pos.y / HEAT_CELL_SIZE);
    return `${cx}:${cy}`;
  }

  private heatCellBox(key: string): Box {
    const [cx, cy] = key.split(":").map(Number);
    return {
      x: cx * HEAT_CELL_SIZE,
      y: cy * HEAT_CELL_SIZE,
      w: HEAT_CELL_SIZE,
      h: HEAT_CELL_SIZE,
    };
  }

  private boxesIntersect(a: Box, b: Box): boolean {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
  }
}
