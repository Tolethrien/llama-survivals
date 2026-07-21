import AuroraCamera from "@/core/aurora/camera";
import Aurora from "@/core/aurora/core";
import Draw from "@/core/aurora/draw";
import Renderer from "@/core/aurora/renderer/renderer";
import DogmaSystem, {
  InternalDSProps,
  SystemComponent,
} from "@/core/dogma/system";
import Time from "@/core/engine/time";
import { mapRange } from "@/utils/utils";
const DRAW_MARGIN = 128;
export default class Render extends DogmaSystem {
  constructor(internalProps: InternalDSProps) {
    super(internalProps);
  }

  public onStart(): void {
    this.subscribeToPhase({
      phase: "render",
      callback: this.renderer.bind(this),
    });
    AuroraCamera.scale(0.5);
  }

  renderer() {
    const alpha = Time.getAlpha();
    const cameraPos = AuroraCamera.getPosition;
    const viewBox = AuroraCamera.getViewBox();
    const drawDistance: Size2D = {
      width: viewBox.w / 2 + DRAW_MARGIN,
      height: viewBox.h / 2 + DRAW_MARGIN,
    };
    Renderer.beginBatch();
    this.updateCamera(alpha);
    this.renderSprites(cameraPos, drawDistance, alpha);
    // this.renderColliders(cameraPos, drawDistance, alpha);
    this.renderUI();

    Renderer.endBatch();
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

      Draw.sprite({
        position: { x: renderPos.x, y: renderPos.y, z: sprite.layer },
        size: transform.size,
        textureToUse: sprite.spriteName,
        crop: sprite.crop,
        tint: [sprite.tint[0], sprite.tint[1], sprite.tint[2], 255],
      });
    });
  }
  private renderUI() {
    const stats = this.getComponentWithMarker("Player", "CharacterStats")!;
    const hp = mapRange(stats.currentHP, 0, stats.maxHP, 0, 50);
    Draw.guiRect({
      position: {
        x: Aurora.canvas.width / 2 - 25 - 2,
        y: Aurora.canvas.height / 2 - 30 - 2,
      },
      size: { width: 50 + 4, height: 4 + 4 },
      tint: [0, 0, 0, 170],
    });

    Draw.guiRect({
      position: {
        x: Aurora.canvas.width / 2 - 25,
        y: Aurora.canvas.height / 2 - 30,
      },
      size: { width: hp, height: 4 },
      tint: [255, 0, 0, 150],
    });
  }
  private resolveOrbitRenderPos(ID: Symbol, alpha: number): Position2D | null {
    const orbit = this.getComponent(ID, "Orbit");
    if (!orbit) return null;
    const targetTransform = this.getComponent(orbit.targetID, "Transform");
    if (!targetTransform) return null;

    const lerpedAngle = this.lerpAngleDeg(
      orbit.prevAngle,
      orbit.angleDeg,
      alpha,
    );
    return this.getOrbitPosition(orbit, targetTransform, lerpedAngle);
  }
  private lerpAngleDeg(prev: number, curr: number, alpha: number): number {
    let delta = curr - prev;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return prev + delta * alpha;
  }
  private getOrbitPosition(
    orbit: SystemComponent<"Orbit">,
    targetTransform: SystemComponent<"Transform">,
    angleDeg: number,
  ): Position2D {
    const angleRad = (angleDeg * Math.PI) / 180;
    const centerX =
      targetTransform.position.x + targetTransform.size.width * 0.5;
    const centerY =
      targetTransform.position.y + targetTransform.size.height * 0.5;
    return {
      x:
        centerX +
        Math.sin(angleRad) * orbit.radius.x -
        targetTransform.size.width / 2,
      y:
        centerY -
        Math.cos(angleRad) * orbit.radius.y -
        targetTransform.size.height / 2,
    };
  }
  private lerpPos(
    transform: SystemComponent<"Transform">,
    alpha: number,
  ): Position2D {
    return {
      x:
        transform.prevPosition.x +
        (transform.position.x - transform.prevPosition.x) * alpha,
      y:
        transform.prevPosition.y +
        (transform.position.y - transform.prevPosition.y) * alpha,
    };
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
  private getColliderRect(
    position: Position2D,
    size: Size2D,
    collider: SystemComponent<"Collider">,
  ): { position: Position2D; size: Size2D } {
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

      const colliderRect = this.getColliderRect(
        basePos,
        transform.size,
        collider,
      );

      const renderPos = this.getVisiblePosition(
        colliderRect.position,
        colliderRect.size,
        cameraPos,
        drawDistance,
      );
      if (!renderPos) return;

      const debugTint: RGBA = [0, 255, 0, 120];
      const z = sprite.layer + 0.001;

      if (collider.shape === "rect") {
        Draw.rect({
          position: { x: renderPos.x, y: renderPos.y, z },
          size: colliderRect.size,
          tint: debugTint,
        });
      } else {
        Draw.circle({
          position: { x: renderPos.x, y: renderPos.y, z },
          size: colliderRect.size,
          tint: debugTint,
        });
      }
    });
  }
}
