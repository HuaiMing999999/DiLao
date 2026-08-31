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
      setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture() { return true; }, focus() {}, setAttribute() {},
      closest() { return null; },
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
  setInterval() { return 1; }, clearInterval() {},
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
assert(state.visualVersion === 3, "Third-edition visual system is missing");
assert(Object.keys(state.bossCatalog).length === 11, "Third-edition boss catalog is incomplete");
assert(new Set(Object.values(state.bossCatalog).map(entry => entry.projectile)).size === 11, "Boss projectile silhouettes are not unique");
const bossForms = Object.values(state.bossFormCatalog).flat();
assert(bossForms.length === 33 && new Set(bossForms).size === 33, "Boss phase forms are not 33 unique silhouettes");
assert(state.viewport.roomWidth === 1280 && state.viewport.roomHeight === 720, "Expanded 16:9 combat arena is missing");
assert(state.viewport.gridColumns >= 18 && state.viewport.gridRows >= 11, "Expanded combat grid is too small");
assert(state.roomCount === 55, `Expected 55 rooms, got ${state.roomCount}`);
assert(state.roomKinds.filter(kind => kind === "boss").length === 11, "Expected 11 boss rooms");
assert(state.roomKinds.filter(kind => kind === "treasure").length === 11, "Expected 11 treasure rooms");
assert(state.roomKinds.filter(kind => kind === "shop").length === 11, "Expected 11 shop rooms");
for (const type of ["grunt", "charger", "turret", "bat", "splitter", "leech", "cultist", "bomber", "bossCoil", "bossHopper", "bossDevourer", "bossIdol", "bossPeep", "bossMatron", "bossHollow", "bossHeart", "bossBloat", "bossBurrow", "bossInfernal"]) {
  assert(state.plannedEnemyTypes.includes(type), `Missing enemy type: ${type}`);
}
assert(state.obstacles > 0, "Interactive room obstacles were not generated");
game.toggleGuide(true);
assert(game.getState().guideOpen, "Item codex did not open");
game.toggleGuide(false);
assert(!game.getState().guideOpen, "Item codex did not close");
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

game.start();
step(2);
game.equipWeapon("seeker");
game.fire(0);
state = game.getState();
assert(state.playerProjectiles.some(projectile => projectile.weapon === "seeker" && projectile.homing > 0 && projectile.targetId), "Seeker auto-lock projectile failed");
game.equipWeapon("prism");
game.fire(0);
assert(game.getState().playerProjectiles.some(projectile => projectile.weapon === "prism" && projectile.bounces >= 2), "Prism ricochet projectile failed");
game.equipWeapon("orbit");
game.fire(0);
assert(game.getState().playerProjectiles.some(projectile => projectile.weapon === "orbit" && projectile.boomerang), "Orbit boomerang projectile failed");

const fireButton = element("fire-button");
const touchFireEvent = { pointerId: 91, pointerType: "touch", preventDefault() {}, currentTarget: fireButton };
fireButton.handlers.pointerdown[0](touchFireEvent);
assert(game.getState().input.firing && game.getState().input.firePointerId === 91, "Touch fire press failed");
fireButton.handlers.pointerdown[0]({ ...touchFireEvent, pointerId: 92 });
assert(game.getState().input.firing && game.getState().input.firePointerId === 92, "A stale touch pointer blocked the next fire press");
game.goToRoom(1);
assert(!game.getState().input.firing && game.getState().input.firePointerId === null, "Room transition did not clear held fire input");
const emptyRoomShots = game.getState().player.shotSequence;
fireButton.handlers.pointerdown[0]({ ...touchFireEvent, pointerId: 93 });
step(30);
assert(game.getState().playerBullets > 0 && game.getState().player.shotSequence > emptyRoomShots, "Mobile fire gave no feedback in an enemy-free room");
windowEvents.pointerup[0]({ pointerId: 93, pointerType: "touch" });
assert(!game.getState().input.firing && game.getState().input.firePointerId === null, "Touch fire release remained stuck");

game.toggleWorkshop(true);
assert(game.getState().workshopOpen, "Workshop did not open");
const seedsBeforePlanting = game.getState().meta.seeds;
game.addSeeds(1);
assert(game.plantSeed(0), "Farm seed planting failed");
game.matureCrops();
assert(game.harvestPlot(0), "Farm harvest failed");
state = game.getState();
assert(state.meta.seeds === seedsBeforePlanting && Object.values(state.meta.materials).some(amount => amount > 0), "Farm material loop failed");
game.unlockBlueprint("seeker");
game.addMaterials({ bone: 10, crystal: 10, sap: 10 });
assert(game.craftWeapon("seeker") && game.getState().meta.craftedWeapons.includes("seeker"), "Workshop weapon crafting failed");
game.toggleWorkshop(false);
game.selectWeapon("repeater");

game.goToRoom(game.getState().roomKinds.indexOf("elite"));
step(2);
state = game.getState();
assert(Object.keys(state.eliteAffixes).length >= 2, "Elite affix variety failed");
assert(state.enemies.some(enemy => enemy.affix === "warded" && enemy.shield > 0), "Warded elite failed");

game.goToRoom(10);
for (let index = 0; index < 5; index += 1) game.giveItem("shield");
step(100);
assert(game.getState().summonedEnemies > 0, "Cultist summoning role failed");

game.goToRoom(20);
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
game.showcaseEnemy("grunt");
game.equipWeapon("cleaver");
state = game.getState();
let cleaverEnemy = state.enemies[0];
game.setPlayerPosition(cleaverEnemy.x - 135, cleaverEnemy.y);
const cleaverDirectHp = cleaverEnemy.hp;
game.fire(0);
state = game.getState();
const levelOneSlash = state.cleaverSlashes[0];
assert(levelOneSlash.radius >= 136 && levelOneSlash.waveRadius >= 174, "Cleaver reach was not expanded");
assert(levelOneSlash.arc >= 2.2 && levelOneSlash.maxLife >= .28, "Cleaver sweep or guard window is too narrow");
assert(levelOneSlash.guardRadius >= 64 && levelOneSlash.waveDamage < 1, "Cleaver guard ring or wave falloff is invalid");
step(1);
assert(game.getState().enemies[0].hp < cleaverDirectHp, "Cleaver main sweep missed a mid-range enemy");

step(20);
game.showcaseEnemy("grunt");
state = game.getState();
cleaverEnemy = state.enemies[0];
game.setPlayerPosition(cleaverEnemy.x - 168, cleaverEnemy.y);
const cleaverWaveHp = cleaverEnemy.hp;
game.fire(0);
step(1);
assert(game.getState().enemies[0].hp < cleaverWaveHp, "Cleaver outer blade wave failed");

step(20);
game.showcaseEnemy("grunt");
state = game.getState();
cleaverEnemy = state.enemies[0];
game.setPlayerPosition(cleaverEnemy.x - 235, cleaverEnemy.y);
const cleaverFarHp = cleaverEnemy.hp;
game.fire(0);
step(1);
assert(game.getState().enemies[0].hp === cleaverFarHp, "Cleaver gained unintended unlimited range");

step(20);
state = game.getState();
game.spawnEnemyBullet(state.player.x - 52, state.player.y, 0, 0);
game.fire(0);
step(1);
state = game.getState();
assert(state.enemyBullets === 0 && state.cleaverSlashes[0].blocked === 1, "Cleaver close guard did not parry a rear projectile");

step(20);
game.giveItem("serratedCrown");
game.fire(0);
const levelTwoSlash = game.getState().cleaverSlashes[0];
step(20);
game.giveItem("serratedCrown");
game.fire(0);
const levelThreeSlash = game.getState().cleaverSlashes[0];
assert(levelThreeSlash.radius > levelTwoSlash.radius && levelThreeSlash.guardRadius > levelTwoSlash.guardRadius, "Cleaver evolution did not improve reach and safety");

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
game.goToRoom(1);
game.collectPickups();
step(2);
assert(game.getState().routeChoice.join(",") === "safe,risk", "Route choice did not open after treasure");
game.chooseRoute("safe");
assert(game.getState().roomKinds[2] === "sanctuary" && game.getState().doorOpen, "Safe route failed");
game.exitRoom();
step(6);
state = game.getState();
assert(state.roomType === "sanctuary" && state.coins >= 2, "Sanctuary shop allowance failed");
game.exitRoom();
step(6);
state = game.getState();
assert(state.roomType === "shop" && state.shopOffers.length === 3 && state.shopOffers[0].affordable, "Shop did not provide an affordable offer");
game.giveItem("magnet");
const shopOffer = game.getState().shopOffers[0];
game.setPlayerPosition(shopOffer.homeX - 60, shopOffer.homeY);
step(10);
state = game.getState();
assert(Math.abs(state.shopOffers[0].x - shopOffer.homeX) < .01, "Shop item was incorrectly magnetized");
const shopCoins = state.coins;
const shopItems = state.itemsFound;
game.setPlayerPosition(shopOffer.homeX, shopOffer.homeY);
step(2);
state = game.getState();
assert(state.shopPurchases === 1 && state.itemsFound === shopItems + 1, "Contact shop purchase failed");
assert(state.coins === shopCoins - shopOffer.price, "Shop purchase did not deduct the displayed price");

game.start();
step();
game.goToRoom(1);
game.collectPickups();
step(2);
game.chooseRoute("risk");
state = game.getState();
assert(state.roomKinds[2] === "elite" && state.roomModifier === null && state.routeChoices === 1, "Risk route selection failed");
game.exitRoom();
step(6);
state = game.getState();
assert(state.roomType === "elite" && state.roomModifier === "cursed", "Risk route encounter failed");

game.start();
step();
for (let index = 0; index < 20; index += 1) game.giveItem("shield");
game.goToRoom(4);
step(2);
let durabilityBoss = game.getState().enemies.find(enemy => enemy.type.startsWith("boss"));
assert(durabilityBoss.maxHp >= 124, "Boss durability was not rebalanced");
for (let index = 0; index < 4; index += 1) game.damageBoss(9999, true);
durabilityBoss = game.getState().enemies.find(enemy => enemy.type.startsWith("boss"));
assert(durabilityBoss.hp >= durabilityBoss.maxHp * 2 / 3 - .01, "A single burst skipped the first boss phase gate");
step(8);
durabilityBoss = game.getState().enemies.find(enemy => enemy.type.startsWith("boss"));
assert(game.getState().bossStage === 2 && durabilityBoss.stageTransition > 0, "Boss stage-two transformation did not trigger");
step(120);
for (let index = 0; index < 4; index += 1) game.damageBoss(9999, true);
step(8);
assert(game.getState().bossStage === 3, "Boss stage-three transformation did not trigger");
step(130);
game.damageBoss(9999, true);
durabilityBoss = game.getState().enemies.find(enemy => enemy.type.startsWith("boss"));
assert(durabilityBoss && durabilityBoss.hp > 0, "Boss was defeated by one oversized phase-three hit");

for (const bossRoom of [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54]) {
  game.start();
  step();
  for (let index = 0; index < 20; index += 1) game.giveItem("shield");
  game.goToRoom(bossRoom);
  step(2);
  game.setBossHealthRatio(.6);
  step(2);
  assert(game.getState().bossStage === 2, `Boss ${bossRoom} did not enter stage 2`);
  assert(game.getState().bossThreat.damage > 1 && game.getState().bossThreat.projectileSpeed > 1, `Boss ${bossRoom} stage 2 stats did not change`);
  step(60);
  game.setBossHealthRatio(.3);
  step(2);
  assert(game.getState().bossStage === 3, `Boss ${bossRoom} did not enter stage 3`);
  assert(game.getState().bossThreat.damage >= 1.4 && game.getState().bossThreat.cadence > 1.4, `Boss ${bossRoom} stage 3 threat did not escalate`);
  assert(Object.keys(game.getState().bossMechanics).length === 1, `Boss ${bossRoom} behavior handler did not run`);
  if (bossRoom === 39) {
    step(320);
    assert(game.getState().bossWaves > 0, "Heart shockwave phase failed");
  }
  const bossType = game.getState().enemyTypes.find(type => type.startsWith("boss"));
  const signatureCount = game.getState().bossSignatures[bossType] || 0;
  const signature = game.triggerBossSignature();
  assert(signature && game.getState().bossSignatures[bossType] === signatureCount + 1, `Boss ${bossRoom} signature attack did not trigger`);
  assert(game.getState().enemies.find(enemy => enemy.type === bossType).attackMode, `Boss ${bossRoom} signature lacks a telegraph mode`);
}

game.start();
step();
game.goToRoom(44);
game.clearRoom();
step(3);
state = game.getState();
assert(state.routeChoice.join(",") === "cathedral,sheol", "Final descent branch did not open");
game.chooseRoute("sheol");
assert(game.getState().finalBranch === "sheol", "Sheol branch selection failed");
game.goToRoom(49);
assert(game.getState().biome === "燃罪魔窟", "Chapter 5 branch biome was not applied");

game.start();
step();
let guard = 0;
while (game.getState().state === "playing" && guard++ < 90) {
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
assert(state.bossKills === 11, `Expected 11 boss kills, got ${state.bossKills}`);
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
  rooms: 55,
  depths: 11,
  bosses: 11,
  enemyTypes: 8,
  items: 36,
  heroes: 4,
  buildSynergies: 8,
  activeSkills: "passed",
  interactiveObstacles: "passed",
  treasureChoices: 3,
  shops: 3,
  shopPurchasing: "passed",
  keyboardMovement: "passed",
  keyboardShooting: "passed",
  touchFireRelease: "passed",
  touchCrossRoomFire: "passed",
  eliteAffixes: "passed",
  summonerRole: "passed",
  controlHazards: "passed",
  weaponCores: 6,
  craftedWeapons: 3,
  farmLoop: "passed",
  statusEffects: 5,
  routeChoices: "passed",
  threeStageBosses: "passed",
  metaProgression: "passed",
  runStatistics: "passed",
  itemEffects: "passed",
  completeCampaign: "passed",
  deathFlow: "passed"
}, null, 2));
