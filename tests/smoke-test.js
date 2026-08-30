const fs = require("fs");
const vm = require("vm");

const elements = new Map();
const documentEvents = {};
const windowEvents = {};
const frames = [];

function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      style: {}, innerHTML: "", textContent: "", handlers: {},
      classList: { add() {}, remove() {} },
      addEventListener(type, callback) { (this.handlers[type] ||= []).push(callback); },
      setPointerCapture() {}, hasPointerCapture() { return true; }, focus() {},
      getBoundingClientRect() { return { left: 30, top: 390, width: 118, height: 118 }; }
    });
  }
  return elements.get(id);
}

const gradient = { addColorStop() {} };
const drawingContext = new Proxy({}, {
  get(target, key) {
    if (!(key in target)) target[key] = key === "createLinearGradient" || key === "createRadialGradient" ? () => gradient : () => {};
    return target[key];
  },
  set(target, key, value) { target[key] = value; return true; }
});

element("game").getContext = () => drawingContext;
const documentMock = {
  hidden: false,
  querySelector(selector) { return element(selector.slice(1)); },
  querySelectorAll(selector) {
    if (selector !== ".hero-card") return [];
    return ["breaker", "gambler", "seer", "titan"].map(id => {
      const card = element(`hero-${id}`);
      card.dataset = { hero: id };
      return card;
    });
  },
  addEventListener(type, callback) { (documentEvents[type] ||= []).push(callback); }
};
const windowMock = {
  innerWidth: 960, innerHeight: 540, devicePixelRatio: 1,
  location: { search: "" },
  addEventListener(type, callback) { (windowEvents[type] ||= []).push(callback); }
};

vm.runInNewContext(fs.readFileSync("game.js", "utf8"), {
  window: windowMock, document: documentMock, console, Math, setTimeout, clearTimeout,
  requestAnimationFrame(callback) { frames.push(callback); }
}, { filename: "game.js" });

let time = 0;
function step(count = 1) {
  while (count-- > 0) {
    time += 16.667;
    frames.splice(0).forEach(callback => callback(time));
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const game = windowMock.__game;
game.selectHero("seer");
game.start();
step(2);

let state = game.getState();
assert(state.hero === "seer", "Hero selection failed");
assert(state.roomCount === 18, `Expected 18 levels, got ${state.roomCount}`);
assert(state.roomKinds.filter(kind => kind === "boss").length === 3, "Expected 3 boss rooms");
assert(state.roomKinds.filter(kind => kind === "treasure").length === 3, "Expected 3 treasure rooms");
assert(state.roomKinds.filter(kind => kind === "shop").length === 3, "Expected 3 shop rooms");
for (const type of ["grunt", "charger", "turret", "bat", "splitter", "leech", "cultist", "bomber", "bossBrood", "bossWarden", "bossHeart"]) {
  assert(state.plannedEnemyTypes.includes(type), `Missing enemy type: ${type}`);
}
assert(state.obstacles > 0, "Interactive room obstacles were not generated");
game.useSkill();
step(2);
assert(game.getState().skillCooldown > 0, "Hero active skill failed");

const startX = state.player.x;
documentEvents.keydown[0]({ code: "KeyD", key: "d", repeat: false, preventDefault() {} });
step(25);
documentEvents.keyup[0]({ code: "KeyD", key: "d" });
assert(game.getState().player.x > startX + 40, "Keyboard movement failed");

documentEvents.keydown[0]({ code: "ArrowRight", key: "ArrowRight", repeat: false, preventDefault() {} });
step(12);
documentEvents.keyup[0]({ code: "ArrowRight", key: "ArrowRight" });
assert(game.getState().playerBullets > 0, "Keyboard shooting failed");

for (const id of ["powder", "barrel", "split", "voidOrb", "boneBell", "hammer", "gear", "magnet", "goldCoin", "refreshToken", "luckyDie", "crownGear", "lens", "needle", "halo", "spellbook", "bloodKey", "moonSigil", "boots", "heart", "cloak", "candle", "shield", "titanSkull"]) game.giveItem(id);
state = game.getState();
assert(state.itemsFound === 24, "Not all items were granted");
assert(Object.keys(state.synergies).length === 8, "Build synergies failed");
assert(state.stats.damage > 4 && state.stats.shots === 2 && state.stats.pierce === 1, "Projectile modifiers failed");
assert(state.stats.armor >= 3 && state.stats.roomHeal === 2, "Defense items failed");
const hpBeforeShield = state.hp;
const armorBeforeShield = state.stats.armor;
game.hurt(1);
assert(game.getState().hp === hpBeforeShield && game.getState().stats.armor === armorBeforeShield - 1, "Shield failed");

game.start();
step();
let guard = 0;
while (game.getState().state === "playing" && guard++ < 40) {
  game.clearRoom();
  step(3);
  assert(game.getState().enemyBullets === 0, "Enemy bullets survived room clear");
  game.collectPickups();
  step(42);
  game.collectPickups();
  step(3);
  game.exitRoom();
  step(3);
}
state = game.getState();
assert(state.outcome === "victory", "Campaign did not reach victory");
assert(state.bossKills === 3, `Expected 3 boss kills, got ${state.bossKills}`);
assert(state.itemsFound >= 5, `Expected at least 5 guaranteed item rewards, got ${state.itemsFound}`);

game.start();
step();
game.hurt(99);
step();
assert(game.getState().outcome === "defeat", "Death flow failed");

console.log(JSON.stringify({
  levels: 18,
  chapters: 3,
  bosses: 3,
  enemyTypes: 8,
  items: 24,
  heroes: 4,
  buildSynergies: 8,
  activeSkills: "passed",
  interactiveObstacles: "passed",
  treasureChoices: 3,
  shops: 3,
  keyboardMovement: "passed",
  keyboardShooting: "passed",
  itemEffects: "passed",
  completeCampaign: "passed",
  deathFlow: "passed"
}, null, 2));
