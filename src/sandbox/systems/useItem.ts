import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import { ItemHoldEvent, ItemUseKey } from "./gameInput";
import { ITEM_POOL } from "../db/items";

export default class UseItem extends DogmaSystem {
  constructor(internal: InternalDSProps) {
    super(internal);
    this.subscribeToPhase({
      callback: this.useItem.bind(this),
      phase: "update",
      after: ["GameInputs"],
    });
  }
  private useItem() {
    const events = this.events.getCascade<ItemHoldEvent[]>("itemHoldEvent");
    if (!events || events.length === 0) return;
    events.forEach((event) => {
      if (event.state !== "completed") return;
      const eq = this.getComponentWithMarker("Player", "Equipment")!;
      const itemSlot = eq.items[ItemUseKey[event.key]];
      if (!itemSlot.item || itemSlot.amount === 0) return;
      const item = ITEM_POOL[itemSlot.item];
      console.log("uzywam");
      item.apply(this);
      itemSlot.amount--;
      if (itemSlot.amount <= 0) {
        itemSlot.amount = 0;
        itemSlot.item = undefined;
      }
    });
  }
}
