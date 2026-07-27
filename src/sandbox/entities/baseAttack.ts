import DogmaEntity from "@/core/dogma/entity";

import { RENDER_LAYER } from "../scenes/battleScene";
import { AttackEntry, AttackShapeList } from "./attacks";
import {
  AttackBehavior,
  AttackMeta,
  SpawnMode,
} from "../managers/attackManager";

interface AttackProps {
  abilityID: Symbol;
  casterID: Symbol;
  attackMeta: AttackMeta;
  spawn: Omit<SpawnMode, "spawned">;
  transform: {
    position: Position2D;
    velocity: Position2D;
  };
  attackBehavior: AttackBehavior;
}

export default class BaseAttack extends DogmaEntity {
  constructor(props: AttackProps) {
    super();
    this.addTag("attack");
    this.addTag(props.attackMeta.attackName);
    const displayData: AttackEntry =
      AttackShapeList[props.attackMeta.attackName];
    this.addComponent("Transform", {
      position: props.transform.position,
      size: displayData.size,
    });
    this.addComponent("Relation", {
      parentChar: props.casterID,
      parentAbility: props.abilityID,
    });
    this.addComponent("Attack", {
      baseDamage: props.attackMeta.baseDmg,
      damageType: props.attackMeta.damageType,
      hitType: props.attackMeta.hitType,
    });
    this.addComponent("Sprite", {
      spriteName: displayData.texture,
      crop: displayData.crop,
      renderMode:
        props.attackBehavior.name === "orbit" ? "lerpAngle" : "lerpPos",
      layer: RENDER_LAYER[displayData.layer],
      tint: displayData.tint,
    });
    this.addComponent("Collider", {
      shape: displayData.collider.shape,
      sizeOffset: displayData.collider.sizeOffset,
      posOffset: displayData.collider.posOffset,
    });
    const attackBehavior = props.attackBehavior;
    switch (attackBehavior.name) {
      case "projectile": {
        const velocity = props.transform.velocity;
        this.addComponent("Rigid", {
          speed: attackBehavior.movementSpeed,
          friction: 1,
          velocity: {
            x: velocity.x * attackBehavior.movementSpeed,
            y: velocity.y * attackBehavior.movementSpeed,
          },
        });
        break;
      }
      case "stick": {
        this.addComponent("Stick", {
          distance: attackBehavior.distance,
          targetID: props.casterID,
          angle: attackBehavior.angle,
          anchor: displayData.layer === "groundAttacks" ? "feet" : "center",
        });
        break;
      }
      case "orbit": {
        this.addComponent("Orbit", {
          orbitSpeed: attackBehavior.orbitSpeed,
          radius: attackBehavior.radius,
          targetID: props.casterID,
          startAngle: attackBehavior.startAngle,
        });
        break;
      }
      default:
        break;
    }
    const lifespan = props.attackMeta.lifeSpan;
    if (lifespan > 0) this.addComponent("LifeSpan", { span: lifespan });
  }
}
