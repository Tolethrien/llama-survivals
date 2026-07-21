import Collider from "./components/collider";
import EnemyAI from "./components/enemyAI";
import Ground from "./components/ground";
import Rigid from "./components/rigid";
import Shape from "./components/shape";
import Sprite from "./components/sprite";
import Transform from "./components/transform";
import AIPerception from "./systems/AIPerception";
import AISwarm from "./systems/AISwarm";
import GameInputs from "./systems/gameInput";
import Physics from "./systems/physics";
import Render from "./systems/render";
import LifeSpan from "./components/lifespan";
import LifeCycle from "./systems/LifeCycle";
import CharacterStats from "./components/characterStats";
import Equipment from "./components/equipment";
import Collision from "./systems/collisions";
import Relation from "./components/relation";
import DamageCalculator from "./systems/damageCalculator";
import AttackDirector from "./systems/attackDirector";
import Ability from "./components/ability";
import Attack from "./components/attack";
import FireMachineGun from "./entities/abilities/fireMachine";
import ArrowMachine from "./entities/abilities/arrowMachine";
import Stick from "./components/stick";
import Orbit from "./components/orbit";
import Fraction from "./components/fraction";
import Skulls from "./entities/abilities/skulls";

export const abilities = {
  FireMachineGun,
  ArrowMachine,
  Skulls,
};

export const dogmaConfig = {
  systems: {
    GameInputs,
    Physics,
    Render,
    AIPerception,
    AISwarm,
    Collision,
    LifeCycle,
    DamageCalculator,
    AttackDirector,
  },
  components: {
    Rigid,
    Collider,
    Transform,
    Ground,
    EnemyAI,
    Sprite,
    Shape,
    Attack,
    CharacterStats,
    LifeSpan,
    Equipment,
    Relation,
    Ability,
    Stick,
    Orbit,
    Fraction,
  },
} satisfies DogmaConfig;
