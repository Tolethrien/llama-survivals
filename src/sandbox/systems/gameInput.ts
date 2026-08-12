import Vec2 from "@/core/axiom/vec2";
import Dogma from "@/core/dogma/dogma";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import InputManager from "@/core/engine/inputManager";
import Time from "@/core/engine/time";
import { assert } from "@/utils/utils";
export type ItemHoldEvent = {
  key: keyof typeof ItemUseKey;
  progress: number; // 0..1
  state: "holding" | "completed" | "broken";
};
export enum ItemUseKey {
  z,
  x,
  c,
  v,
}

const ITEM_USE_KEYS = Object.keys(ItemUseKey).filter((k) =>
  Number.isNaN(Number(k)),
) as (keyof typeof ItemUseKey)[];
const ITEM_ACTIONS: Record<keyof typeof ItemUseKey, string> = {
  z: "useItemZ",
  x: "useItemX",
  c: "useItemC",
  v: "useItemV",
};
const HOLD_REQUIRED = 2;

export default class GameInputs extends DogmaSystem {
  private axis = Vec2.Zero;
  declare private playerRigid: SystemComponent<"Rigid">;
  declare private playerTransform: SystemComponent<"Transform">;
  private holdRequired = 2;
  private holdTimer = 2;
  private isHolding: keyof typeof ItemUseKey | undefined = undefined;
  private triggered = false;
  private lastProgress = 0;
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }
  public onStart(): void {
    this.subscribeToPhase({
      phase: "preUpdate",
      callback: this.update.bind(this),
      before: ["Physics"],
    });
    //TODO: zrob jakies centralne miejsce  dla akcji a nie po systemach
    ITEM_USE_KEYS.forEach((key) => {
      InputManager.bindAction({
        name: ITEM_ACTIONS[key],
        key,
        mods: "NoMod",
        holdDuration: HOLD_REQUIRED,
      });
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
  private update() {
    this.playerMovementInputs();
    this.useItemInputs();
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
  private useItemInputs() {
    if (this.isHolding === undefined) {
      const pressedKey = ITEM_USE_KEYS.find((k) =>
        InputManager.onActionPressed(ITEM_ACTIONS[k]),
      );
      if (!pressedKey) return;
      this.isHolding = pressedKey;
      this.triggered = false;
      this.lastProgress = 0;
    }

    const key = this.isHolding!;
    const progress = InputManager.getActionHoldProgress(ITEM_ACTIONS[key]);

    if (progress === undefined) {
      if (!this.triggered) {
        this.events.emitCascade<ItemHoldEvent>("itemHoldEvent", {
          key,
          progress: this.lastProgress,
          state: "broken",
        });
      }
      this.isHolding = undefined;
      this.triggered = false;
      this.lastProgress = 0;
      return;
    }

    this.lastProgress = progress;
    if (this.triggered) return;

    if (progress >= 1) {
      this.triggered = true;
      this.events.emitCascade<ItemHoldEvent>("itemHoldEvent", {
        key,
        progress: 1,
        state: "completed",
      });
      return;
    }

    this.events.emitCascade<ItemHoldEvent>("itemHoldEvent", {
      key,
      progress,
      state: "holding",
    });
  }
}
