import Engine from "@/core/engine/engine";
import BattleScene from "./scenes/battleScene";
import Renderer from "@/core/aurora/renderer/renderer";
import auroraConfig from "@/core/aurora/renderer/config";
import ground from "./assets/ground.png";
import mobs from "./assets/monsta.png";
import auras from "./assets/auras.png";
import spells from "./assets/spells.png";
import items from "./assets/items.png";
import foliage from "./assets/foliage.png";
import icons from "./assets/icons.png";
async function preload() {
  const aurora = auroraConfig({
    userTextures: [
      { name: "ground", url: ground },
      { name: "mobs", url: mobs },
      { name: "auras", url: auras },
      { name: "spells", url: spells },
      { name: "items", url: items },
      { name: "foliage", url: foliage },
      { name: "icons", url: icons },
    ],
    userFonts: [],
    feature: {
      bloom: false,
      lighting: false,
    },
    debugger: "none",
    camera: { builtInCameraInputs: false, speed: 15 },
    rendering: {
      sortOrder: "y",
      renderRes: "1920x1080", // must be in fullHD
      toneMapping: "none",
      drawOrigin: "topLeft", // don't work - must be like this
      canvasColor: [0, 0, 0, 255],
    },
  });
  await Renderer.initialize(aurora);
}
function setup() {
  new BattleScene();
}
Engine.initialize({ setup, preload });
