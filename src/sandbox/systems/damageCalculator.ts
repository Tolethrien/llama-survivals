import EntityManager from "@/core/dogma/entityManager";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import { HitEvent } from "./collisions";
import { CoinSpawnEvent } from "./xPGather";
import Time from "@/core/engine/time";

export default class DamageCalculator extends DogmaSystem {
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }
  public onStart(): void {
    this.subscribeToPhase({
      callback: this.update.bind(this),
      phase: "update",
    });
  }
  private update() {
    const dt = Time.getDeltaTime();
    this.calculateDmg();
    this.passiveRegeneration(dt);
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

      const finalDamage = this.getDmgHit(hit, attackerStats, targetStats);
      targetStats.currentHP -= finalDamage;
      if (attack.tracking.hitType === "hit") this.deleteAttack(attack.ID);
      if (targetStats.currentHP <= targetStats.minHP) {
        if (targetStats.tags.has("secondLife")) this.relocateChar(targetStats);
        else toRemove.add(hit.targetID);
        this.healPlayer();
      }
    });
    toRemove.forEach((ID) => this.deleteEntity(ID));
  }
  private deleteEntity(ID: Symbol) {
    const eq = this.getComponent(ID, "Equipment")!;
    const transform = this.getComponent(ID, "Transform")!;
    for (const slot of eq.slots) {
      const relation = this.getComponent(slot.abilityID, "Relation")!;
      const ability = this.getComponent(slot.abilityID, "Ability")!;
      if (ability.attackMeta.onCasterDeath === "remove") {
        relation.children.forEach((child) =>
          EntityManager.removeEntity(child, "battle"),
        );
      }
      EntityManager.removeEntity(slot.abilityID, "battle");
    }
    EntityManager.removeEntity(ID, "battle");
    this.events.emitCascade<CoinSpawnEvent>("spawnCoinEvent", {
      deadPos: transform.position,
    });
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

  private getDmgHit(
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
  private relocateChar(stats: SystemComponent<"CharacterStats">) {
    const transform = this.getComponent(stats.ID, "Transform")!;
    transform.position.set(1300, 1300); //TODO: losowe miejsce na mapie
    transform.prevPosition.set(1300, 1300);
    stats.currentHP = stats.maxHP * 0.5;
  }
  private healPlayer() {
    const stats = this.getComponentWithMarker("Player", "CharacterStats")!;
    if (stats.currentHP >= stats.maxHP) return;
    stats.currentHP = Math.min(
      stats.maxHP,
      stats.currentHP + stats.maxHP * stats.healOnKill,
    );
  }
  private passiveRegeneration(dt: number) {
    const stats = this.getComponentWithMarker("Player", "CharacterStats")!;
    if (stats.currentHP >= stats.maxHP) return;
    stats.currentHP = Math.min(
      stats.maxHP,
      stats.currentHP + stats.maxHP * stats.passiveHeal * dt,
    );
  }
}
