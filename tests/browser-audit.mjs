import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const port = process.env.CDP_PORT || "9333";
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
const screenshot = async name => {
  const result = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await fs.mkdir(".screenshots", { recursive: true });
  await fs.writeFile(path.join(".screenshots", `${name}.png`), Buffer.from(result.data, "base64"));
};

await call("Page.enable");
await call("Runtime.enable");
await call("Log.enable");
await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await call("Page.navigate", { url: `${pathToFileURL(path.resolve("index.html")).href}?autostart=1` });
await wait(900);

let state = await evaluate("window.__game.getState()");
assert(state.roomCount === 55, "Campaign room count mismatch");
await call("Input.dispatchKeyEvent", { type: "keyDown", code: "KeyI", key: "i" });
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
await screenshot("v4-item-codex");
await call("Input.dispatchKeyEvent", { type: "keyDown", code: "Escape", key: "Escape" });
await call("Input.dispatchKeyEvent", { type: "keyUp", code: "Escape", key: "Escape" });

await evaluate("window.__game.goToRoom(3); window.__game.giveItem('goldCoin')");
await wait(120);
state = await evaluate("window.__game.getState()");
const offer = state.shopOffers.find(candidate => candidate.affordable);
assert(offer, "No affordable shop offer");
const scale = 1.5;
const offsetY = 45;
await call("Input.dispatchMouseEvent", { type: "mousePressed", x: offer.x * scale, y: offer.y * scale + offsetY, button: "left", buttons: 1, clickCount: 1 });
await call("Input.dispatchMouseEvent", { type: "mouseReleased", x: offer.x * scale, y: offer.y * scale + offsetY, button: "left", buttons: 0, clickCount: 1 });
await wait(120);
assert((await evaluate("window.__game.getState().shopPurchases")) === 1, "Real shop click failed");
await screenshot("v4-shop-details");

const bossRooms = [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54];
const bossAudit = [];
for (const room of bossRooms) {
  await evaluate(`window.__game.start(); for (let i = 0; i < 30; i += 1) window.__game.giveItem('shield'); window.__game.goToRoom(${room}); window.__game.setBossHealthRatio(.3)`);
  await wait(2300);
  state = await evaluate("window.__game.getState()");
  const bossType = state.enemyTypes.find(type => type.startsWith("boss"));
  assert(state.bossStage === 3, `Boss room ${room} did not reach stage three`);
  assert(state.bossMechanics[bossType] > 0, `Boss room ${room} behavior did not execute`);
  bossAudit.push({ room, bossType, hazards: state.hazards, bullets: state.enemyBullets, waves: state.bossWaves, lasers: state.bossLasers });
  if ([4, 24, 29, 39, 49, 54].includes(room)) await screenshot(`v4-boss-${room}`);
}

await evaluate("window.__game.start(); window.__game.goToRoom(44); window.__game.clearRoom()");
await wait(150);
state = await evaluate("window.__game.getState()");
assert(state.routeChoice?.join(",") === "cathedral,sheol", "Final route choice did not appear");
await screenshot("v4-ending-route");
await evaluate("window.__game.chooseRoute('sheol'); window.__game.goToRoom(49)");
state = await evaluate("window.__game.getState()");
assert(state.finalBranch === "sheol" && state.biome === "燃罪魔窟", "Final route was not applied");

await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await call("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 2 });
await call("Page.navigate", { url: `${pathToFileURL(path.resolve("index.html")).href}?autostart=1` });
await wait(650);
const mobileBefore = await evaluate("window.__game.getState()");
const mobileControls = await evaluate(`(() => {
  const stick = document.querySelector('#stick-zone').getBoundingClientRect();
  const fire = document.querySelector('#fire-button').getBoundingClientRect();
  return { stick: { x: stick.x + stick.width / 2, y: stick.y + stick.height / 2 }, fire: { x: fire.x + fire.width / 2, y: fire.y + fire.height / 2 } };
})()`);
await call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: mobileControls.fire.x, y: mobileControls.fire.y, radiusX: 8, radiusY: 8 }] });
await wait(70);
const mobileFiring = await evaluate("window.__game.getState()");
await call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: mobileControls.stick.x, y: mobileControls.stick.y, radiusX: 8, radiusY: 8 }] });
await call("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: mobileControls.stick.x + 36, y: mobileControls.stick.y, radiusX: 8, radiusY: 8 }] });
await wait(450);
await call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
const mobileAfter = await evaluate("window.__game.getState()");
assert(mobileFiring.playerBullets > 0, "Mobile fire control failed");
assert(mobileAfter.player.x > mobileBefore.player.x + 8, "Mobile joystick movement failed");
await evaluate("window.__game.toggleGuide(true)");
await wait(80);
assert(await evaluate("document.querySelector('#guide-panel').classList.contains('visible')"), "Mobile item codex did not open");
await screenshot("v4-mobile-codex");

assert(browserErrors.length === 0, `Browser errors: ${browserErrors.join(" | ")}`);
console.log(JSON.stringify({ itemCodex: guide.cards, shopPurchase: "passed", bosses: bossAudit, finalBranch: state.finalBranch, mobileMovement: mobileAfter.player.x - mobileBefore.player.x, mobileFire: "passed", browserErrors: browserErrors.length }, null, 2));
socket.close();
