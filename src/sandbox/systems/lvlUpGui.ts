import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import Draw from "@/core/aurora/draw";
import InputManager from "@/core/engine/inputManager";
import { LvlUpEvent } from "./spawner";
import Time from "@/core/engine/time";
import { UINodeHoverData } from "./uiInputs";
import GuiManager from "../managers/guiManager";

export default class LvlUpGui extends DogmaSystem {
  private framePos: Position2D = { x: 300, y: 300 };
  private lvlSequence: Generator<void, void, unknown> | null = null;
  declare private rootID: Symbol;
  constructor(internal: InternalDSProps) {
    super(internal);
  }
  public onStart() {
    this.buildGUITree();
    this.subscribeToPhase({
      callback: this.render.bind(this),
      phase: "render",
    });
    this.subscribeToPhase({
      callback: this.update.bind(this),
      phase: "update",
    });
  }

  private update() {
    const data = this.getSharedData<UINodeHoverData>("scene", "UINodeHovered")!;
    this.updateEvents();
    // this.updateHover(data);
    this.updateInput(data);
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
    node.children?.forEach((ID) => this.DrawNode(ID));
  }
  private updateEvents() {
    const events = this.events.getCascade<LvlUpEvent[]>("lvlUpEvent");
    if (!events || events.length === 0) return;
    Time.setTimeSpeed(0);
    let accuLvl = 0;
    events.forEach((event) => (accuLvl += event.lvls));
    console.log(accuLvl);
    const node = this.getComponent(this.rootID, "UINode")!;
    node.active = true;
    this.lvlSequence = this.LvlIterator(accuLvl);
    this.lvlSequence.next();
  }
  private *LvlIterator(numOfLvls: number) {
    for (let index = 0; index < numOfLvls; index++) {
      //   this.updateData()
      console.log(Math.random());
      yield;
    }
  }
  private updateInput(data: UINodeHoverData) {
    if (!data.currentRoot || !data.currentFrame) return;
    const root = this.getComponent(data.currentRoot, "UINode");
    if (!root || root.ID !== this.rootID) return;
    const node = this.getComponent(data.currentFrame, "UINode")!;
    if (!node.interactive) return;
    if (!InputManager.isMouseClicked("LEFT")) return;
    if (node.tags.has("buttonA")) {
      console.log("A");
    } else if (node.tags.has("buttonB")) {
      console.log("B");
    } else if (node.tags.has("buttonC")) {
      console.log("C");
    }
    const iterator = this.lvlSequence!.next();
    if (iterator.done) {
      root.active = false;
      Time.setTimeSpeed(1);
      this.lvlSequence = null;
    }
  }
  private buildGUITree() {
    const rootID = GuiManager.build({
      active: false,
      visible: true,
      transform: {
        x: this.framePos.x,
        y: this.framePos.y,
        width: 600,
        height: 400,
      },
      visual: { type: "color", tint: [255, 0, 255, 255] },
      interactive: false,
      children: [
        {
          active: true,
          visible: true,
          visual: { type: "color", tint: [255, 100, 255, 255] },
          transform: {
            x: this.framePos.x + 50,
            y: this.framePos.y + 50,
            width: 100,
            height: 100,
          },
          interactive: true,
          tags: ["buttonA"],
        },
        {
          active: true,
          visible: true,
          visual: { type: "color", tint: [255, 100, 255, 255] },
          transform: {
            x: this.framePos.x + 50,
            y: this.framePos.y + 150 + 10,
            width: 100,
            height: 100,
          },
          interactive: true,
          tags: ["buttonB"],
        },
        {
          active: true,
          visible: true,
          visual: { type: "color", tint: [255, 100, 255, 255] },
          transform: {
            x: this.framePos.x + 50,
            y: this.framePos.y + 250 + 20,
            width: 100,
            height: 100,
          },
          interactive: true,
          tags: ["buttonC"],
        },
      ],
    });
    this.rootID = rootID;
  }
}
