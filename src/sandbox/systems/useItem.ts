import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import { ItemHoldEvent, ItemUseKey } from "./gameInput";
import { ITEM_POOL } from "../db/items";
import Draw from "@/core/aurora/draw";
import Aurora from "@/core/aurora/core";
import AxiomMath from "@/core/axiom/math";
import { ItemSlot } from "../components/equipment";

export default class UseItem extends DogmaSystem {
  private timers = [0, 0, 0, 0];
  constructor(internal: InternalDSProps) {
    super(internal);
    this.subscribeToPhase({
      callback: this.useItem.bind(this),
      phase: "update",
      after: ["GameInputs"],
    });
    this.subscribeToPhase({
      callback: this.renderItemSlots.bind(this),
      phase: "render",
    });
  }
  private useItem() {
    const events = this.events.getCascade<ItemHoldEvent[]>("itemHoldEvent");
    if (!events || events.length === 0) return;
    events.forEach((event) => {
      if (event.state === "holding") {
        this.timers[ItemUseKey[event.key]] = event.progress;
        return;
      } else if (event.state === "broken") {
        this.timers[ItemUseKey[event.key]] = 0;
        return;
      }
      const eq = this.getComponentWithMarker("Player", "Equipment")!;
      const itemSlot = eq.items[ItemUseKey[event.key]];
      if (!itemSlot.item || itemSlot.amount === 0) return;
      const item = ITEM_POOL[itemSlot.item];
      this.timers[ItemUseKey[event.key]] = 0;
      item.apply(this);
      itemSlot.amount--;
      if (itemSlot.amount <= 0) {
        itemSlot.amount = 0;
        itemSlot.item = undefined;
      }
    });
  }
  private drawEmptySlot(pos: Position2D, size: number, text: string) {
    Draw.guiRect({
      position: pos,
      size: { width: size, height: size },
      tint: [255, 0, 0, 155],
    });
    Draw.guiText({
      position: { x: pos.x + 15, y: pos.y + 5, mode: "pixel" },
      fontColor: [255, 255, 255, 255],
      font: "lato",
      fontSize: { mode: "pixel", size: 20 },
      text: text,
    });
  }
  private drawItemSlot(
    pos: Position2D,
    size: number,
    text: string,
    item: ItemSlot,
  ) {
    Draw.guiRect({
      position: pos,
      size: { width: size, height: size },
      tint: [255, 100, 100, 200],
      background: "icons",
      crop: ITEM_POOL[item.item!].crop,
    });
    const h = this.timers[ItemUseKey[text as keyof typeof ItemUseKey]];
    const mappedH = AxiomMath.map(h, 0, 1, 0, size);
    Draw.guiRect({
      position: { x: pos.x, y: pos.y + size - mappedH },
      size: { width: size, height: mappedH },
      tint: [255, 0, 0, 100],
    });
    Draw.guiText({
      position: { x: pos.x + 15, y: pos.y + 5, mode: "pixel" },
      fontColor: [255, 255, 255, 255],
      font: "lato",
      fontSize: { mode: "pixel", size: 20 },
      text: text,
    });
    Draw.guiText({
      position: { x: pos.x + 30, y: pos.y + 25, mode: "pixel" },
      fontColor: [255, 255, 255, 255],
      font: "lato",
      fontSize: { mode: "pixel", size: 10 },
      text: String(item.amount),
    });
  }
  private renderItemSlots() {
    const x = Aurora.canvas.width - 90;
    const y = Aurora.canvas.height - 350;
    const size = 40;
    const gap = 50;
    const eq = this.getComponentWithMarker("Player", "Equipment")!;
    const items = eq.items;

    for (let index = 0; index < items.length; index++) {
      const slot = items[index];
      if (slot.item !== undefined)
        this.drawItemSlot(
          { x: x, y: y + index * gap },
          size,
          ItemUseKey[index],
          slot,
        );
      else
        this.drawEmptySlot(
          { x: x, y: y + index * gap },
          size,
          ItemUseKey[index],
        );
    }
  }
}
