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
  declare private playerTransform: SystemComponent<"Transform">;
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
    const transform = this.getComponentWithMarker("Player", "Transform");
    assert(
      rigid !== undefined,
      "There is no player rigid in game, should be impossible",
    );
    assert(
      transform !== undefined,
      "There is no player transform in game, should be impossible",
    );
    this.playerRigid = rigid;
    this.playerTransform = transform;
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
    const mouseDir = InputManager.getMouseDirFromCenter();
    if (mouseDir.x !== 0 && mouseDir.y !== 0)
      this.playerTransform.faceDir.set(mouseDir.x, mouseDir.y);
  }
}
