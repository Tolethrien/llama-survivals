import DogmaSystem, { SystemComponent } from "@/core/dogma/system";
import AttackManager from "../managers/attackManager";
import EntityManager from "@/core/dogma/entityManager";
import { EnemyPerceptionData } from "./AIPerception";
import { assert } from "@/utils/utils";
import Time from "@/core/engine/time";
import Rigid from "../components/rigid";

export default class AttackDirector extends DogmaSystem {
  declare private playerID: Symbol;
  public onStart() {
    this.subscribeToPhase({
      phase: "update",
      callback: this.spawn.bind(this),
    });
    this.playerID = this.getComponentWithMarker("Player", "Transform")!.ID;
  }

  private spawn() {
    const sdt = Time.getDeltaTime();
    const udt = Time.getUnscaledDeltaTime();
    const perceptionData =
      this.events.getCascade<EnemyPerceptionData[]>("EnemyPerception")?.[0];
    assert(
      perceptionData !== undefined,
      "AI swarm: there is no perception list for Ai to deal with",
    );
    const combatList = new Set(perceptionData.combat);
    combatList.add(this.playerID);
    const abilities = this.getComponentsGroup(["Ability", "Relation"]);
    abilities?.forEach((ID) => {
      const ability = this.getComponent(ID, "Ability")!;
      const dt = ability.tags.has("timeImmune") ? udt : sdt;
      const relation = this.getComponent(ID, "Relation")!;
      if (ability.burstRemaining > 0) {
        this.tickBurst(ability, relation, dt);
        return;
      }

      if (ability.spawnMode.type === "persistent") {
        if (!ability.spawnMode.spawned) {
          this.startBurst(ability, relation);
          ability.spawnMode.spawned = true;
        }
        return;
      }
      if (ability.cooldown > 0) {
        ability.cooldown -= dt;
        return;
      }
      if (!relation.parentChar || !combatList.has(relation.parentChar)) return;
      this.startBurst(ability, relation);
      ability.cooldown = this.getEffectiveCooldown(ability, relation);
    });
  }

  private startBurst(
    ability: SystemComponent<"Ability">,
    relation: SystemComponent<"Relation">,
  ) {
    if (ability.spawnMode.type === "spawnOnDelay") {
      const casterTransform = this.getComponent(
        relation.parentChar!,
        "Transform",
      )!;
      ability.burstFaceDir = {
        x: casterTransform.faceDir.x,
        y: casterTransform.faceDir.y,
      };
      ability.burstRemaining = ability.spawnMode.count;
      ability.burstIndex = 0;
      ability.burstTimer = 0;
      return;
    }
    ability.burstFaceDir = undefined;
    for (let i = 0; i < ability.spawnMode.count; i++) {
      this.generateAbilityAttack(ability, relation, i);
    }
  }

  private tickBurst(
    ability: SystemComponent<"Ability">,
    relation: SystemComponent<"Relation">,
    dt: number,
  ) {
    if (ability.spawnMode.type !== "spawnOnDelay") {
      ability.burstRemaining = 0;
      ability.burstFaceDir = undefined;
      return;
    }
    ability.burstTimer -= dt;
    if (ability.burstTimer > 0) return;
    this.generateAbilityAttack(ability, relation, ability.burstIndex);
    ability.burstIndex += 1;
    ability.burstRemaining -= 1;
    ability.burstTimer = ability.spawnMode.delay;
    if (ability.burstRemaining <= 0) ability.burstFaceDir = undefined;
  }

  private getEffectiveCooldown(
    ability: SystemComponent<"Ability">,
    relation: SystemComponent<"Relation">,
  ): number {
    const casterStats = this.getComponent(
      relation.parentChar!,
      "CharacterStats",
    );
    const swingSpeedInc = casterStats?.swingSpeedInc ?? 0;
    return ability.abilityDelay / (1 + swingSpeedInc);
  }
  private generateAbilityAttack(
    ability: SystemComponent<"Ability">,
    relation: SystemComponent<"Relation">,
    spreadIndex: number,
  ) {
    const casterTransform = this.getComponent(
      relation.parentChar!,
      "Transform",
    )!;
    const casterCollider = this.getComponent(relation.parentChar!, "Collider")!;
    const playerTransform = this.getComponentWithMarker("Player", "Transform")!;
    const playerCollider = this.getComponentWithMarker("Player", "Collider")!;

    const aimTransform = ability.burstFaceDir
      ? ({
          ...casterTransform,
          faceDir: ability.burstFaceDir,
          tags: casterTransform.tags,
        } as SystemComponent<"Transform">)
      : casterTransform;

    const attack = AttackManager.build(
      ability,
      relation,
      aimTransform,
      casterCollider,
      playerTransform,
      playerCollider,
      spreadIndex,
    );
    const rigid = attack.getComponent("Rigid") as Rigid | undefined;
    if (rigid) {
      const casterRigid = this.getComponent(relation.parentChar!, "Rigid");
      if (casterRigid) rigid.velocity.add(casterRigid.velocity);
    }
    relation.children.add(attack!.ID);
    EntityManager.spawnEntity(attack!, "battle");
  }
}
