import AABB from "@/core/axiom/AABB";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import InputManager from "@/core/engine/inputManager";
type HoverReturn = { index: number; layer: number; ID: Symbol | undefined };
export type UINodeHoverData = {
  lastFrame: Symbol | undefined;
  currentFrame: Symbol | undefined;
  currentRoot: Symbol | undefined;
};
export default class UIInputs extends DogmaSystem {
  private currentlyHovered: Symbol | undefined = undefined;
  private lastHovered: Symbol | undefined = undefined;
  constructor(internal: InternalDSProps) {
    super(internal);
  }
  public onStart(): void {
    this.subscribeToPhase({
      callback: this.updateHover.bind(this),
      phase: "preUpdate",
    });
  }

  private updateHover() {
    const mousePos = InputManager.getMousePos();
    const roots = this.getComponentsWithTags("UINode", ["nodeRoot"]);
    const rootsArray = Array.from(roots);
    const returnTarget = this.recursiveFindHover(rootsArray, mousePos, {
      layer: -1,
      index: -1,
      ID: undefined,
    });
    this.lastHovered = this.currentlyHovered;
    this.currentlyHovered = returnTarget.ID;
    const root = this.getRoot(this.currentlyHovered);
    this.setSharedData<UINodeHoverData>("scene", "UINodeHovered", {
      currentFrame: this.currentlyHovered,
      lastFrame: this.lastHovered,
      currentRoot: root,
    });
  }
  private getRoot(ID: Symbol | undefined): Symbol | undefined {
    if (!ID) return ID;
    const node = this.getComponent(ID, "UINode");
    if (!node || !node.parent) return ID;
    return this.getRoot(node.parent);
  }
  private recursiveFindHover(
    list: Symbol[],
    mousePos: Position2D,
    returnTarget: HoverReturn,
  ): HoverReturn {
    for (const [index, ID] of list.entries()) {
      const node = this.getComponent(ID, "UINode")!;
      if (!node.active) continue;
      const box = this.createNodeBox(node);
      if (!AABB.containsPoint(box, mousePos)) continue;
      const shouldOverride =
        returnTarget.layer <= node.layer ||
        (returnTarget.layer === node.layer && returnTarget.index >= index);

      if (shouldOverride) {
        returnTarget.layer = node.layer;
        returnTarget.index = index;
        returnTarget.ID = node.ID;
      }
      if (node.children.length === 0) return returnTarget;
      return this.recursiveFindHover(node.children, mousePos, returnTarget);
    }
    return returnTarget;
  }
  private createNodeBox(node: SystemComponent<"UINode">): Box {
    return {
      x: node.transform.x,
      y: node.transform.y,
      w: node.transform.width,
      h: node.transform.height,
    };
  }
}
