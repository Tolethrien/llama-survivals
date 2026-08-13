import DogmaSystem, { SystemComponent } from "@/core/dogma/system";
import InputManager from "@/core/engine/inputManager";
import { ITEM_POOL, ItemDefinition } from "../db/items";
import AxiomMath from "@/core/axiom/math";
import Time from "@/core/engine/time";
import AuroraCamera from "@/core/aurora/camera";
import Draw from "@/core/aurora/draw";
import { assert } from "@/utils/utils";
import { ChestResetEvent } from "./itemSwap";

const ROLL_DURATION = 1.5;
const DECAY_DURATION = 20;
const HOLD_DURATION = 1;
const ITEM_KEYS = Object.keys(ITEM_POOL) as (keyof typeof ITEM_POOL)[];
const BUTTON_SIZE = 20;
const BUTTON_GAP = 10;
const ICON_SIZE = 44;
const ROW_GAP = 10; // odstęp między dołem ikonki a górą guzików
const BUTTONS_Y_OFFSET = 20; // jak wysoko nad kufrem są guziki
export type ItemSwapRequestEvent = {
  chestID: Symbol;
  item: keyof typeof ITEM_POOL;
};
export default class ChestGather extends DogmaSystem {
  declare private playerTransform: SystemComponent<"Transform">;
  private rerollTriggered = false;
  public onStart(): void {
    InputManager.bindAction({
      name: "chestReroll",
      key: "r",
      mods: "NoMod",
      holdDuration: HOLD_DURATION,
    });
    InputManager.bindAction({ name: "chestPickup", key: "e", mods: "NoMod" });
    this.subscribeToPhase({
      callback: this.updateChests.bind(this),
      phase: "update",
    });
    this.subscribeToPhase({
      callback: this.renderChests.bind(this),
      phase: "render",
    });
    this.events.subscribeToDeferred<ChestResetEvent>({
      eventName: "chestReset",
      sysRef: this,
      callback: (data) => {
        const chest = this.getComponent(data.chestID, "ChestRoll");
        if (chest) chest.state = { phase: "idle" };
      },
    });

    const transform = this.getComponentWithMarker("Player", "Transform");
    assert(
      transform !== undefined,
      "There is no transform for player to track chests",
    );
    this.playerTransform = transform;
  }

  private updateChests() {
    this.tickAllChests();

    const chestIDs = this.getComponentsWithTags("Transform", ["chest"]);
    for (const ID of chestIDs) {
      const transform = this.getComponent(ID, "Transform")!;
      const dist = transform.position.distanceTo(this.playerTransform.position);
      if (dist > 100) continue;
      const chest = this.getComponent(ID, "ChestRoll")!;

      const canRoll =
        chest.state.phase === "idle" || chest.state.phase === "settled";
      const canPickup = chest.state.phase === "settled";
      const progress = InputManager.getActionHoldProgress("chestReroll");

      this.displayButtons(
        transform,
        canRoll && !this.rerollTriggered ? (progress ?? 0) : 0,
        canPickup,
      );

      if (progress === undefined) {
        this.rerollTriggered = false;
      } else if (progress >= 1 && !this.rerollTriggered) {
        this.rerollTriggered = true;
        if (canRoll) this.startRoll(chest);
      }

      if (canPickup && InputManager.onActionPressed("chestPickup")) {
        this.pickupItem(chest);
      }
      break;
    }
  }
  private tickAllChests() {
    const chests = this.getComponentList("ChestRoll");
    if (!chests) return;
    const dt = Time.getUnscaledDeltaTime();

    chests.forEach((chest) => {
      if (chest.state.phase === "rolling") {
        chest.state.elapsed += dt;
        if (chest.state.elapsed >= chest.state.duration) {
          const item = chest.state.winningItem;
          chest.state = {
            phase: "settled",
            item,
            decayElapsed: 0,
            decayDuration: DECAY_DURATION,
          };
          console.log(`[chest] selected: ${item}`);
          console.log(`[chest] decaying: ${item}`);
          return;
        }
        if (chest.state.elapsed >= chest.state.nextSwitchAt) {
          const t = chest.state.elapsed / chest.state.duration;
          const interval = AxiomMath.map(t, 0, 1, 0.05, 0.4);
          chest.state.currentDisplay = this.randomItemKey();
          chest.state.nextSwitchAt = chest.state.elapsed + interval;
          console.log(`[chest] picking: ${chest.state.currentDisplay}`);
        }
      } else if (chest.state.phase === "settled") {
        chest.state.decayElapsed += dt;
        if (chest.state.decayElapsed >= chest.state.decayDuration) {
          console.log(`[chest] gone: ${chest.state.item}`);
          chest.state = { phase: "idle" };
        }
      }
    });
  }
  private startRoll(chest: SystemComponent<"ChestRoll">) {
    const winningItem = this.randomItemKey();
    chest.state = {
      phase: "rolling",
      winningItem,
      elapsed: 0,
      duration: ROLL_DURATION,
      currentDisplay: winningItem,
      nextSwitchAt: 0,
    };
  }

  private randomItemKey(): keyof typeof ITEM_POOL {
    const pool = this.getEligibleItemKeys();
    return pool[AxiomMath.randomInt(0, pool.length - 1)];
  }
  private pickupItem(chest: SystemComponent<"ChestRoll">) {
    if (chest.state.phase !== "settled") return;
    const item = chest.state.item;
    const def = this.getItemDef(item);
    const equipment = this.getComponentWithMarker("Player", "Equipment")!;

    const existingSlot = equipment.items.find((slot) => slot.item === item);
    if (existingSlot) {
      if (def.cap !== undefined && existingSlot.amount >= def.cap) {
        console.log(
          `[chest] max reached: ${item} (${existingSlot.amount}/${def.cap})`,
        );
        return;
      }
      existingSlot.amount++;
      console.log(
        `[chest] picked up (stacked): ${item} x${existingSlot.amount}`,
      );
      chest.state = { phase: "idle" };
      return;
    }

    const freeSlot = equipment.items.find((slot) => slot.item === undefined);
    if (freeSlot) {
      freeSlot.item = item;
      freeSlot.amount = 1;
      console.log(`[chest] picked up (new slot): ${item}`);
      chest.state = { phase: "idle" };
      return;
    }

    console.log(`[chest] backpack full, open menu for item: ${item}`);
    this.events.emitCascade<ItemSwapRequestEvent>("itemSwapRequest", {
      chestID: chest.ID,
      item,
    });
  }
  private getEligibleItemKeys(): (keyof typeof ITEM_POOL)[] {
    const equipment = this.getComponentWithMarker("Player", "Equipment")!;
    const eligible = ITEM_KEYS.filter((key) => {
      const def = this.getItemDef(key);
      if (def.cap === undefined) return true;
      const slot = equipment.items.find((s) => s.item === key);
      return (slot?.amount ?? 0) < def.cap;
    });
    return eligible.length > 0 ? eligible : ITEM_KEYS;
  }
  private getItemDef(key: keyof typeof ITEM_POOL): ItemDefinition {
    return ITEM_POOL[key];
  }

  private displayButtons(
    transform: SystemComponent<"Transform">,
    rollProgress: number,
    canPickup: boolean,
  ) {
    const anchor = AuroraCamera.worldToScreen({
      x: transform.position.x + transform.size.width * 0.5,
      y: transform.position.y,
    });
    const buttonsY = anchor.y - BUTTONS_Y_OFFSET;

    const totalWidth = canPickup ? BUTTON_SIZE * 2 + BUTTON_GAP : BUTTON_SIZE;
    const startX = anchor.x - totalWidth / 2;

    this.drawActionButton(
      { x: startX, y: buttonsY },
      BUTTON_SIZE,
      "R",
      rollProgress,
    );
    if (canPickup) {
      this.drawActionButton(
        { x: startX + BUTTON_SIZE + BUTTON_GAP, y: buttonsY },
        BUTTON_SIZE,
        "E",
        0,
      );
    }
  }
  private renderChests() {
    const chests = this.getComponentList("ChestRoll");
    if (!chests) return;

    chests.forEach((chest) => {
      if (chest.state.phase === "idle") return;
      const transform = this.getComponent(chest.ID, "Transform")!;
      this.renderChestItem(transform, chest);
    });
  }
  private renderChestItem(
    transform: SystemComponent<"Transform">,
    chest: SystemComponent<"ChestRoll">,
  ) {
    if (chest.state.phase === "idle") return;

    const itemKey =
      chest.state.phase === "rolling"
        ? chest.state.currentDisplay
        : chest.state.item;

    const alpha =
      chest.state.phase === "settled"
        ? 1 -
          AxiomMath.map(
            chest.state.decayElapsed,
            0,
            chest.state.decayDuration,
            0,
            1,
            true,
          )
        : 1;

    const anchor = AuroraCamera.worldToScreen({
      x: transform.position.x + transform.size.width * 0.5,
      y: transform.position.y,
    });
    const buttonsY = anchor.y - BUTTONS_Y_OFFSET;
    const iconY = buttonsY - ROW_GAP - ICON_SIZE;
    const iconX = anchor.x - ICON_SIZE / 2;

    Draw.guiRect({
      position: { x: iconX, y: iconY },
      size: { width: ICON_SIZE, height: ICON_SIZE },
      background: "icons",
      crop: ITEM_POOL[itemKey].crop,
      tint: [255, 255, 255, alpha * 255],
    });
  }
  private drawActionButton(
    pos: Position2D,
    size: number,
    label: string,
    progress: number,
  ) {
    Draw.guiRect({ position: pos, size: { width: size, height: size } });

    if (progress > 0) {
      const fillHeight = AxiomMath.map(progress, 0, 1, 0, size);
      Draw.guiRect({
        position: { x: pos.x, y: pos.y + size - fillHeight },
        size: { width: size, height: fillHeight },
        tint: [255, 0, 0, 150],
      });
    }

    Draw.guiText({
      position: { x: pos.x + 5, y: pos.y, mode: "pixel" },
      font: "lato",
      fontSize: { mode: "pixel", size: 16 },
      text: label,
      fontColor: [0, 0, 0, 255],
    });
  }
}
