import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import { assert, createColliderBox, getColliderCenter } from "@/utils/utils";
import { EnemyState } from "../components/enemyAI";
import SpatialGrid from "@/core/axiom/spatialGridFrame";
import AxiomMath from "@/core/axiom/math";
export type EnemyPerceptionData = {
  combat: Set<Symbol>;
  swarm: Set<Symbol>;
};

export default class AIPerception extends DogmaSystem {
  private perceptionData: EnemyPerceptionData = {
    combat: new Set(),
    swarm: new Set(),
  };

  declare private spatialGrid: SpatialGrid<Symbol>;
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }

  public onStart(): void {
    this.spatialGrid = new SpatialGrid({ width: 32, height: 32 });
    this.setSharedData<{ spatialGrid: SpatialGrid<Symbol> }>(
      "scene",
      "spatialGrid",
      {
        spatialGrid: this.spatialGrid,
      },
    );
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
    const playerCollider = this.getComponentWithMarker("Player", "Collider");
    assert(
      playerTransform !== undefined,
      "AI Perception: There is no player transform to fallow",
    );
    assert(
      playerCollider !== undefined,
      "AI Perception: There is no player collider to fallow",
    );

    const enemyIDs = this.getComponentsGroup(["Transform", "Rigid", "EnemyAI"]);
    enemyIDs.forEach((ID) => {
      const transform = this.getComponent(ID, "Transform")!;
      const enemy = this.getComponent(ID, "EnemyAI")!;
      const collider = this.getComponent(ID, "Collider")!;

      this.generateHashGridData(ID, transform, collider);
      this.updateFaceDir(transform, collider, playerTransform, playerCollider);
      const enemyState = this.calculateEnemyState(
        transform,
        collider,
        playerTransform,
        playerCollider,
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
    const box = createColliderBox(transform, collider);
    this.spatialGrid.insert({
      bounds: box,
      ID,
      data: ID,
    });
  }
  private updateFaceDir(
    transform: SystemComponent<"Transform">,
    collider: SystemComponent<"Collider">,
    playerTransform: SystemComponent<"Transform">,
    playerCollider: SystemComponent<"Collider">,
  ) {
    const selfCenter = getColliderCenter(transform, collider);
    const playerCenter = getColliderCenter(playerTransform, playerCollider);
    const diff = playerCenter.sub(selfCenter);
    if (diff.lengthSquared() > 1) {
      transform.faceDir.copy(diff.normalize());
    }
  }

  private calculateEnemyState(
    transform: SystemComponent<"Transform">,
    collider: SystemComponent<"Collider">,
    playerTransform: SystemComponent<"Transform">,
    playerCollider: SystemComponent<"Collider">,
    enemy: SystemComponent<"EnemyAI">,
  ) {
    const selfCenter = getColliderCenter(transform, collider);
    const playerCenter = getColliderCenter(playerTransform, playerCollider);
    const distSq = selfCenter.sub(playerCenter).lengthSquared();

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
    this.spatialGrid.clear();
  }
}
