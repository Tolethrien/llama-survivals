import EntityManager from "@/core/dogma/entityManager";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import { HitEvent } from "./collisions";

export default class DamageCalculator extends DogmaSystem {
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }
  public onStart(): void {
    this.subscribeToPhase({
      callback: this.calculateDmg.bind(this),
      phase: "update",
    });
  }
  private calculateDmg() {
    const toRemove = new Set<Symbol>();
    const hits = this.events.getCascade<HitEvent[]>("attackHit");
    hits?.forEach((hit) => {
      const attack = this.getComponent(hit.attackID, "Attack")!;
      const attackerStats = this.getComponent(
        hit.attackerID,
        "CharacterStats",
      )!;
      const targetStats = this.getComponent(hit.targetID, "CharacterStats")!;
      if (targetStats.tags.has("invincible")) {
        this.deleteAttack(attack.ID);
        return;
      }

      const finalDamage = this.calculateDamage(hit, attackerStats, targetStats);
      targetStats.currentHP -= finalDamage;
      if (attack.tracking.hitType !== "pierce") this.deleteAttack(attack.ID);
      if (targetStats.currentHP <= targetStats.minHP)
        toRemove.add(hit.targetID);
    });
    toRemove.forEach((ID) => this.deleteEntity(ID));
  }
  private deleteEntity(ID: Symbol) {
    //TODO: czy usuwajac encje chce serio usuwac jej ataki tez juz wystrzelone?
    const eq = this.getComponent(ID, "Equipment")!;
    for (const slot of eq.slots) {
      const relation = this.getComponent(slot.abilityID, "Relation")!;
      relation.children.forEach((child) =>
        EntityManager.removeEntity(child, "battle"),
      );
      EntityManager.removeEntity(slot.abilityID, "battle");
    }
    EntityManager.removeEntity(ID, "battle");
  }
  private deleteAttack(ID: Symbol) {
    const relation = this.getComponent(ID, "Relation")!;
    const ability = this.getComponent(relation.parentAbility!, "Ability")!;
    if (ability.spawnMode.type === "persistent") return;
    const parentRelation = this.getComponent(
      relation.parentAbility!,
      "Relation",
    )!;
    parentRelation.children.delete(ID);
    EntityManager.removeEntity(ID, "battle");
  }

  private calculateDamage(
    hit: HitEvent,
    attacker: SystemComponent<"CharacterStats">,
    target: SystemComponent<"CharacterStats">,
  ) {
    const attack = this.getComponent(hit.attackID, "Attack")!;
    const increase =
      attacker.damageIncrease + attacker.DamageTypeIncrease[attack.damageType];
    const resist = Math.min(
      target.resist[attack.damageType],
      target.maxResist[attack.damageType],
    );
    return Math.max(0, attack.baseDamage * (1 + increase) * (1 - resist));
  }
}
