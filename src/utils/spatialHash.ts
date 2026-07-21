import { SystemComponent } from "@/core/dogma/system";

interface SpacialConfig {
  //   drawOrigin: "topLeft" | "center";
  cellSize: number;
}
interface HashEntry {
  position: Position2D;
  size: Size2D;
  ID: Symbol;
}
export default class SpatialHash {
  private grid: Map<number, Symbol[]> = new Map();
  //   private drawOrigin: SpacialConfig["drawOrigin"];
  private cellSize: SpacialConfig["cellSize"];
  constructor(props: SpacialConfig) {
    // this.drawOrigin = props.drawOrigin;
    this.cellSize = props.cellSize;
  }
  public addToGrid({ position, size, ID }: HashEntry) {
    const minX = Math.floor(position.x / this.cellSize);
    const minY = Math.floor(position.y / this.cellSize);
    const maxX = Math.floor((position.x + size.width) / this.cellSize);
    const maxY = Math.floor((position.y + size.height) / this.cellSize);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = (x << 16) | (y & 0xffff);
        if (!this.grid.has(key)) this.grid.set(key, []);
        this.grid.get(key)!.push(ID);
      }
    }
  }

  public getCollisionsBroad({ position, size, ID }: HashEntry) {
    const minX = Math.floor(position.x / this.cellSize);
    const minY = Math.floor(position.y / this.cellSize);
    const maxX = Math.floor((position.x + size.width) / this.cellSize);
    const maxY = Math.floor((position.y + size.height) / this.cellSize);
    const candidates = new Set<Symbol>();
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = (x << 16) | (y & 0xffff);
        const cell = this.grid.get(key);
        if (!cell) continue;
        cell.forEach((otherID) => {
          if (otherID !== ID) candidates.add(otherID);
        });
      }
    }
    return candidates;
  }
  public clearGrid() {
    this.grid.clear();
  }
}
