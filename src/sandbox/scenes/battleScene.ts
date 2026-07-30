import Dogma from "@/core/dogma/dogma";
import Player from "../entities/player";
import Tile from "../entities/tile";
import EntityManager from "@/core/dogma/entityManager";
const MAP_CONFIG = {
  size: { width: 100, height: 100 },
  gridSize: 64,
  mobSpawnRate: 0.8,
};
export const RENDER_LAYER = {
  ground: 0,
  groundAttacks: 0.1,
  onGround: 0.2,
  main: 0.3,
  overlay: 0.4,
};

export default class BattleScene {
  constructor() {
    this.spawnWorld();
    this.generateMap();
  }
  private spawnWorld() {
    const main = Dogma.createScene("battle");
    main.addSystem("GameInputs");
    main.addSystem("UIInputs");
    main.addSystem("AIPerception");
    main.addSystem("AISwarm");
    main.addSystem("Physics");
    main.addSystem("Collision");
    main.addSystem("AttackDirector");
    main.addSystem("DamageCalculator");
    main.addSystem("LifeCycle");
    main.addSystem("Spawner");
    main.addSystem("CoinGather");
    main.addSystem("LvlUpGui");
    main.addSystem("RenderGame");
    // main.addSystem("RenderUI");

    const player = new Player();
    EntityManager.spawnEntity(player, "battle");
    console.log(player);
  }
  private generateMap() {
    for (let i = 0; i < MAP_CONFIG.size.width; i++) {
      for (let j = 0; j < MAP_CONFIG.size.height; j++) {
        const pos = { x: i * MAP_CONFIG.gridSize, y: j * MAP_CONFIG.gridSize };
        const tile = new Tile({ position: pos });
        EntityManager.spawnEntity(tile, "battle");
      }
    }
  }
}
