import DogmaEntity from "@/core/dogma/entity";
import MobCrops from "../../assets/monsters.json";
import { RENDER_LAYER } from "@/sandbox/scenes/battleScene";
interface EnemyProps {
  position: Position2D;
}
export default class Archer extends DogmaEntity {
  constructor(props: EnemyProps) {
    super();
    this.addComponent("Transform", {
      position: props.position,
      size: { height: MobCrops.player.height, width: MobCrops.player.width },
    });
    this.addTag("enemy");
    this.addComponent("Fraction", { team: "enemy" });
    this.addComponent("Rigid", { speed: 350 });
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
      resist: {
        cold: 0,
        energy: 0,
        fire: 0,
        heal: 0,
        physical: 0,
        poison: 0,
      },
      swingSpeedInc: 0,
    });
    this.addComponent("EnemyAI", {
      pushForce: 6,
      attackRange: 0,
      flankRange: 300,
      attackRangeType: "projectile",
      personalSpace: 1.2,
    });
    this.addComponent("Equipment", {
      slots: ["ArrowMachine"],
    });
    this.addComponent("Collider", {
      shape: "rect",
      sizeOffset: { width: -15, height: -10 },
      posOffset: { x: 0, y: 5 },
    });
    this.addComponent("Sprite", {
      spriteName: "mobs",
      crop: MobCrops.player,
      renderMode: "lerpPos",
      layer: RENDER_LAYER.chars,
    });
  }
}
