import AuroraCamera from "@/core/aurora/camera";
import Aurora from "@/core/aurora/core";
import Draw from "@/core/aurora/draw";
import Vec2 from "@/core/axiom/vec2";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import InputManager from "@/core/engine/inputManager";
import { assert } from "@/utils/utils";

export default class ChestGather extends DogmaSystem {
  declare private playerTransform: SystemComponent<"Transform">;
  constructor(internal: InternalDSProps) {
    super(internal);
  }
  public onStart(): void {
    this.subscribeToPhase({
      callback: this.updateChests.bind(this),
      phase: "update",
    });
    const transform = this.getComponentWithMarker("Player", "Transform");
    assert(
      transform !== undefined,
      "There is no transform for player to track chests",
    );
    this.playerTransform = transform;
  }
  private updateChests() {
    const chestIDs = this.getComponentsWithTags("Transform", ["chest"]);
    for (const ID of chestIDs) {
      const transform = this.getComponent(ID, "Transform")!;
      const dist = transform.position.distanceTo(this.playerTransform.position);
      if (dist > 100) continue;
      //do something
      this.displayButton(transform);
      if (InputManager.isKeyPressed("r")) {
        this.roll();
      }
      break;
    }
  }
  private displayButton(transform: SystemComponent<"Transform">) {
    const pos = AuroraCamera.worldToScreen({
      x: transform.position.x + transform.size.width * 0.5,
      y: transform.position.y - 40,
    });
    Draw.guiRect({
      position: { x: pos.x - 10, y: pos.y },
      size: { width: 20, height: 20 },
    });
    Draw.guiText({
      position: { x: pos.x - 5, y: pos.y, mode: "pixel" },
      font: "lato",
      fontSize: { mode: "pixel", size: 16 },
      text: "R",
      fontColor: [0, 0, 0, 255],
    });
  }
  private roll() {
    console.log("rolllll");
  }
}
