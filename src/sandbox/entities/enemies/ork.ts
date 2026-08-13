import DogmaEntity from "@/core/dogma/entity";
import MobCrops from "../../assets/monsters.json";
import { RENDER_LAYER } from "@/sandbox/scenes/battleScene";
interface EnemyProps {
  position: Position2D;
}
export default class Ork extends DogmaEntity {
  constructor(props: EnemyProps) {
    super();
    this.addComponent("Transform", {
      position: props.position,
      size: { height: 128 * 0.8, width: 64 * 0.8 },
    });
    this.addTag("enemy");
    this.addComponent("Rigid", { speed: 300 });
    this.addComponent("Fraction", { team: "enemy" });
    this.addComponent("CharacterStats", {
      maxHP: 25,
      minHP: 0,
      damageIncrease: 0,
      DamageTypeIncrease: {
        cold: 0,
        energy: 0,
        fire: 0,
        heal: 0,
        physical: 0,
        poison: 0,
      },
      maxResist: {
        cold: 0,
        energy: 0,
        fire: 0,
        heal: 0,
        physical: 0,
        poison: 0,
      },
      resist: { cold: 0, energy: 0, fire: 0, heal: 0, physical: 0, poison: 0 },
      swingSpeedInc: 0,
    });
    this.addComponent("EnemyAI", {
      pushForce: 0.5,
      personalSpace: 1.2,
      attackRange: 80,
      flankRange: 0,
      attackRangeType: "melee",
    });
    this.addComponent("Equipment", {
      slots: ["Slash"],
    });
    this.addComponent("Collider", {
      shape: "rect",
      sizeOffset: { width: -15, height: -30 },
      posOffset: { x: 0, y: 15 },
    });

    this.addComponent("Sprite", {
      spriteName: "mobs",
      crop: MobCrops.ork,
      renderMode: "lerpPos",
      layer: RENDER_LAYER.main,
    });
  }
}
