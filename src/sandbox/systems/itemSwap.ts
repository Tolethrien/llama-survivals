import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import Draw from "@/core/aurora/draw";
import InputManager from "@/core/engine/inputManager";
import Time from "@/core/engine/time";
import GuiManager from "../managers/guiManager";
import { UINodeHoverData } from "./uiInputs";
import { ITEM_POOL, ItemDefinition } from "../db/items";
import type { ItemSwapRequestEvent } from "./chestGather";

export type ChestResetEvent = { chestID: Symbol };

const SLOT_TAGS = ["slotA", "slotB", "slotC", "slotD"] as const;

export default class ItemSwap extends DogmaSystem {
  declare private rootID: Symbol;
  declare private playerID: Symbol;
  private pendingChestID: Symbol | undefined;
  private pendingItem: keyof typeof ITEM_POOL | undefined;

  public onStart() {
    this.buildGUITree();
    this.playerID = this.getComponentWithMarker("Player", "Transform")!.ID;
    this.subscribeToPhase({
      callback: this.update.bind(this),
      phase: "update",
    });
    this.subscribeToPhase({
      callback: this.render.bind(this),
      phase: "render",
    });
  }

  private update() {
    this.checkForRequest();
    const data = this.getSharedData<UINodeHoverData>("scene", "UINodeHovered")!;
    this.updateInput(data);
  }

  private checkForRequest() {
    const events =
      this.events.getCascade<ItemSwapRequestEvent[]>("itemSwapRequest");
    if (!events || events.length === 0 || this.pendingChestID !== undefined)
      return;
    const request = events[events.length - 1];
    console.log(
      `[itemSwap] menu open, item: ${request.item}, chest: ${String(request.chestID)}`,
    );
    this.openMenu(request.chestID, request.item);
  }

  private openMenu(chestID: Symbol, item: keyof typeof ITEM_POOL) {
    this.pendingChestID = chestID;
    this.pendingItem = item;
    Time.setPaused(true);

    this.getComponent(this.rootID, "UINode")!.active = true;

    const [titleID] = this.getComponentsWithTags("UINode", ["swapTitle"]);
    const titleNode = this.getComponent(titleID, "UINode");
    if (titleNode) titleNode.value = this.getItemDef(item).label;

    const [cancelID] = this.getComponentsWithTags("UINode", ["cancel"]);
    const cancelNode = this.getComponent(cancelID, "UINode");
    if (cancelNode) cancelNode.value = "Cancel";

    const slotLabels = ["Z", "X", "C", "V"] as const;
    const equipment = this.getComponent(this.playerID, "Equipment")!;
    SLOT_TAGS.forEach((tag, i) => {
      const [nodeID] = this.getComponentsWithTags("UINode", [tag as string]);
      const node = this.getComponent(nodeID, "UINode");
      if (!node) return;
      const slot = equipment.items[i];
      node.value = slot.item
        ? `[${slotLabels[i]}] ${this.getItemDef(slot.item).label} x${slot.amount}`
        : `[${slotLabels[i]}] Empty`;
    });
  }

  private updateInput(data: UINodeHoverData) {
    if (!data.currentRoot || !data.currentFrame) return;
    const root = this.getComponent(data.currentRoot, "UINode");
    if (!root || root.ID !== this.rootID) return;
    const node = this.getComponent(data.currentFrame, "UINode")!;
    if (!node.interactive || !InputManager.isMouseClicked("LEFT")) return;

    if (node.tags.has("cancel")) {
      console.log("[itemSwap] cancel clicked");
      this.closeMenu(false);
      return;
    }

    const slotIndex = SLOT_TAGS.findIndex((tag) => node.tags.has(tag));
    if (slotIndex === -1) return;

    console.log(
      `[itemSwap] slot ${slotIndex} clicked, assigning: ${this.pendingItem}`,
    );
    const equipment = this.getComponent(this.playerID, "Equipment")!;
    equipment.items[slotIndex] = { item: this.pendingItem!, amount: 1 };
    this.closeMenu(true);
  }

  private closeMenu(resetChest: boolean) {
    console.log(
      `[itemSwap] menu closed, resetChest: ${resetChest}, chest: ${String(this.pendingChestID)}`,
    );
    if (resetChest && this.pendingChestID !== undefined) {
      this.events.emitDeferred<ChestResetEvent>("chestReset", {
        chestID: this.pendingChestID,
      });
    }
    this.pendingChestID = undefined;
    this.pendingItem = undefined;
    Time.setPaused(false);
    this.getComponent(this.rootID, "UINode")!.active = false;
  }

  private render() {
    const node = this.getComponent(this.rootID, "UINode");
    if (!node || !node.active) return;
    this.DrawNode(node.ID);
  }

  private DrawNode(ID: Symbol | undefined) {
    if (!ID) return;
    const node = this.getComponent(ID, "UINode");
    if (!node || !node.visible) return;

    Draw.guiRect({
      position: { x: node.transform.x, y: node.transform.y },
      size: { width: node.transform.width, height: node.transform.height },
      background: node.visual.type === "image" ? node.visual.sprite : undefined,
      crop: node.visual.type === "image" ? node.visual.crop : undefined,
      tint: node.visual.tint,
    });

    if (node.value) {
      Draw.guiText({
        position: {
          x: node.transform.x + 10,
          y: node.transform.y + 10,
          mode: "pixel",
        },
        font: "lato",
        fontColor: [255, 255, 255, 255],
        fontSize: { mode: "pixel", size: 16 },
        text: node.value,
      });
    }

    node.children?.forEach((childID) => this.DrawNode(childID));
  }

  private buildGUITree() {
    const PADDING = 24;
    const width = 460;
    const rowHeight = 50;
    const rowGap = 10;
    const titleHeight = 32;
    const cancelHeight = 34;
    const sectionGap = 16;
    const rootX = 300;
    const rootY = 120;

    const contentWidth = width - PADDING * 2;
    const titleY = rootY + PADDING;
    const slotsStartY = titleY + titleHeight + sectionGap;
    const cancelY =
      slotsStartY +
      SLOT_TAGS.length * rowHeight +
      (SLOT_TAGS.length - 1) * rowGap +
      sectionGap;
    const height = cancelY + cancelHeight + PADDING - rootY;

    const slotChildren = SLOT_TAGS.map((tag, i) => ({
      active: true,
      visible: true,
      visual: { type: "color" as const, tint: [70, 70, 90, 255] as RGBA },
      transform: {
        x: rootX + PADDING,
        y: slotsStartY + i * (rowHeight + rowGap),
        width: contentWidth,
        height: rowHeight,
      },
      interactive: true,
      tags: [tag],
    }));

    this.rootID = GuiManager.build({
      active: false,
      visible: true,
      transform: { x: rootX, y: rootY, width, height },
      visual: { type: "color", tint: [30, 30, 35, 235] },
      interactive: false,
      children: [
        {
          active: true,
          visible: true,
          visual: { type: "color", tint: [0, 0, 0, 0] },
          transform: {
            x: rootX + PADDING,
            y: titleY,
            width: contentWidth,
            height: titleHeight,
          },
          interactive: false,
          tags: ["swapTitle"],
        },
        ...slotChildren,
        {
          active: true,
          visible: true,
          visual: { type: "color", tint: [140, 50, 50, 255] },
          transform: {
            x: rootX + PADDING,
            y: cancelY,
            width: contentWidth,
            height: cancelHeight,
          },
          interactive: true,
          tags: ["cancel"],
        },
      ],
    });
  }
  private getItemDef(key: keyof typeof ITEM_POOL): ItemDefinition {
    return ITEM_POOL[key];
  }
}
