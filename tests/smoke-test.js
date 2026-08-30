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
step(5);
assert(game.getState().skillCooldown > 0, "Hero active skill failed");

const startX = state.player.x;
documentEvents.keydown[0]({ code: "KeyD", key: "d", repeat: false, preventDefault() {} });
step(1);
const acceleratingSpeed = game.getState().player.speed;
assert(acceleratingSpeed > 0 && acceleratingSpeed < game.getState().stats.speed, "Movement acceleration failed");
step(25);
documentEvents.keyup[0]({ code: "KeyD", key: "d" });
assert(game.getState().player.x > startX + 40, "Keyboard movement failed");
const releaseSpeed = game.getState().player.speed;
step(8);
assert(game.getState().player.speed < releaseSpeed * .2, "Movement deceleration failed");

documentEvents.keydown[0]({ code: "ArrowRight", key: "ArrowRight", repeat: false, preventDefault() {} });
step(2);
assert(Math.abs(game.getState().player.aimAngle) < .01, "Independent aiming failed");
assert(game.getState().feedback.particles > 0, "Muzzle feedback failed");
step(10);
documentEvents.keyup[0]({ code: "ArrowRight", key: "ArrowRight" });
assert(game.getState().playerBullets > 0, "Keyboard shooting failed");

game.goToRoom(game.getState().roomKinds.indexOf("elite"));
step(2);
state = game.getState();
assert(Object.keys(state.eliteAffixes).length >= 2, "Elite affix variety failed");
assert(state.enemies.some(enemy => enemy.affix === "warded" && enemy.shield > 0), "Warded elite failed");

game.goToRoom(6);
for (let index = 0; index < 5; index += 1) game.giveItem("shield");
step(100);
assert(game.getState().summonedEnemies > 0, "Cultist summoning role failed");

game.goToRoom(12);
step(175);
assert(game.getState().hazards > 0, "Bomber control hazard failed");

game.start();
step();
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
assert(game.getState().itemCatalogSize === 36, "Expanded item pool failed");
game.giveItem("serratedCrown");
game.giveItem("serratedCrown");
documentEvents.keydown[0]({ code: "ArrowRight", key: "ArrowRight", repeat: false, preventDefault() {} });
step(1);
documentEvents.keyup[0]({ code: "ArrowRight", key: "ArrowRight" });
assert(game.getState().stats.weapon === "cleaver" && game.getState().stats.weaponLevel === 2 && game.getState().slashes > 0, "Melee weapon evolution failed");

game.start();
step();
game.giveItem("witchLantern");
documentEvents.keydown[0]({ code: "ArrowRight", key: "ArrowRight", repeat: false, preventDefault() {} });
step(1);
documentEvents.keyup[0]({ code: "ArrowRight", key: "ArrowRight" });
assert(game.getState().stats.weapon === "wisp" && game.getState().playerBullets >= 2, "Summon weapon core failed");

game.start();
step();
game.giveItem("scatterHeart");
game.giveItem("emberFlask");
game.giveItem("frostRune");
game.giveItem("venomCoin");
game.giveItem("barbedHook");
game.giveItem("stormCoil");
documentEvents.keydown[0]({ code: "ArrowRight", key: "ArrowRight", repeat: false, preventDefault() {} });
step(1);
documentEvents.keyup[0]({ code: "ArrowRight", key: "ArrowRight" });
state = game.getState();
assert(state.stats.weapon === "scatter" && state.playerBullets >= 3, "Scatter weapon core failed");
assert(Object.values(state.stats.statusChances).every(chance => chance > 0), "Status build upgrades failed");
game.inflictStatus("freeze");
assert(game.getState().enemies[0].statuses.freeze > 0, "Status application failed");

game.start();
step();
game.goToRoom(2);
game.collectPickups();
step(2);
assert(game.getState().routeChoice.join(",") === "safe,risk", "Route choice did not open after treasure");
game.chooseRoute("safe");
assert(game.getState().roomKinds[3] === "sanctuary" && game.getState().doorOpen, "Safe route failed");

game.start();
step();
game.goToRoom(2);
game.collectPickups();
step(2);
game.chooseRoute("risk");
state = game.getState();
assert(state.roomKinds[3] === "elite" && state.roomModifier === null && state.routeChoices === 1, "Risk route selection failed");
game.exitRoom();
step(3);
state = game.getState();
assert(state.roomType === "elite" && state.roomModifier === "cursed", "Risk route encounter failed");

for (const bossRoom of [5, 11, 17]) {
  game.start();
  step();
  for (let index = 0; index < 20; index += 1) game.giveItem("shield");
  game.goToRoom(bossRoom);
  step(2);
  game.setBossHealthRatio(.6);
  step(2);
  assert(game.getState().bossStage === 2, `Boss ${bossRoom} did not enter stage 2`);
  step(60);
  game.setBossHealthRatio(.3);
  step(2);
  assert(game.getState().bossStage === 3, `Boss ${bossRoom} did not enter stage 3`);
  if (bossRoom === 11) {
    step(80);
    assert(game.getState().arenaInset > 0, "Warden arena contraction failed");
  }
  if (bossRoom === 17) {
    step(220);
    assert(game.getState().bossWaves > 0, "Heart shockwave phase failed");
  }
}

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
assert(state.meta.bossDefeats >= 3 && state.meta.wins >= 1, "Meta progression was not recorded");

game.selectWeapon("cleaver");
game.start();
step();
assert(game.getState().stats.weapon === "cleaver", "Unlocked starting weapon selection failed");

game.start();
step();
game.hurt(99);
step();
assert(game.getState().outcome === "defeat", "Death flow failed");
assert(game.getState().runStats.damageTaken >= 99, "Run damage statistics failed");

console.log(JSON.stringify({
  levels: 18,
  chapters: 3,
  bosses: 3,
  enemyTypes: 8,
  items: 36,
  heroes: 4,
  buildSynergies: 8,
  activeSkills: "passed",
  interactiveObstacles: "passed",
  treasureChoices: 3,
  shops: 3,
  keyboardMovement: "passed",
  keyboardShooting: "passed",
  eliteAffixes: "passed",
  summonerRole: "passed",
  controlHazards: "passed",
  weaponCores: 3,
  statusEffects: 5,
  routeChoices: "passed",
  threeStageBosses: "passed",
  metaProgression: "passed",
  runStatistics: "passed",
  itemEffects: "passed",
  completeCampaign: "passed",
  deathFlow: "passed"
}, null, 2));
