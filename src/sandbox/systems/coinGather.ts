import AxiomMath from "@/core/axiom/math";
import SpatialGrid from "@/core/axiom/SpatialGrid";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import Coin from "../entities/coin";
import EntityManager from "@/core/dogma/entityManager";
import items from "../assets/items.json";
import { assert } from "@/utils/utils";
import InputManager from "@/core/engine/inputManager";
import { BattleProgressData } from "./spawner";
export type CoinSpawnEvent = {
  deadPos: Position2D;
};
export type CoinReachedEvent = {
  ID: Symbol;
};
const BASE_GATHER_RADIUS = 200;
export default class CoinGather extends DogmaSystem {
  declare private spatialGrid: SpatialGrid<Symbol>;
  private currentCellSize = BASE_GATHER_RADIUS;
  declare private playerTransform: SystemComponent<"Transform">;
  declare private playerStats: SystemComponent<"CharacterStats">;
  declare private battleProgressData: BattleProgressData;
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
    this.addNewCoins();
    this.updateCoins();
    this.updateGathered();
    if (InputManager.isKeyPressed("g")) this.gatherAllCoinsFromMap();
  }
  private checkPlayerGatherRange() {
    const gatherRadius = this.playerStats.coinCollectRadius;
    if (this.currentCellSize * 1.5 < gatherRadius) {
      this.regenerateGrid();
      this.currentCellSize = gatherRadius;
    }
  }
  private addNewCoins() {
    const events = this.events.getCascade<CoinSpawnEvent[]>("spawnCoinEvent");
    if (!events) return;
    events.forEach((event) => {
      const playerTransform = this.getComponentWithMarker(
        "Player",
        "Transform",
      )!;
      const coinPos = AxiomMath.randomInCirclePoint(event.deadPos, 50);
      const coin = new Coin(coinPos, playerTransform.ID);
      const coinCrop = items.coin;
      const box: Box = {
        x: coinPos.x,
        y: coinPos.y,
        w: coinCrop.width,
        h: coinCrop.height,
      };
      this.spatialGrid.insert({ bounds: box, ID: coin.ID, data: coin.ID });
      EntityManager.spawnEntity(coin, "battle");
    });
  }
  private updateCoins() {
    const box = this.getGatherBox();
    const candidates = this.spatialGrid.query(box);
    candidates.forEach((ID) => {
      const magnet = this.getComponent(ID, "Magnet");
      if (!magnet) return;
      magnet.state = "follow";
      this.spatialGrid.remove(ID);
    });
  }
  private updateGathered() {
    const events = this.events.getCascade<CoinReachedEvent[]>("coinReached");
    if (!events) return;
    events.forEach(({ ID }) => {
      this.battleProgressData.coins++;
      EntityManager.removeEntity(ID, "battle");
    });
  }
  private regenerateGrid() {
    const gatherRadius = this.playerStats.coinCollectRadius;
    const newGrid = new SpatialGrid<Symbol>({
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
    const magnets = this.getComponentList("Magnet")!;
    magnets.forEach(
      (magnet) => magnet.state === "idle" && (magnet.state = "follow"),
    );
    this.spatialGrid.clearAll();
  }
}
