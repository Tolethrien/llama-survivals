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
      size: { height: 64, width: 32 },
    });
    this.addTag("enemy");
    this.addComponent("Rigid", { speed: 350 });
    this.addComponent("Fraction", { team: "enemy" });
    this.addComponent("CharacterStats", {
      maxHP: 100,
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
    this.addComponent("Collider", { shape: "rect" });

    this.addComponent("Sprite", {
      spriteName: "mobs",
      crop: MobCrops.ork,
      renderMode: "lerpPos",
      layer: RENDER_LAYER.main,
    });
  }
}
