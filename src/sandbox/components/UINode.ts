import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
import { NodeDescriptor } from "../managers/guiManager";
export default class UINode extends DogmaComponent {
  visual: NodeDescriptor["visual"];
  transform: NodeDescriptor["transform"];
  layer: NodeDescriptor["layer"];
  active: NodeDescriptor["active"];
  visible: NodeDescriptor["visible"];
  parent: NodeDescriptor["parent"];
  children: NodeDescriptor["children"];
  interactive: NodeDescriptor["interactive"];
  value: string;
  constructor(
    internal: InternalDCProps,
    props: Omit<NodeDescriptor, "layer | parent">,
  ) {
    super(internal);
    this.visible = props.visible;
    this.transform = { ...props.transform };
    this.visible = props.visible;
    this.layer = props.layer;
    this.active = props.active;
    this.visual = props.visual;
    this.parent = props.parent ?? undefined;
    this.children = props.children ?? [];
    this.interactive = props.interactive;
    this.value = "";
  }
}
