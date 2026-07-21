import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import { assert } from "@/utils/utils";
import { EnemyState } from "../components/enemyAI";
import SpatialHash from "@/utils/spatialHash";
import Time from "@/core/engine/time";
export type EnemyPerceptionData = {
  combat: Set<Symbol>;
  swarm: Set<Symbol>;
};
export default class AIPerception extends DogmaSystem {
  private perceptionData: EnemyPerceptionData = {
    combat: new Set(),
    swarm: new Set(),
  };
  declare private spacialHash: SpatialHash;
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }

  public onStart(): void {
    this.spacialHash = new SpatialHash({ cellSize: 32 });
    this.setSharedData<{ spacialHash: SpatialHash }>("scene", "spacialHash", {
      spacialHash: this.spacialHash,
    });
    this.subscribeToPhase({
      callback: this.perception.bind(this),
      phase: "preUpdate",
      before: ["AISwarm", "Physics"],
    });
    this.subscribeToPhase({
      callback: this.clearPerception.bind(this),
      phase: "postUpdate",
      after: ["AISwarm", "Physics", "AttackDirector"],
    });
  }
  private perception() {
    const playerTransform = this.getComponentWithMarker("Player", "Transform");
    assert(
      playerTransform !== undefined,
      "AI Perception: There is no player transform to fallow",
    );

    const enemyIDs = this.getComponentsGroup(["Transform", "Rigid", "EnemyAI"]);
    enemyIDs.forEach((ID) => {
      const transform = this.getComponent(ID, "Transform")!;
      const enemy = this.getComponent(ID, "EnemyAI")!;
      const collider = this.getComponent(ID, "Collider")!;

      this.generateHashGridData(ID, transform, collider);

      const enemyState = this.calculateEnemyState(
        transform,
        playerTransform,
        enemy,
      );
      enemy.state = enemyState;
      this.perceptionData[enemyState].add(ID);
    });
    this.events.emitCascade<EnemyPerceptionData>(
      "EnemyPerception",
      this.perceptionData,
    );
  }
  private generateHashGridData(
    ID: Symbol,
    transform: SystemComponent<"Transform">,
    collider: SystemComponent<"Collider">,
  ) {
    const rect = this.getColliderRect(
      transform.position,
      transform.size,
      collider,
    );
    this.spacialHash.addToGrid({
      position: rect.position,
      size: rect.size,
      ID,
    });
  }

  private calculateEnemyState(
    transform: SystemComponent<"Transform">,
    playerTransform: SystemComponent<"Transform">,
    enemy: SystemComponent<"EnemyAI">,
  ) {
    const diffX = playerTransform.position.x - transform.position.x;
    const diffY = playerTransform.position.y - transform.position.y;
    const distSq = diffX * diffX + diffY * diffY;

    const attackRangeSq = enemy.attackRange * enemy.attackRange;
    const flankRangeSq = enemy.flankRange * enemy.flankRange;

    let enemyState: EnemyState = "swarm";
    if (enemy.attackRangeType === "melee" && distSq <= attackRangeSq)
      return "combat";
    if (enemy.attackRangeType === "projectile" && distSq <= flankRangeSq)
      return "combat";

    return enemyState;
  }
  private clearPerception() {
    this.perceptionData.combat.clear();
    this.perceptionData.swarm.clear();
    this.spacialHash.clearGrid();
  }
  private getColliderRect(
    position: Position2D,
    size: Size2D,
    collider: SystemComponent<"Collider">,
  ): { position: Position2D; size: Size2D } {
    //TODO: specjalnei to zostawiam w kilku miejscach a nie robie w utils by pamietac ze po zbudowaniu biblio matmy to poczyscic
    const colliderSize: Size2D = {
      width: size.width + collider.sizeOffset.width,
      height: size.height + collider.sizeOffset.height,
    };
    const center = {
      x: position.x + size.width / 2 + collider.posOffset.x,
      y: position.y + size.height / 2 + collider.posOffset.y,
    };
    return {
      position: {
        x: center.x - colliderSize.width / 2,
        y: center.y - colliderSize.height / 2,
      },
      size: colliderSize,
    };
  }
}
