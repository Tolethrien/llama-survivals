import DogmaComponent, { InternalDCProps } from "@/core/dogma/component";
import { AttackDisplayKey, HitTrackingKeys } from "../managers/attackManager";
type PositionSpawn = "randomPoint" | "onTarget" | "onSelf";
export type SpawnMode = {
  type: "spawn" | "persistent";
  delay: number;
  spawned: boolean;
  where: PositionSpawn;
};

export type DirectionStrategy =
  | "towardsMouse"
  | "towardsTarget"
  | "randomDirection"
  | "none";

export type AttackBehaviorName =
  | "orbit"
  | "rigid"
  | "static"
  | "pointToPoint"
  | "rebound"
  | "follow";
export type AttackMeta = {
  lifespan: number;
  baseDmg: number;
  name: AttackDisplayKey;
  hitType: HitTrackingKeys;
};
export type AttackBehavior =
  | OrbitBehavior
  | RigidBehavior
  | StaticBehavior
  | StickBehavior;
type OrbitBehavior = {
  radius: Position2D;
  orbitSpeed: number;
  startAngle?: number;
  name: "orbit";
};
type RigidBehavior = {
  movementSpeed: number;
  name: "rigid";
};
type StaticBehavior = { name: "static" };
type StickBehavior = { name: "stick"; distance: number; angle: number };

interface AbilityProps {
  spawnMode: Omit<SpawnMode, "spawned">;
  directionStrategy: DirectionStrategy;
  attackBehavior: AttackBehavior;
  attackMeta: AttackMeta;
}
export default class Ability extends DogmaComponent {
  public spawnMode: SpawnMode;
  public directionStrategy: AbilityProps["directionStrategy"];
  public attackBehavior: AbilityProps["attackBehavior"];
  public attackLifespan: AbilityProps["attackMeta"];
  public abilityDelay: AbilityProps["spawnMode"]["delay"];
  public attackMeta: AbilityProps["attackMeta"];
  public cooldown: number = 0;
  constructor(internalProps: InternalDCProps, props: AbilityProps) {
    super(internalProps);
    this.spawnMode = { ...props.spawnMode, spawned: false };
    this.directionStrategy = props.directionStrategy;
    this.attackBehavior = props.attackBehavior;
    this.attackLifespan = props.attackMeta;
    this.abilityDelay = props.spawnMode.delay;
    this.attackMeta = props.attackMeta;
  }
}
