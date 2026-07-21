import Dogma from "@/core/dogma/dogma";
import Player from "../entities/player";
import Tile from "../entities/tile";
import EntityManager from "@/core/dogma/entityManager";
import Ork from "../entities/enemies/ork";
import Archer from "../entities/enemies/archer";
const MAP_CONFIG = {
  size: { width: 100, height: 100 },
  gridSize: 64,
  mobSpawnRate: 0.8,
};
export const RENDER_LAYER = {
  ground: 0,
  groundAttacks: 0.1,
  chars: 0.2,
  charAttacks: 0.3,
};

export default class BattleScene {
  constructor() {
    this.spawnWorld();
    this.generateMap();
  }
  private spawnWorld() {
    window.addEventListener(
      "keypress",
      (e) => e.key === "l" && console.log(Dogma.getScene("battle")),
    );
    const main = Dogma.createScene("battle");
    main.addSystem("GameInputs");
    main.addSystem("AIPerception");
    main.addSystem("AISwarm");
    main.addSystem("Physics");
    main.addSystem("Collision");
    // main.addSystem("AICombat");
    // main.addSystem("PlayerCombat");
    main.addSystem("AttackDirector");
    main.addSystem("DamageCalculator");
    main.addSystem("LifeCycle");
    main.addSystem("Render");
    const player = new Player();
    EntityManager.spawnEntity(player, "battle");
    console.log(player);
    const enemy = new Archer({ position: { x: 100, y: 100 } });
    EntityManager.spawnEntity(enemy, "battle");
    // const ork = new Ork({ position: { x: 100, y: 100 } });
    // EntityManager.spawnEntity(ork, "battle");
    // const orka = new Ork({ position: { x: 100, y: 200 } });
    // EntityManager.spawnEntity(orka, "battle");
  }
  private generateMap() {
    for (let i = 0; i < MAP_CONFIG.size.width; i++) {
      for (let j = 0; j < MAP_CONFIG.size.height; j++) {
        const pos = { x: i * MAP_CONFIG.gridSize, y: j * MAP_CONFIG.gridSize };
        const tile = new Tile({ position: pos });
        EntityManager.spawnEntity(tile, "battle");
        if (Math.random() > MAP_CONFIG.mobSpawnRate) {
          if (Math.random() > 0.2)
            EntityManager.spawnEntity(new Ork({ position: pos }), "battle");
          else
            EntityManager.spawnEntity(new Archer({ position: pos }), "battle");
        }
      }
    }
  }
}
