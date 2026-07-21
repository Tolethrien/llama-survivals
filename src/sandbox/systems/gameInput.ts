import Dogma from "@/core/dogma/dogma";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import InputManager from "@/core/engine/inputManager";
import Time from "@/core/engine/time";
import { assert } from "@/utils/utils";
import Vec2D from "@/utils/vec2D";

export default class GameInputs extends DogmaSystem {
  declare private playerRigid: SystemComponent<"Rigid">;
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }
  public onStart(): void {
    this.subscribeToPhase({
      phase: "preUpdate",
      callback: this.playerMovementInputs.bind(this),
      before: ["Physics"],
    });

    const rigid = this.getComponentWithMarker("Player", "Rigid");
    console.log(Dogma.getScene("battle"));
    assert(
      rigid !== undefined,
      "There is no player rigid in game, should be impossible",
    );
    this.playerRigid = rigid;
  }
  public playerMovementInputs() {
    let axis = Vec2D.create([0, 0]);
    if (InputManager.isKeyHold("w")) axis = axis.sub([0, 1]);
    if (InputManager.isKeyHold("s")) axis = axis.add([0, 1]);
    if (InputManager.isKeyHold("a")) axis = axis.sub([1, 0]);
    if (InputManager.isKeyHold("d")) axis = axis.add([1, 0]);

    const length = axis.length();
    if (length > 0) {
      axis = axis.div(length);
      this.playerRigid.velocity.x = axis.x * this.playerRigid.speed;
      this.playerRigid.velocity.y = axis.y * this.playerRigid.speed;
    } else {
      this.playerRigid.velocity.x = 0;
      this.playerRigid.velocity.y = 0;
    }
  }
}
