import MobCrops from "../assets/monsters.json";

import DogmaEntity from "@/core/dogma/entity";
import {
  ATT,
  AttackDisplayKey,
  AttackRange,
  DamageImpactType,
  DmgType,
  HitTrackingKeys,
  ImpactBehavior,
} from "../managers/attackManager";
import {
  AttackBehavior,
  DirectionStrategy,
  SpawnMode,
} from "../components/ability";
import { RENDER_LAYER } from "../scenes/battleScene";
interface AttackProps {
  attackName: AttackDisplayKey;
  abilityID: Symbol;
  casterID: Symbol;
  attackRange: AttackRange;
  attackMeta: {
    damageType: DmgType;
    impactType: DamageImpactType;
    onImpact: ImpactBehavior;
    lifeSpan: number;
    baseDmg: number;
    hitType: HitTrackingKeys;
  };
  spawn: Omit<SpawnMode, "spawned">;
  transform: {
    position: Position2D;
    velocity: Position2D;
    //tutaj wyglad
  };
  behavior: {
    attackBehavior: AttackBehavior;
    directionStrategy: DirectionStrategy;
  };
}
export default class BaseAttack extends DogmaEntity {
  constructor(props: AttackProps) {
    super();
    //base
    this.addTag("attack");
    this.addTag(props.attackName);
    const displayData = ATT[props.attackName];
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
        props.behavior.attackBehavior.name === "orbit"
          ? "lerpAngle"
          : "lerpPos",
      layer: RENDER_LAYER[displayData.layer],
      tint: displayData.tint,
    });
    this.addComponent("Collider", {
      shape: displayData.shape,
      sizeOffset: displayData.colliderOffsets?.size,
      posOffset: displayData.colliderOffsets?.pos,
    });
    //dependent
    const attackBehavior = props.behavior.attackBehavior;
    switch (attackBehavior.name) {
      case "rigid": {
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
      default: {
        break;
      }
    }
    const lifespan = props.attackMeta.lifeSpan;
    if (lifespan > 0) this.addComponent("LifeSpan", { span: lifespan });
  }
}
