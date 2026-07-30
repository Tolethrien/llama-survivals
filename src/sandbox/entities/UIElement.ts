import { InternalDCProps } from "@/core/dogma/component";
import DogmaEntity from "@/core/dogma/entity";
import { NodeDescriptor } from "../managers/guiManager";

export default class UIElement extends DogmaEntity {
  constructor(props: NodeDescriptor) {
    super();
    this.addComponent("UINode", props);
  }
}
