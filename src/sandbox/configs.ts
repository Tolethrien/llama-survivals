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
import RenderGame from "./systems/renderGame";
import RenderUI from "./systems/renderUI";
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
import Aura from "./entities/abilities/aura";
import ArrowMachine from "./entities/abilities/arrowMachine";
import Stick from "./components/stick";
import Orbit from "./components/orbit";
import Fraction from "./components/fraction";
import Skulls from "./entities/abilities/skulls";
import WorldDir from "./entities/abilities/worldDir";
import Spawner from "./systems/spawner";
import Slash from "./entities/abilities/slash";
import Projectile from "./components/projectile";
import Spiraler from "./entities/abilities/spiraler";
import Magnet from "./components/magnet";
import CoinGather from "./systems/coinGather";

export const abilities = {
  Aura,
  ArrowMachine,
  Skulls,
  WorldDir,
  Slash,
  Spiraler,
};

export const dogmaConfig = {
  systems: {
    GameInputs,
    Physics,
    RenderGame,
    RenderUI,
    AIPerception,
    AISwarm,
    Collision,
    LifeCycle,
    DamageCalculator,
    AttackDirector,
    Spawner,
    CoinGather,
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
    Projectile,
    Magnet,
  },
} satisfies DogmaConfig;
