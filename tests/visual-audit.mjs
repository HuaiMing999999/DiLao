import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const port = process.env.CDP_PORT || "9333";
const auditUrl = process.env.AUDIT_URL || pathToFileURL(path.resolve("index.html")).href;
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
const screenshot = async name => {
  const result = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await fs.mkdir(".screenshots", { recursive: true });
  await fs.writeFile(path.join(".screenshots", `${name}.png`), Buffer.from(result.data, "base64"));
};

await call("Page.enable");
await call("Runtime.enable");
await call("Log.enable");
await call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await call("Page.navigate", { url: `${auditUrl}?autostart=1` });
for (let retry = 0; retry < 40 && !(await evaluate("Boolean(window.__game)").catch(() => false)); retry += 1) await wait(100);

const heroes = ["breaker", "gambler", "seer", "titan"];
for (const hero of heroes) {
  await evaluate(`window.__game.showcaseHero('${hero}')`);
  await wait(120);
  await screenshot(`v9-hero-${hero}`);
}

const enemies = ["grunt", "turret", "charger", "bat", "splitter", "leech", "cultist", "bomber"];
for (const enemy of enemies) {
  await evaluate(`window.__game.start(); window.__game.showcaseEnemy('${enemy}')`);
  await wait(120);
  await screenshot(`v9-enemy-${enemy}`);
}

const bossTypes = Object.keys(await evaluate("window.__game.getState().bossFormCatalog"));
for (const boss of bossTypes) {
  for (let stage = 1; stage <= 3; stage += 1) {
    await evaluate(`window.__game.start(); window.__game.showcaseEnemy('${boss}', ${stage})`);
    await wait(120);
    const state = await evaluate("window.__game.getState()");
    const activeBoss = state.enemies[0];
    if (activeBoss.bossForm !== state.bossFormCatalog[boss][stage - 1]) throw new Error(`${boss} stage ${stage} form mismatch`);
    await screenshot(`v9-showcase-${boss}-stage${stage}`);
  }
}

if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join(" | ")}`);
console.log(JSON.stringify({ heroes: heroes.length, enemies: enemies.length, bossForms: bossTypes.length * 3, browserErrors: browserErrors.length }, null, 2));
socket.close();
