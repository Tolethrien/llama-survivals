import EntityManager from "@/core/dogma/entityManager";
import UIElement from "../entities/UIElement";
import { deepMerge } from "@/utils/utils";

interface BgImage {
  type: "image";
  sprite: string;
  crop: Crop;
  tint: RGBA;
}
interface BgColor {
  type: "color";
  tint: RGBA;
}
export interface NodeDescriptor {
  active: boolean;
  visible: boolean;
  interactive: boolean;
  transform: Position2D & Size2D;
  visual: BgImage | BgColor;
  parent: Symbol | undefined;
  children: Symbol[];
  layer: number;
}
interface GuiDescriptor {
  active: boolean;
  visible: boolean;
  interactive: boolean;
  transform: Position2D & Size2D;
  visual: BgImage | BgColor;
  children?: GuiDescriptor[];
  tags?: string[];
}
export default class GuiManager {
  public static build(
    tree: GuiDescriptor,
    parentID?: Symbol,
    depth: number = 0,
  ) {
    const childrenRef: Symbol[] = [];
    const data: NodeDescriptor = {
      ...tree,
      parent: parentID,
      children: childrenRef,
      layer: depth,
    };
    const node = new UIElement(data);
    if (!parentID) node.addTag("nodeRoot");
    if (tree.tags) tree.tags.forEach((tag) => node.addTag(tag));
    EntityManager.spawnEntity(node, "battle");
    tree.children?.forEach((childDescriptor) => {
      const childID = this.build(childDescriptor, node.ID, depth + 1);
      childrenRef.push(childID);
    });

    return node.ID;
  }
}
