import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
import { abilities } from "../configs";
import EntityManager from "@/core/dogma/entityManager";
import { ITEM_POOL } from "../db/items";
interface AbilitySlot {
  attackName: keyof typeof abilities;
  abilityID: Symbol;
}
interface ItemSlot {
  item: keyof typeof ITEM_POOL | undefined;
  amount: number;
}
interface EquipmentProps {
  slots: (keyof typeof abilities)[];
  abilitiesCap?: number;
  items?: [ItemSlot, ItemSlot, ItemSlot, ItemSlot];
}
const EMPTY_ITEM = { item: undefined, amount: 0 };
export default class Equipment extends DogmaComponent {
  public slots: AbilitySlot[];
  public abilitiesCap: number;
  public items: ItemSlot[];
  public itemsCap = 4;
  constructor(internalProps: InternalDCProps, props?: EquipmentProps) {
    super(internalProps);
    this.abilitiesCap = props?.abilitiesCap ?? 1;
    this.slots = props?.slots
      ? props.slots.map((slot) => {
          const attack = new abilities[slot](this.ID);
          EntityManager.spawnEntity(attack, "battle");
          return { attackName: slot, abilityID: attack.ID };
        })
      : [];
    this.items = props?.items ?? Array(4).fill({ ...EMPTY_ITEM });
  }
}
