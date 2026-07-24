import Vec2 from "@/core/axiom/vec2";
import Dogma from "@/core/dogma/dogma";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import InputManager from "@/core/engine/inputManager";
import { assert } from "@/utils/utils";

export default class GameInputs extends DogmaSystem {
  private axis = Vec2.Zero;
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
    this.axis.set(0, 0);
    if (InputManager.isKeyHold("w")) this.axis.sub(0, 1);
    if (InputManager.isKeyHold("s")) this.axis.add(0, 1);
    if (InputManager.isKeyHold("a")) this.axis.sub(1, 0);
    if (InputManager.isKeyHold("d")) this.axis.add(1, 0);
    const length = this.axis.length();
    if (length > 0) {
      this.axis.divideScalar(length).scale(this.playerRigid.speed);
      this.playerRigid.velocity.copy(this.axis);
    } else {
      this.playerRigid.velocity.set(0, 0);
    }
  }
}
