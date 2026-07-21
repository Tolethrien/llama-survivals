import EntityManager from "@/core/dogma/entityManager";
import DogmaSystem, { InternalDSProps } from "@/core/dogma/system";
import Time from "@/core/engine/time";

export default class LifeCycle extends DogmaSystem {
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }
  public onStart(): void {
    this.subscribeToPhase({
      callback: this.removeEntities.bind(this),
      phase: "postUpdate",
    });
  }
  private removeEntities() {
    const dt = Time.getDeltaTime();
    const timers = this.getComponentList("LifeSpan");
    if (!timers) return;
    timers.forEach((life) => {
      life.currentLife -= dt;
      if (life.currentLife <= 0) {
        EntityManager.removeEntity(life.ID, "battle");
        const relation = this.getComponent(life.ID, "Relation");
        if (!relation?.parentAbility) return;
        const parentRelation = this.getComponent(
          relation.parentAbility,
          "Relation",
        );
        parentRelation?.children.delete(life.ID);
      }
    });
  }
}
