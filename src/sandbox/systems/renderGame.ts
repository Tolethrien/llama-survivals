import AuroraCamera from "@/core/aurora/camera";
import Aurora from "@/core/aurora/core";
import Draw from "@/core/aurora/draw";
import Renderer from "@/core/aurora/renderer/renderer";
import AxiomMath from "@/core/axiom/math";
import Vec2 from "@/core/axiom/vec2";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import Time from "@/core/engine/time";
import { assert, createColliderBox, getOrbitPosition } from "@/utils/utils";
import { BattleProgressData } from "./spawner";
const DRAW_MARGIN = 128;
const Y_SORT_FACTOR = 1000000;
export default class RenderGame extends DogmaSystem {
  declare private battleProgressData: BattleProgressData;

  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }

  public onStart(): void {
    this.subscribeToPhase({
      phase: "render",
      callback: this.renderer.bind(this),
    });
    AuroraCamera.scale(0.5);
    Renderer.setPostProcess({
      // vignette: { str: 0.4, radius: 0.85 },
      // chromaticAberration: { str: 0.05 },
    });
  }

  renderer() {
    const alpha = Time.getAlpha();
    const cameraPos = AuroraCamera.getPosition;
    const viewBox = AuroraCamera.getViewBox();
    const drawDistance: Size2D = {
      width: viewBox.w / 2 + DRAW_MARGIN,
      height: viewBox.h / 2 + DRAW_MARGIN,
    };
    this.updateCamera(alpha);
    this.renderSprites(cameraPos, drawDistance, alpha);
    // this.renderColliders(cameraPos, drawDistance, alpha);
  }

  updateCamera(alpha: number) {
    const playerTransform = this.getComponentWithMarker("Player", "Transform")!;
    const renderPos = this.lerpPos(playerTransform, alpha);
    const targetX = renderPos.x + playerTransform.size.width / 2;
    const targetY = renderPos.y + playerTransform.size.height / 2;
    AuroraCamera.move({ x: targetX, y: targetY });
  }
  private renderSprites(
    cameraPos: Position2D,
    drawDistance: Size2D,
    alpha: number,
  ) {
    const sprites = this.getComponentsGroup(["Transform", "Sprite"]);
    sprites.forEach((ID) => {
      const transform = this.getComponent(ID, "Transform")!;
      const sprite = this.getComponent(ID, "Sprite")!;

      const pos =
        sprite.renderMode === "lerpAngle"
          ? this.resolveOrbitRenderPos(ID, alpha)
          : this.lerpPos(transform, alpha);
      if (!pos) return;

      const renderPos = this.getVisiblePosition(
        pos,
        transform.size,
        cameraPos,
        drawDistance,
      );
      if (!renderPos) return;

      const feetY = renderPos.y + transform.size.height;

      Draw.sprite({
        position: {
          x: renderPos.x,
          y: renderPos.y,
          z: sprite.layer + feetY / Y_SORT_FACTOR,
        },
        size: transform.size,
        textureToUse: sprite.spriteName,
        crop: sprite.crop,
        tint: [sprite.tint[0], sprite.tint[1], sprite.tint[2], 255],
      });
    });
  }

  private resolveOrbitRenderPos(ID: Symbol, alpha: number): Position2D | null {
    const transform = this.getComponent(ID, "Transform")!;
    const orbit = this.getComponent(ID, "Orbit")!;
    const targetTransform = this.getComponent(orbit.targetID, "Transform");
    if (!targetTransform) return null;

    const lerpedAngle = AxiomMath.lerpAngle(
      orbit.prevAngle,
      orbit.angleDeg,
      alpha,
    );
    return getOrbitPosition(
      orbit,
      targetTransform,
      transform.size,
      lerpedAngle,
    );
  }

  private lerpPos(
    transform: SystemComponent<"Transform">,
    alpha: number,
  ): Position2D {
    return Vec2.lerp(transform.prevPosition, transform.position, alpha).value;
  }
  private getVisiblePosition(
    pos: Position2D,
    size: Size2D,
    cameraPos: Position2D,
    drawDistance: Size2D,
  ): Position2D | null {
    const distanceX = Math.abs(pos.x + size.width / 2 - cameraPos.x);
    const distanceY = Math.abs(pos.y + size.height / 2 - cameraPos.y);
    if (distanceX > drawDistance.width || distanceY > drawDistance.height)
      return null;
    return pos;
  }

  private renderColliders(
    cameraPos: Position2D,
    drawDistance: Size2D,
    alpha: number,
  ) {
    const colliders = this.getComponentsGroup([
      "Transform",
      "Collider",
      "Sprite",
    ]);
    colliders.forEach((ID) => {
      const transform = this.getComponent(ID, "Transform")!;
      const collider = this.getComponent(ID, "Collider")!;
      const sprite = this.getComponent(ID, "Sprite")!;

      const basePos =
        sprite.renderMode === "lerpAngle"
          ? this.resolveOrbitRenderPos(ID, alpha)
          : this.lerpPos(transform, alpha);
      if (!basePos) return;

      const feetY = basePos.y + transform.size.height;
      const z = sprite.layer + feetY / Y_SORT_FACTOR + 0.001;

      const box = createColliderBox(
        { position: basePos, size: transform.size },
        collider,
      );

      const renderPos = this.getVisiblePosition(
        { x: box.x, y: box.y },
        { width: box.w, height: box.h },
        cameraPos,
        drawDistance,
      );
      if (!renderPos) return;

      const debugTint = this.getColliderDebugTint(collider);

      if (collider.shape === "rect") {
        Draw.rect({
          position: { x: renderPos.x, y: renderPos.y, z: 1 },
          size: { width: box.w, height: box.h },
          tint: debugTint,
        });
      } else {
        Draw.circle({
          position: { x: renderPos.x, y: renderPos.y, z: 1 },
          size: { width: box.w, height: box.w },
          tint: debugTint,
        });
      }
    });
  }
  private getColliderDebugTint(collider: SystemComponent<"Collider">): RGBA {
    if (collider.tags.has("attack")) return [255, 80, 80, 140]; // ataki — czerwony
    if (collider.tags.has("Player")) return [80, 160, 255, 140]; // gracz — niebieski
    return [0, 255, 0, 120]; // reszta (moby) — zielony, jak było
  }
}
