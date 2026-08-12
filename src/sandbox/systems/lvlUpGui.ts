import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import Draw from "@/core/aurora/draw";
import InputManager from "@/core/engine/inputManager";
import { LvlUpEvent } from "./spawner";
import Time from "@/core/engine/time";
import { UINodeHoverData } from "./uiInputs";
import GuiManager from "../managers/guiManager";
import { UPGRADE_POOL, UpgradeDefinition } from "../db/upgradePool";
import { abilities } from "../configs";
import AxiomMath from "@/core/axiom/math";
import EntityManager from "@/core/dogma/entityManager";
const BUTTON_TAGS = ["buttonA", "buttonB", "buttonC"];

export type PlayerUpgradeState = {
  ownedTags: Set<keyof typeof abilities>;
  slotsFull: boolean;
  getAbility: (
    tag: keyof typeof abilities,
  ) => SystemComponent<"Ability"> | undefined;
  stats: SystemComponent<"CharacterStats">;
};
export default class LvlUpGui extends DogmaSystem {
  private framePos: Position2D = { x: 300, y: 300 };
  private lvlSequence: Generator<void, void, unknown> | null = null;
  declare private rootID: Symbol;
  declare private playerID: Symbol;
  private currentChoices: [string, UpgradeDefinition][] = [];
  constructor(internal: InternalDSProps) {
    super(internal);
  }
  public onStart() {
    this.buildGUITree();
    this.playerID = this.getComponentWithMarker("Player", "Transform")!.ID;
    this.subscribeToPhase({
      callback: this.render.bind(this),
      phase: "render",
    });
    this.subscribeToPhase({
      callback: this.update.bind(this),
      phase: "update",
    });
  }

  private update() {
    const data = this.getSharedData<UINodeHoverData>("scene", "UINodeHovered")!;
    this.updateEvents();
    this.updateInput(data);
  }
  private render() {
    const node = this.getComponent(this.rootID, "UINode");
    if (!node || !node.active) return;
    this.DrawNode(node.ID);
  }
  private DrawNode(ID: Symbol | undefined) {
    if (!ID) return;
    const node = this.getComponent(ID, "UINode");
    if (!node || !node.visible) return;

    Draw.guiRect({
      position: { x: node.transform.x, y: node.transform.y },
      size: { width: node.transform.width, height: node.transform.height },
      background: node.visual.type === "image" ? node.visual.sprite : undefined,
      crop: node.visual.type === "image" ? node.visual.crop : undefined,
      tint: node.visual.tint,
    });
    if (node.value) {
      Draw.guiText({
        position: {
          x: node.transform.x + 10,
          y: node.transform.y + 10,
          mode: "pixel",
        },
        font: "lato",
        fontColor: [255, 255, 255, 255],
        fontSize: { size: 16, mode: "pixel" },
        text: node.value,
      });
    }
    node.children?.forEach((ID) => this.DrawNode(ID));
  }
  private updateEvents() {
    const events = this.events.getCascade<LvlUpEvent[]>("lvlUpEvent");
    if (!events || events.length === 0) return;
    Time.setPaused(true);
    const accuLvl = events.reduce((accu, { lvls }) => (accu += lvls), 0);
    const node = this.getComponent(this.rootID, "UINode")!;
    node.active = true;
    this.lvlSequence = this.LvlIterator(accuLvl);
    this.lvlSequence.next();
  }

  private updateInput(data: UINodeHoverData) {
    if (!data.currentRoot || !data.currentFrame) return;
    const root = this.getComponent(data.currentRoot, "UINode");
    if (!root || root.ID !== this.rootID) return;
    const node = this.getComponent(data.currentFrame, "UINode")!;
    if (!node.interactive) return;
    if (!InputManager.isMouseClicked("LEFT")) return;
    if (node.tags.has(BUTTON_TAGS[0])) this.applyChoice(0);
    else if (node.tags.has(BUTTON_TAGS[1])) this.applyChoice(1);
    else if (node.tags.has(BUTTON_TAGS[2])) this.applyChoice(2);
    const iterator = this.lvlSequence!.next();
    if (iterator.done) {
      root.active = false;
      Time.setPaused(false);
      this.lvlSequence = null;
    }
  }
  private buildGUITree() {
    const rootID = GuiManager.build({
      active: false,
      visible: true,
      transform: {
        x: this.framePos.x,
        y: this.framePos.y,
        width: 600,
        height: 400,
      },
      visual: { type: "color", tint: [255, 0, 255, 255] },
      interactive: false,
      children: [
        {
          active: true,
          visible: true,
          visual: { type: "color", tint: [255, 100, 255, 255] },
          transform: {
            x: this.framePos.x + 50,
            y: this.framePos.y + 50,
            width: 100,
            height: 100,
          },
          interactive: true,
          tags: [BUTTON_TAGS[0]],
        },
        {
          active: true,
          visible: true,
          visual: { type: "color", tint: [255, 100, 255, 255] },
          transform: {
            x: this.framePos.x + 50,
            y: this.framePos.y + 150 + 10,
            width: 100,
            height: 100,
          },
          interactive: true,
          tags: [BUTTON_TAGS[1]],
        },
        {
          active: true,
          visible: true,
          visual: { type: "color", tint: [255, 100, 255, 255] },
          transform: {
            x: this.framePos.x + 50,
            y: this.framePos.y + 250 + 20,
            width: 100,
            height: 100,
          },
          interactive: true,
          tags: [BUTTON_TAGS[2]],
        },
      ],
    });
    this.rootID = rootID;
  }
  private rollChoices() {
    const state = this.buildPlayerUpgradeState();

    const eligible = Object.entries(UPGRADE_POOL).filter(([key, def]) =>
      this.isUpgradeEligible(key, def, state),
    );
    this.currentChoices = AxiomMath.pickRandomN(eligible, 3);

    BUTTON_TAGS.forEach((tag, i) => {
      const [nodeID] = this.getComponentsWithTags("UINode", [tag]);
      const node = this.getComponent(nodeID, "UINode");
      if (!node) return;
      node.value = this.currentChoices[i]?.[1].label ?? "";
    });
  }
  private applyChoice(index: number) {
    const choice = this.currentChoices[index];
    if (!choice) return;
    const [key, def] = choice;
    const equipment = this.getComponent(this.playerID, "Equipment")!;

    switch (def.kind) {
      case "abilityUpgrade": {
        const slot = equipment.slots.find(
          (s) => s.attackName === def.abilityTag,
        );
        if (!slot) return;
        const ability = this.getComponent(slot.abilityID, "Ability")!;
        const relation = this.getComponent(slot.abilityID, "Relation")!;

        def.apply(ability);
        if (def.once) ability.appliedUpgrades.add(key);
        this.respawnIfPersistent(ability, relation);
        break;
      }
      case "newAbility": {
        const entity = new abilities[def.abilityTag](this.playerID);
        const playerTransform = this.getComponent(this.playerID, "Transform")!;
        if (playerTransform.tags.has("timeImmune")) entity.addTag("timeImmune");
        EntityManager.spawnEntity(entity, "battle");
        equipment.slots.push({
          attackName: def.abilityTag,
          abilityID: entity.ID,
        });
        break;
      }
      case "statUpgrade": {
        const stats = this.getComponent(this.playerID, "CharacterStats")!;
        def.apply(stats);
        break;
      }
    }
  }
  private isUpgradeEligible(
    key: string,
    def: UpgradeDefinition,
    state: PlayerUpgradeState,
  ): boolean {
    switch (def.kind) {
      case "abilityUpgrade": {
        if (!state.ownedTags.has(def.abilityTag)) return false;
        const ability = state.getAbility(def.abilityTag);
        if (!ability) return false;
        if (def.once && ability.appliedUpgrades.has(key)) return false;
        if (def.isMin && !def.isMin(ability)) return false;
        if (def.isMaxed && def.isMaxed(ability)) return false;
        return true;
      }
      case "newAbility":
        return !state.ownedTags.has(def.abilityTag) && !state.slotsFull;
      case "statUpgrade":
        return true;
    }
  }
  private respawnIfPersistent(
    ability: SystemComponent<"Ability">,
    relation: SystemComponent<"Relation">,
  ) {
    if (ability.spawnMode.type !== "persistent") return;
    relation.children.forEach((childID) =>
      EntityManager.removeEntity(childID, "battle"),
    );
    relation.children.clear();
    ability.spawnMode.spawned = false;
  }
  private buildPlayerUpgradeState(): PlayerUpgradeState {
    const equipment = this.getComponent(this.playerID, "Equipment")!;
    const stats = this.getComponent(this.playerID, "CharacterStats")!;
    return {
      ownedTags: new Set(equipment.slots.map((s) => s.attackName)),
      slotsFull: equipment.slots.length >= equipment.abilitiesCap,
      stats,
      getAbility: (tag) => {
        const slot = equipment.slots.find((s) => s.attackName === tag);
        return slot ? this.getComponent(slot.abilityID, "Ability") : undefined;
      },
    };
  }
  private *LvlIterator(numOfLvls: number) {
    for (let index = 0; index < numOfLvls; index++) {
      this.rollChoices();
      yield;
    }
  }
}
