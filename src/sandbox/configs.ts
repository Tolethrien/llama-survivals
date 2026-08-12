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
import Fireball from "./entities/abilities/fireball";
import Stick from "./components/stick";
import Orbit from "./components/orbit";
import Fraction from "./components/fraction";
import Skulls from "./entities/abilities/skulls";
import Spawner from "./systems/spawner";
import Slash from "./entities/abilities/slash";
import Projectile from "./components/projectile";
import Magnet from "./components/magnet";
import XpGather from "./systems/xPGather";
import UINode from "./components/UINode";
import LvlUpGui from "./systems/lvlUpGui";
import UIInputs from "./systems/uiInputs";
import ChestGather from "./systems/chestGather";
import UseItem from "./systems/useItem";
import BuffList from "./components/buff";
import { Buffs } from "./systems/buffs";
import ChestRoll from "./components/chestRoll";
import ItemSwap from "./systems/itemSwap";
import FireWall from "./entities/abilities/firewall";
import VoidSpawn from "./entities/abilities/voidSpawn";
import BananaSpread from "./entities/abilities/bananaSpread";

export const abilities = {
  Aura,
  Fireball,
  Skulls,
  Slash,
  FireWall,
  VoidSpawn,
  BananaSpread,
};

export const dogmaConfig = {
  systems: {
    GameInputs,
    Physics,
    RenderGame,
    AIPerception,
    AISwarm,
    Collision,
    LifeCycle,
    DamageCalculator,
    AttackDirector,
    Spawner,
    XpGather,
    LvlUpGui,
    UIInputs,
    ChestGather,
    UseItem,
    Buffs,
    ItemSwap,
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
    UINode,
    BuffList,
    ChestRoll,
  },
} satisfies DogmaConfig;
