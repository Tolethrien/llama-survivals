import Vec2 from "@/core/axiom/vec2";
import { SystemComponent } from "@dogma/system";
export function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) throw new Error(msg ?? "Assertion Failed");
}
export function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const image = new Image();
    image.src = src;
    image.onload = () => res(image);
    image.onerror = () => rej(`image with src: ${src} couldn't be loaded`);
  });
}
export function createUUID() {
  return crypto.randomUUID();
}
export function deepMerge<T extends object>(
  target: T,
  source: DeepPartial<T>,
): T {
  const output = { ...target } as T;

  if (
    target &&
    typeof target === "object" &&
    source &&
    typeof source === "object"
  ) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key as keyof DeepPartial<T>];
        const targetValue = target[key as keyof T];

        if (
          sourceValue &&
          typeof sourceValue === "object" &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === "object" &&
          !Array.isArray(targetValue)
        ) {
          (output as any)[key] = deepMerge(
            targetValue as object,
            sourceValue as object,
          );
        } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
          (output as any)[key] = sourceValue;
        } else {
          (output as any)[key] = sourceValue;
        }
      }
    }
  }
  return output;
}
export function flatObjectToValues(obj: Object) {
  let values: number[] = [];

  for (const key of Object.keys(obj)) {
    const value = (obj as any)[key];
    if (Array.isArray(value)) {
      values = values.concat(value);
    } else if (typeof value === "object" && value !== null) {
      values = values.concat(flatObjectToValues(value));
    } else {
      values.push(value);
    }
  }
  return values;
}
export function createBoxFromTransform({
  position,
  size,
}: SystemComponent<"Transform">): Box {
  return {
    x: position.x,
    y: position.y,
    w: size.width,
    h: size.height,
  };
}

export function createColliderBox(
  { position, size }: SystemComponent<"Transform">,
  collider: SystemComponent<"Collider">,
): Box {
  const colliderWidth = size.width + collider.sizeOffset.width;
  const colliderHeight = size.height + collider.sizeOffset.height;
  return {
    x: position.x + size.width / 2 + collider.posOffset.x - colliderWidth / 2,
    y: position.y + size.height / 2 + collider.posOffset.y - colliderHeight / 2,
    w: colliderWidth,
    h: colliderHeight,
  };
}
export function createColliderShape(
  { position, size }: { position: Position2D; size: Size2D },
  collider: SystemComponent<"Collider">,
): Rect | Circle {
  const w = size.width + collider.sizeOffset.width;
  const h = size.height + collider.sizeOffset.height;
  const centerX = position.x + size.width / 2 + collider.posOffset.x;
  const centerY = position.y + size.height / 2 + collider.posOffset.y;

  if (collider.shape === "circle") {
    return { x: centerX, y: centerY, r: w / 2 }; // świadomie: promień = width, height ignorowany
  }
  return { x: centerX, y: centerY, w, h, rotation: 0 };
}
export function getOrbitPosition(
  orbit: SystemComponent<"Orbit">,
  targetTransform: SystemComponent<"Transform">,
  angleDeg: number,
): Position2D {
  const angleRad = (angleDeg * Math.PI) / 180;
  const centerX = targetTransform.position.x + targetTransform.size.width * 0.5;
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
export function getColliderCenter(
  { position, size }: { position: Position2D; size: Size2D },
  collider: SystemComponent<"Collider">,
): Vec2 {
  return Vec2.create(
    position.x + size.width / 2 + collider.posOffset.x,
    position.y + size.height / 2 + collider.posOffset.y,
  );
}
export function get8DirFromPosDiff(pos: Position2D) {
  const angle = Math.atan2(pos.y, pos.x);
  const octant = Math.round(angle / (Math.PI / 4));
  const dirX = Math.round(Math.cos((octant * Math.PI) / 4));
  const dirY = Math.round(Math.sin((octant * Math.PI) / 4));
  return { x: dirX, y: dirY };
}
