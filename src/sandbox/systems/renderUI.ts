import AuroraCamera from "@/core/aurora/camera";
import Aurora from "@/core/aurora/core";
import Draw from "@/core/aurora/draw";
import Renderer from "@/core/aurora/renderer/renderer";
import AxiomMath from "@/core/axiom/math";
import Vec2 from "@/core/axiom/vec2";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import Time from "@/core/engine/time";
import { assert, createColliderBox, getOrbitPosition } from "@/utils/utils";
import { BattleProgressData } from "./spawner";
const DRAW_MARGIN = 128;
const Y_SORT_FACTOR = 1000000;
export default class Render extends DogmaSystem {
  declare private battleProgressData: BattleProgressData;

  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }

  public onStart(): void {
    this.subscribeToPhase({
      phase: "render",
      callback: this.renderer.bind(this),
    });
    const data = this.getSharedData<BattleProgressData>(
      "scene",
      "battleProgressData",
    );
    assert(
      data !== undefined,
      "there is no registered main battle data bucket",
    );
    this.battleProgressData = data;
  }

  renderer() {
    this.renderInterface();
    this.renderLvlGainer();
  }
  private renderLvlGainer() {
    Draw.guiRect({
      position: {
        x: 100,
        y: 100,
      },
      size: { width: 500, height: 500 },
      tint: [0, 0, 0, 170],
    });
  }
  private renderInterface() {
    const stats = this.getComponentWithMarker("Player", "CharacterStats")!;
    const hp = AxiomMath.map(stats.currentHP, 0, stats.maxHP, 0, 50);
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
    Draw.guiRect({
      position: { x: 20, y: 5 },
      size: { width: Aurora.canvas.width - 40, height: 20 },
      tint: [0, 0, 0, 255],
    });
    Draw.guiRect({
      position: { x: 25, y: 10 },
      size: { width: Aurora.canvas.width - 50, height: 10 },
      tint: [255, 0, 0, 255],
    });
    const val = AxiomMath.map(
      this.battleProgressData.coins,
      0,
      this.battleProgressData.nextLvlCoin,
      0,
      Aurora.canvas.width - 50,
      true,
    );
    Draw.guiRect({
      position: { x: 25, y: 10 },
      size: { width: val, height: 10 },
      tint: [255, 250, 0, 255],
    });
    Draw.guiRect({
      position: { x: Aurora.canvas.width - 85, y: 25 },
      size: { width: 65, height: 30 },
      tint: [0, 0, 0, 255],
    });
    Draw.guiRect({
      position: { x: Aurora.canvas.width - 80, y: 30 },
      size: { width: 55, height: 20 },
      tint: [255, 0, 0, 255],
    });
    Draw.guiText({
      font: "lato",
      fontSize: { mode: "pixel", size: 8 },
      position: { mode: "pixel", x: Aurora.canvas.width * 0.5 - 25, y: 8 },
      text: `${this.battleProgressData.coins}/${this.battleProgressData.nextLvlCoin}`,
      fontColor: [0, 0, 0, 255],
    });
    Draw.guiText({
      font: "lato",
      fontSize: { mode: "pixel", size: 14 },
      position: { mode: "pixel", x: Aurora.canvas.width - 80, y: 30 },
      text: `Lvl:${this.battleProgressData.lvl}`,
      fontColor: [0, 0, 0, 255],
    });
  }
}
