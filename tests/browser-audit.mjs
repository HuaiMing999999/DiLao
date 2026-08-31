import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const port = process.env.CDP_PORT || "9333";
const auditBaseUrl = process.env.AUDIT_URL || pathToFileURL(path.resolve("index.html")).href;
const targets = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
const page = targets.find(target => target.type === "page");
if (!page) throw new Error("No Chrome page target");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const browserErrors = [];
let sequence = 0;

socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails.text);
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") browserErrors.push(message.params.entry.text);
  if (!message.id || !pending.has(message.id)) return;
  const task = pending.get(message.id);
  pending.delete(message.id);
  message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function call(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const evaluate = async expression => {
  const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const waitForGame = async (timeout = 8000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate("Boolean(window.__game && window.__game.getState)").catch(() => false)) return;
    await wait(100);
  }
  throw new Error("Game runtime did not become ready");
};
const screenshot = async name => {
  const result = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await fs.mkdir(".screenshots", { recursive: true });
  await fs.writeFile(path.join(".screenshots", `${name}.png`), Buffer.from(result.data, "base64"));
};

await call("Page.enable");
await call("Runtime.enable");
await call("Log.enable");
await call("Page.bringToFront");
await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await call("Page.navigate", { url: auditBaseUrl });
await waitForGame();
const authorCredit = await evaluate(`({ text: document.querySelector('.author-credit').textContent, visible: getComputedStyle(document.querySelector('.author-credit')).display !== 'none' })`);
assert(authorCredit.visible && authorCredit.text.includes("彭铭旭") && authorCredit.text.includes("MINOS"), "Start-screen author credit is missing");
await screenshot("v6-start-author");
await call("Page.navigate", { url: `${auditBaseUrl}?autostart=1` });
await waitForGame();
await wait(350);
await call("Page.bringToFront");

let state = await evaluate("window.__game.getState()");
assert(state.roomCount === 55, "Campaign room count mismatch");
assert(Math.abs(state.viewport.scaleX - state.viewport.scaleY) < .001, "Desktop room aspect ratio changed unexpectedly");
await evaluate("document.querySelector('#game').focus()");
await call("Input.dispatchMouseEvent", { type: "mousePressed", x: 720, y: 450, button: "left", buttons: 1, clickCount: 1 });
await call("Input.dispatchMouseEvent", { type: "mouseReleased", x: 720, y: 450, button: "left", buttons: 0, clickCount: 1 });
await call("Input.dispatchKeyEvent", { type: "rawKeyDown", code: "KeyI", key: "i", windowsVirtualKeyCode: 73 });
await call("Input.dispatchKeyEvent", { type: "keyUp", code: "KeyI", key: "i" });
await wait(120);
state = await evaluate("window.__game.getState()");
assert(state.guideOpen, "Item codex did not open from keyboard");
const guide = await evaluate(`({
  cards: document.querySelectorAll('.guide-item').length,
  text: document.querySelector('#guide-summary').textContent,
  visible: document.querySelector('#guide-panel').classList.contains('visible')
})`);
assert(guide.visible && guide.cards === 36 && guide.text.includes("自动生效"), "Item codex content is incomplete");
const pausedAt = await evaluate("window.__game.getState().runStats.damageTaken + ':' + window.__game.getState().player.x");
await wait(300);
assert(await evaluate("window.__game.getState().runStats.damageTaken + ':' + window.__game.getState().player.x") === pausedAt, "Game did not pause while codex was open");
await screenshot("v5-item-codex");
await call("Input.dispatchKeyEvent", { type: "rawKeyDown", code: "Escape", key: "Escape", windowsVirtualKeyCode: 27 });
await call("Input.dispatchKeyEvent", { type: "keyUp", code: "Escape", key: "Escape" });

await evaluate("window.__game.addSeeds(2); window.__game.unlockBlueprint('seeker'); window.__game.addMaterials({ bone: 8, crystal: 8, sap: 8 }); window.__game.toggleWorkshop(true)");
await wait(120);
state = await evaluate("window.__game.getState()");
assert(state.workshopOpen, "Workshop did not open");
const workshop = await evaluate(`({ plots: document.querySelectorAll('.farm-plot').length, recipes: document.querySelectorAll('.forge-card').length, visible: document.querySelector('#workshop-panel').classList.contains('visible') })`);
assert(workshop.visible && workshop.plots === 3 && workshop.recipes === 3, "Workshop content is incomplete");
await screenshot("v5-workshop");
await evaluate("window.__game.plantSeed(0); window.__game.matureCrops(); window.__game.harvestPlot(0); window.__game.craftWeapon('seeker'); window.__game.toggleWorkshop(false)");
state = await evaluate("window.__game.getState()");
assert(state.meta.craftedWeapons.includes("seeker") && Object.values(state.meta.materials).some(amount => amount > 0), "Farm and crafting loop failed");

await evaluate("window.__game.start(); window.__game.equipWeapon('seeker')");
await wait(650);
await evaluate("window.__game.fire(0)");
state = await evaluate("window.__game.getState()");
assert(state.playerProjectiles.some(projectile => projectile.weapon === "seeker" && projectile.homing > 0 && projectile.targetId), "Seeker targeting failed");
await evaluate("window.__game.equipWeapon('prism'); window.__game.fire(0)");
state = await evaluate("window.__game.getState()");
assert(state.playerProjectiles.some(projectile => projectile.weapon === "prism" && projectile.bounces > 0), "Prism ricochet failed");
await evaluate("window.__game.equipWeapon('orbit'); window.__game.fire(0)");
state = await evaluate("window.__game.getState()");
assert(state.playerProjectiles.some(projectile => projectile.weapon === "orbit" && projectile.boomerang), "Orbit boomerang failed");
await screenshot("v5-crafted-weapons");

await evaluate("window.__game.start(); for (let i = 0; i < 8; i += 1) window.__game.giveItem('shield'); window.__game.goToRoom(4); window.__game.equipWeapon('seeker')");
await wait(450);
await call("Page.bringToFront");
await evaluate("document.querySelector('#game').focus()");
await call("Input.dispatchMouseEvent", { type: "mousePressed", x: 720, y: 450, button: "left", buttons: 1, clickCount: 1 });
await call("Input.dispatchMouseEvent", { type: "mouseReleased", x: 720, y: 450, button: "left", buttons: 0, clickCount: 1 });
const balanceBefore = await evaluate("window.__game.getState()");
const balanceBossBefore = balanceBefore.enemies.find(enemy => enemy.type.startsWith("boss"));
await call("Input.dispatchKeyEvent", { type: "rawKeyDown", code: "KeyD", key: "d", windowsVirtualKeyCode: 68 });
await call("Input.dispatchKeyEvent", { type: "rawKeyDown", code: "ArrowRight", key: "ArrowRight", windowsVirtualKeyCode: 39 });
await wait(4200);
await call("Input.dispatchKeyEvent", { type: "keyUp", code: "ArrowRight", key: "ArrowRight" });
await call("Input.dispatchKeyEvent", { type: "keyUp", code: "KeyD", key: "d" });
const balanceAfter = await evaluate("window.__game.getState()");
const balanceBossAfter = balanceAfter.enemies.find(enemy => enemy.type.startsWith("boss"));
assert(balanceBossAfter.hp < balanceBossBefore.hp - 6, "Real sustained fire did not damage the first boss");
assert(balanceBossAfter.hp > balanceBossAfter.maxHp * 2 / 3, "The first boss phase was skipped too quickly");
assert(balanceAfter.player.x > balanceBefore.player.x + 45, "Real movement input did not remain responsive during boss fire");
await screenshot("v8-real-boss-balance");

await evaluate("window.__game.goToRoom(3); window.__game.giveItem('goldCoin')");
await wait(120);
state = await evaluate("window.__game.getState()");
const offer = state.shopOffers.find(candidate => candidate.affordable);
assert(offer, "No affordable shop offer");
const offerScreenX = offer.x * state.viewport.scaleX + state.viewport.offsetX;
const offerScreenY = offer.y * state.viewport.scaleY + state.viewport.offsetY;
await call("Input.dispatchMouseEvent", { type: "mousePressed", x: offerScreenX, y: offerScreenY, button: "left", buttons: 1, clickCount: 1 });
await call("Input.dispatchMouseEvent", { type: "mouseReleased", x: offerScreenX, y: offerScreenY, button: "left", buttons: 0, clickCount: 1 });
await wait(120);
assert((await evaluate("window.__game.getState().shopPurchases")) === 1, "Real shop click failed");
await screenshot("v5-shop-details");

const bossRooms = [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54];
const bossAudit = [];
for (const room of bossRooms) {
  await evaluate(`window.__game.start(); window.__game.goToRoom(${room}); window.__game.setPlayerInvincible(120); window.__game.setBossHealthRatio(.6)`);
  await wait(1750);
  state = await evaluate("window.__game.getState()");
  const bossType = state.enemyTypes.find(type => type.startsWith("boss"));
  assert(state.bossStage === 2 && state.bossThreat.damage > 1, `Boss room ${room} stage two presentation failed`);
  await screenshot(`v8-boss-${room}-stage2`);
  await evaluate("window.__game.setBossHealthRatio(.3)");
  await wait(2300);
  state = await evaluate("window.__game.getState()");
  assert(state.bossStage === 3, `Boss room ${room} did not reach stage three`);
  assert(state.bossThreat.damage >= 1.4 && state.bossThreat.projectileSize > 1.3, `Boss room ${room} stage stats did not escalate`);
  assert(state.bossMechanics[bossType] > 0, `Boss room ${room} behavior did not execute`);
  const signature = await evaluate("window.__game.triggerBossSignature()");
  state = await evaluate("window.__game.getState()");
  const activeBoss = state.enemies.find(enemy => enemy.type === bossType);
  assert(signature && state.bossSignatures[bossType] > 0 && activeBoss.attackMode, `Boss room ${room} signature attack did not trigger`);
  await screenshot(`v8-boss-${room}-stage3-signature`);
  const resolutionCount = state.bossSignatureResolutions[bossType] || 0;
  await wait((activeBoss.telegraph + .1) * 1000);
  state = await evaluate("window.__game.getState()");
  const themedProjectiles = state.enemyProjectiles.filter(projectile => projectile.bossType === bossType);
  assert(state.bossSignatureResolutions[bossType] === resolutionCount + 1, `Boss room ${room} signature effect did not resolve`);
  assert(themedProjectiles.every(projectile => projectile.style === state.bossCatalog[bossType].projectile), `Boss room ${room} used another boss projectile style`);
  bossAudit.push({ room, bossType, signature, projectile: state.bossCatalog[bossType].projectile, effects: themedProjectiles.length, hazards: state.hazards, waves: state.bossWaves, lasers: state.bossLasers });
}

await evaluate("window.__game.start(); window.__game.goToRoom(44); window.__game.clearRoom()");
await wait(150);
state = await evaluate("window.__game.getState()");
assert(state.routeChoice?.join(",") === "cathedral,sheol", "Final route choice did not appear");
await screenshot("v5-ending-route");
await evaluate("window.__game.chooseRoute('sheol'); window.__game.goToRoom(49)");
state = await evaluate("window.__game.getState()");
assert(state.finalBranch === "sheol" && state.biome === "燃罪魔窟", "Final route was not applied");

await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await call("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 2 });
await call("Page.navigate", { url: `${auditBaseUrl}?autostart=1` });
await wait(650);
const mobileBefore = await evaluate("window.__game.getState()");
const oldMobileRoomHeight = 390 / 960 * 540;
assert(mobileBefore.viewport.roomDisplayHeight >= oldMobileRoomHeight * 1.9, "Portrait game window did not expand to roughly double height");
assert(mobileBefore.viewport.scaleY > mobileBefore.viewport.scaleX, "Portrait viewport did not use adaptive vertical scaling");
await screenshot("v6-mobile-expanded-game");
const mobileControls = await evaluate(`(() => {
  const stick = document.querySelector('#stick-zone').getBoundingClientRect();
  const fire = document.querySelector('#fire-button').getBoundingClientRect();
  return { stick: { x: stick.x + stick.width / 2, y: stick.y + stick.height / 2 }, fire: { x: fire.x + fire.width / 2, y: fire.y + fire.height / 2 } };
})()`);
await call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: mobileControls.fire.x, y: mobileControls.fire.y, radiusX: 8, radiusY: 8 }] });
await wait(70);
const mobileFiring = await evaluate("window.__game.getState()");
await call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(420);
const mobileReleased = await evaluate("window.__game.getState()");
await call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: mobileControls.fire.x, y: mobileControls.fire.y, radiusX: 8, radiusY: 8 }] });
await wait(80);
await evaluate("window.__game.goToRoom(1)");
await wait(120);
const mobileRoomTransition = await evaluate("window.__game.getState()");
assert(!mobileRoomTransition.input.firing && mobileRoomTransition.input.firePointerId === null, "Room transition retained a stale mobile fire pointer");
await call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
const treasureShotSequence = mobileRoomTransition.player.shotSequence;
await call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: mobileControls.fire.x, y: mobileControls.fire.y, radiusX: 8, radiusY: 8 }] });
await wait(480);
const mobileTreasureFire = await evaluate("window.__game.getState()");
assert(mobileTreasureFire.room === 1 && mobileTreasureFire.enemyCount === 0 && mobileTreasureFire.playerBullets > 0 && mobileTreasureFire.player.shotSequence > treasureShotSequence, "Mobile fire failed in the enemy-free second room");
await call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await evaluate("window.__game.goToRoom(2)");
await wait(120);
const combatShotSequence = await evaluate("window.__game.getState().player.shotSequence");
await call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: mobileControls.fire.x, y: mobileControls.fire.y, radiusX: 8, radiusY: 8 }] });
await wait(480);
const mobileThirdRoomFire = await evaluate("window.__game.getState()");
assert(mobileThirdRoomFire.room === 2 && mobileThirdRoomFire.playerBullets > 0 && mobileThirdRoomFire.player.shotSequence > combatShotSequence, "Mobile fire failed after entering the third room");
await call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: mobileControls.stick.x, y: mobileControls.stick.y, radiusX: 8, radiusY: 8 }] });
await call("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: mobileControls.stick.x + 36, y: mobileControls.stick.y, radiusX: 8, radiusY: 8 }] });
await wait(450);
await call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
const mobileAfter = await evaluate("window.__game.getState()");
assert(mobileFiring.playerBullets > 0, "Mobile fire control failed");
assert(!mobileReleased.input.firing && mobileReleased.input.firePointerId === null, "Mobile fire button remained stuck after touchend");
assert(mobileReleased.player.shotSequence === mobileFiring.player.shotSequence, "Mobile fire continued after release");
assert(mobileAfter.player.x > mobileBefore.player.x + 8, "Mobile joystick movement failed");
await evaluate("window.__game.toggleGuide(true)");
await wait(80);
assert(await evaluate("document.querySelector('#guide-panel').classList.contains('visible')"), "Mobile item codex did not open");
await screenshot("v5-mobile-codex");
await call("Page.navigate", { url: auditBaseUrl });
await wait(350);
assert(await evaluate("document.querySelector('.author-credit').textContent.includes('彭铭旭') && document.querySelector('.author-credit').textContent.includes('MINOS')"), "Mobile start-screen author credit is missing");
await screenshot("v6-mobile-start-author");

await call("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
await call("Page.navigate", { url: `${auditBaseUrl}?autostart=1` });
await wait(650);
const landscapeState = await evaluate("window.__game.getState()");
assert(landscapeState.viewport.landscape, "Mobile landscape mode was not detected");
assert(Math.abs(landscapeState.viewport.scaleX - landscapeState.viewport.scaleY) < .001, "Mobile landscape did not preserve 16:9 scaling");
assert(landscapeState.viewport.roomWidth === 1280 && landscapeState.viewport.roomHeight === 720, "Expanded mobile arena dimensions are incorrect");
assert(landscapeState.viewport.roomDisplayHeight >= 389, "Mobile landscape arena did not fill the available height");
await screenshot("v7-mobile-landscape-arena");

assert(browserErrors.length === 0, `Browser errors: ${browserErrors.join(" | ")}`);
console.log(JSON.stringify({ authorCredit: "passed", portraitRoomHeight: mobileBefore.viewport.roomDisplayHeight, landscapeArena: `${landscapeState.viewport.roomWidth}x${landscapeState.viewport.roomHeight}`, itemCodex: guide.cards, workshop, craftedWeapons: "passed", advancedProjectiles: "passed", realBossBalance: { damage: balanceBossBefore.hp - balanceBossAfter.hp, movement: balanceAfter.player.x - balanceBefore.player.x }, shopPurchase: "passed", bosses: bossAudit, finalBranch: state.finalBranch, mobileMovement: mobileAfter.player.x - mobileBefore.player.x, mobileFireRelease: "passed", mobileCrossRoomFire: "passed", browserErrors: browserErrors.length }, null, 2));
socket.close();
