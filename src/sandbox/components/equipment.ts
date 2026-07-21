import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
import { abilities } from "../configs";
import EntityManager from "@/core/dogma/entityManager";
interface Slot {
  attackName: keyof typeof abilities;
  cooldown: number;
  abilityID: Symbol;
}
interface EquipmentProps {
  slots: (keyof typeof abilities)[];
}
export default class Equipment extends DogmaComponent {
  public slots: Slot[];
  constructor(internalProps: InternalDCProps, props?: EquipmentProps) {
    super(internalProps);
    this.slots = props?.slots
      ? props.slots.map((slot) => {
          const attack = new abilities[slot](this.ID);
          EntityManager.spawnEntity(attack, "battle");
          return { attackName: slot, cooldown: 0, abilityID: attack.ID };
        })
      : [];
  }
}
