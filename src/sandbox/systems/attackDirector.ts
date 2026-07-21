import DogmaSystem, { SystemComponent } from "@/core/dogma/system";
import AttackManager from "../managers/attackManager";
import EntityManager from "@/core/dogma/entityManager";
import { EnemyPerceptionData } from "./AIPerception";
import { assert } from "@/utils/utils";
import Time from "@/core/engine/time";

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
    const dt = Time.getDeltaTime();
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
      const relation = this.getComponent(ID, "Relation")!;
      if (ability.spawnMode.type === "persistent") {
        if (!ability.spawnMode.spawned) {
          this.generateAbilityAttack(ability, relation);
          ability.spawnMode.spawned = true;
        }
        return;
      }
      if (ability.cooldown > 0) {
        ability.cooldown -= dt;
        return;
      }
      if (!relation.parentChar || !combatList.has(relation.parentChar)) return;
      this.generateAbilityAttack(ability, relation);
      ability.cooldown = ability.abilityDelay;
    });
  }
  private generateAbilityAttack(
    ability: SystemComponent<"Ability">,
    relation: SystemComponent<"Relation">,
  ) {
    const casterTransform = this.getComponent(
      relation.parentChar!,
      "Transform",
    )!;
    const playerTransform = this.getComponentWithMarker("Player", "Transform")!;
    const attack = AttackManager.build(
      ability,
      relation,
      casterTransform,
      playerTransform,
    );
    relation.children.add(attack!.ID);
    EntityManager.spawnEntity(attack!, "battle");
  }
}
