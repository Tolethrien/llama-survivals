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
import FontGen from "@/core/aurora/renderer/fontGen";
import Aurora from "@/core/aurora/core";

const BUTTON_TAGS = ["buttonA", "buttonB", "buttonC"];

const PADDING = 40;
const SECTION_GAP = 24;
const CARD_WIDTH = 240;
const CARD_HEIGHT = 260;
const CARD_GAP = 24;
const CARD_INNER_PADDING = 18;
const HEADER_FONT_SIZE = 19;
const BODY_FONT_SIZE = 16;
const LINE_HEIGHT = 22;
const TITLE_HEIGHT = 90;

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
  private hoveredCardID: Symbol | undefined;
  private titleInitialized = false;
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
    this.updateHoverState(data);
    this.updateEvents();
    this.updateInput(data);
  }
  private updateHoverState(data: UINodeHoverData) {
    if (data.currentRoot !== this.rootID || !data.currentFrame) {
      this.hoveredCardID = undefined;
      return;
    }
    const node = this.getComponent(data.currentFrame, "UINode");
    this.hoveredCardID = node?.interactive ? data.currentFrame : undefined;
  }
  private render() {
    this.ensureTitleText();
    const node = this.getComponent(this.rootID, "UINode");
    if (!node || !node.active) return;
    this.DrawNode(node.ID);
  }
  private DrawNode(ID: Symbol | undefined) {
    if (!ID) return;
    const node = this.getComponent(ID, "UINode");
    if (!node || !node.visible) return;

    const tint =
      ID === this.hoveredCardID
        ? this.brightenTint(node.visual.tint)
        : node.visual.tint;

    Draw.guiRect({
      position: { x: node.transform.x, y: node.transform.y },
      size: { width: node.transform.width, height: node.transform.height },
      background: node.visual.type === "image" ? node.visual.sprite : undefined,
      crop: node.visual.type === "image" ? node.visual.crop : undefined,
      tint,
    });

    const isTitle = node.tags.has("lvlUpTitle");
    const textX = node.transform.x + CARD_INNER_PADDING;
    const maxTextWidth = node.transform.width - CARD_INNER_PADDING * 2;
    let textY = node.transform.y + CARD_INNER_PADDING;

    if (node.subValue) {
      const x = isTitle
        ? this.centeredX(
            node.subValue,
            HEADER_FONT_SIZE,
            node.transform.x,
            node.transform.width,
          )
        : textX;
      Draw.guiText({
        position: { x, y: textY, mode: "pixel" },
        font: "lato",
        fontColor: [255, 200, 110, 255],
        fontSize: { size: HEADER_FONT_SIZE, mode: "pixel" },
        text: node.subValue,
      });
      textY += HEADER_FONT_SIZE + 8;
      if (!isTitle) {
        Draw.guiRect({
          position: { x: textX, y: textY },
          size: { width: maxTextWidth, height: 1 },
          tint: [255, 255, 255, 60],
        });
      }
      textY += 10;
    }

    if (node.value) {
      const lines = this.wrapText(node.value, maxTextWidth, BODY_FONT_SIZE);
      lines.forEach((line) => {
        const x = isTitle
          ? this.centeredX(
              line,
              BODY_FONT_SIZE,
              node.transform.x,
              node.transform.width,
            )
          : textX;
        Draw.guiText({
          position: { x, y: textY, mode: "pixel" },
          font: "lato",
          fontColor: [225, 225, 232, 255],
          fontSize: { size: BODY_FONT_SIZE, mode: "pixel" },
          text: line,
        });
        textY += LINE_HEIGHT;
      });
    }

    node.children?.forEach((childID) => this.DrawNode(childID));
  }
  private centeredX(
    text: string,
    fontSize: number,
    boxX: number,
    boxWidth: number,
  ): number {
    const { width } = FontGen.measureText({
      fontName: "lato",
      fontSize: fontSize + 8, // ten sam offset co guiText w trybie "pixel"
      text,
    });
    return boxX + (boxWidth - width) / 2;
  }
  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    const renderedFontSize = fontSize + 8;
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const { width } = FontGen.measureText({
        fontName: "lato",
        fontSize: renderedFontSize,
        text: candidate,
      });
      if (width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
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
    const contentWidth = CARD_WIDTH * 3 + CARD_GAP * 2;
    const width = contentWidth + PADDING * 2;
    const height = PADDING * 2 + TITLE_HEIGHT + SECTION_GAP + CARD_HEIGHT;

    const rootX = (Aurora.canvas.width - width) / 2;
    const rootY = (Aurora.canvas.height - height) / 2;
    const titleY = rootY + PADDING;
    const cardsY = titleY + TITLE_HEIGHT + SECTION_GAP;

    const cardChildren = BUTTON_TAGS.map((tag, i) => ({
      active: true,
      visible: true,
      visual: { type: "color" as const, tint: [45, 48, 62, 255] as RGBA },
      transform: {
        x: rootX + PADDING + i * (CARD_WIDTH + CARD_GAP),
        y: cardsY,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      },
      interactive: true,
      tags: [tag],
    }));

    const rootID = GuiManager.build({
      active: false,
      visible: true,
      transform: { x: rootX, y: rootY, width, height },
      visual: { type: "color", tint: [20, 20, 26, 235] },
      interactive: false,
      children: [
        {
          active: true,
          visible: true,
          visual: { type: "color", tint: [0, 0, 0, 0] },
          transform: {
            x: rootX + PADDING,
            y: titleY,
            width: contentWidth,
            height: TITLE_HEIGHT,
          },
          interactive: false,
          tags: ["lvlUpTitle"],
        },
        ...cardChildren,
      ],
    });
    this.rootID = rootID;

    const [titleID] = this.getComponentsWithTags("UINode", ["lvlUpTitle"]);
    const titleNode = this.getComponent(titleID, "UINode");
    if (titleNode) {
      titleNode.subValue = "LEVEL UP!";
      titleNode.value = "Choose one of the upgrades below";
    }
  }
  private ensureTitleText() {
    if (this.titleInitialized) return;
    const [titleID] = this.getComponentsWithTags("UINode", ["lvlUpTitle"]);
    if (!titleID) return; // encja jeszcze nie zdispatchowana, spróbuj w następnej klatce
    const titleNode = this.getComponent(titleID, "UINode");
    if (!titleNode) return;
    titleNode.subValue = "LEVEL UP!";
    titleNode.value = "Choose one of the upgrades below";
    this.titleInitialized = true;
  }

  private rollChoices() {
    const state = this.buildPlayerUpgradeState();
    const eligible = Object.entries(UPGRADE_POOL).filter(([key, def]) =>
      this.isUpgradeEligible(key, def, state),
    );

    this.currentChoices = this.pickWithNewAbilityCap(eligible, 3, 2);

    BUTTON_TAGS.forEach((tag, i) => {
      const [nodeID] = this.getComponentsWithTags("UINode", [tag]);
      const node = this.getComponent(nodeID, "UINode");
      if (!node) return;
      const choice = this.currentChoices[i];
      node.subValue = choice ? this.getUpgradeSourceLabel(choice[1]) : "";
      node.value = choice?.[1].label ?? "";
    });
  }
  private getUpgradeSourceLabel(def: UpgradeDefinition): string {
    if (def.kind === "statUpgrade") return "Character";
    return this.formatAbilityName(def.abilityTag);
  }
  private formatAbilityName(tag: string): string {
    return tag.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  }
  private pickWithNewAbilityCap(
    eligible: [string, UpgradeDefinition][],
    total: number,
    maxNewAbility: number,
  ): [string, UpgradeDefinition][] {
    const shuffled = AxiomMath.pickRandomN(eligible, eligible.length);
    const result: [string, UpgradeDefinition][] = [];
    let newAbilityCount = 0;

    for (const entry of shuffled) {
      if (result.length >= total) break;
      const isNewAbility = entry[1].kind === "newAbility";
      if (isNewAbility && newAbilityCount >= maxNewAbility) continue;
      result.push(entry);
      if (isNewAbility) newAbilityCount++;
    }

    return result;
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
  private brightenTint(tint: RGBA): RGBA {
    return [
      Math.min(255, tint[0] + 30),
      Math.min(255, tint[1] + 30),
      Math.min(255, tint[2] + 30),
      tint[3],
    ];
  }
}
