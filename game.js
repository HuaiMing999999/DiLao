(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const context = canvas.getContext("2d");
  const startScreen = document.querySelector("#start-screen");
  const endScreen = document.querySelector("#end-screen");
  const touchUi = document.querySelector("#touch-ui");
  const ROOM_WIDTH = 960;
  const ROOM_HEIGHT = 540;
  const WALL = 44;
  const TAU = Math.PI * 2;
  const roomNames = [
    ["灰烬门厅", "铜锁走廊", "潮湿地窖", "蛾尘寝室"],
    ["失火书库", "碎骨工坊", "焦黑祭坛", "熔蜡回廊"],
    ["血肉深井", "旧王餐厅", "脉动甬道", "低语心室"]
  ];
  const chapters = [
    { name: "腐朽地窖", theme: 0, boss: "bossBrood", bossName: "腐巢母体" },
    { name: "焚毁墓穴", theme: 2, boss: "bossWarden", bossName: "黄铜狱卒" },
    { name: "血肉深井", theme: 3, boss: "bossHeart", bossName: "深渊之心" }
  ];
  const roomModifiers = {
    swarm: { name: "虫潮", color: "#9caf69" },
    frenzy: { name: "狂热", color: "#d36c55" },
    fortune: { name: "富矿", color: "#d9b455" },
    cursed: { name: "诅咒", color: "#9a78bd" }
  };
  const heroes = {
    breaker: { name: "爆破者", path: "摧毁流", tag: "destroy", skill: "爆裂震波", color: "#c75c45", apply: player => { player.damage = 1.25; player.fireRate = .24; player.skillDelay = 8; } },
    gambler: { name: "铸币客", path: "硬币流", tag: "coin", skill: "弹壳风暴", color: "#d4a44e", apply: player => { player.coins = 6; player.damage = .9; player.fireRate = .2; player.skillDelay = 6; } },
    seer: { name: "秘仪师", path: "咒文流", tag: "spell", skill: "连锁雷咒", color: "#8f76bd", apply: player => { player.damage = .9; player.fireRate = .18; player.critChance = .12; player.chain = 1; player.skillDelay = 7; } },
    titan: { name: "囚笼巨人", path: "泰坦流", tag: "titan", skill: "不屈怒吼", color: "#6f967b", apply: player => { player.hp = 10; player.maxHp = 10; player.damage = 1.3; player.speed = 190; player.bulletSize = 5; player.skillDelay = 10; } }
  };
  const items = [
    { id: "powder", tag: "destroy", name: "烈性火药", icon: "✹", detail: "攻击 +0.5", apply: player => { player.damage += .5; } },
    { id: "barrel", tag: "destroy", name: "加长枪管", icon: "➶", detail: "射程 +18%", apply: player => { player.bulletLife += .25; } },
    { id: "split", tag: "destroy", name: "裂变弹片", icon: "Ψ", detail: "额外弹道 +1", apply: player => { player.shots = Math.min(5, player.shots + 1); } },
    { id: "voidOrb", tag: "destroy", name: "空洞宝珠", icon: "●", detail: "弹体与爆炸范围提升", apply: player => { player.bulletSize = Math.min(10, player.bulletSize + 1.5); player.explosion += .16; } },
    { id: "boneBell", tag: "destroy", name: "骨质风铃", icon: "♢", detail: "击杀引发骨爆", apply: player => { player.deathBurst += 1; } },
    { id: "hammer", tag: "destroy", name: "通天锤", icon: "┳", detail: "攻击 +0.75，射速略降", apply: player => { player.damage += .75; player.fireRate *= 1.1; } },
    { id: "gear", tag: "coin", name: "黄铜齿轮", icon: "⚙", detail: "射速 +14%", apply: player => { player.fireRate = Math.max(.075, player.fireRate * .86); } },
    { id: "magnet", tag: "coin", name: "血肉磁铁", icon: "∩", detail: "扩大拾取范围", apply: player => { player.pickupRadius += 70; } },
    { id: "goldCoin", tag: "coin", name: "古王金币", icon: "◎", detail: "获得 6 枚弹壳币", apply: player => { player.coins += 6; } },
    { id: "refreshToken", tag: "coin", name: "刷新币", icon: "↻", detail: "射速 +10%，商店降价", apply: player => { player.fireRate = Math.max(.075, player.fireRate * .9); player.discount += .1; } },
    { id: "luckyDie", tag: "coin", name: "鎏金骰子", icon: "◇", detail: "暴击 +8%，金币掉率提升", apply: player => { player.critChance = Math.min(.7, player.critChance + .08); player.luck += .12; } },
    { id: "crownGear", tag: "coin", name: "王冠发条", icon: "♛", detail: "每枚硬币强化攻击", apply: player => { player.coinPower += .018; } },
    { id: "lens", tag: "spell", name: "裂纹透镜", icon: "◉", detail: "暴击率 +12%", apply: player => { player.critChance = Math.min(.7, player.critChance + .12); } },
    { id: "needle", tag: "spell", name: "锈蚀长针", icon: "⇢", detail: "穿透 +1", apply: player => { player.pierce += 1; } },
    { id: "halo", tag: "spell", name: "苍白光环", icon: "☼", detail: "弹体变大，攻击 +0.25", apply: player => { player.bulletSize = Math.min(10, player.bulletSize + 1); player.damage += .25; } },
    { id: "spellbook", tag: "spell", name: "阿卡兰魔匣", icon: "▤", detail: "技能冷却 -18%", apply: player => { player.skillDelay = Math.max(3.5, player.skillDelay * .82); } },
    { id: "bloodKey", tag: "spell", name: "鲜血钥匙", icon: "†", detail: "暴击 +10%，清房回复", apply: player => { player.critChance = Math.min(.7, player.critChance + .1); player.roomHeal = Math.min(2, player.roomHeal + 1); } },
    { id: "moonSigil", tag: "spell", name: "月蚀咒印", icon: "☾", detail: "弹体额外连锁一次", apply: player => { player.chain += 1; } },
    { id: "boots", tag: "titan", name: "兔皮靴", icon: "♞", detail: "移速 +20", apply: player => { player.speed += 20; } },
    { id: "heart", tag: "titan", name: "缝合之心", icon: "♥", detail: "生命上限 +2", apply: player => { player.maxHp += 2; player.hp += 2; } },
    { id: "cloak", tag: "titan", name: "残影斗篷", icon: "◒", detail: "翻滚冷却 -18%", apply: player => { player.rollDelay = Math.max(.42, player.rollDelay * .82); } },
    { id: "candle", tag: "titan", name: "守夜残烛", icon: "♨", detail: "清房恢复半颗心", apply: player => { player.roomHeal = Math.min(2, player.roomHeal + 1); } },
    { id: "shield", tag: "titan", name: "蓝铁护符", icon: "◆", detail: "抵挡下一次伤害", apply: player => { player.armor += 1; } },
    { id: "titanSkull", tag: "titan", name: "泰坦之颅", icon: "◫", detail: "生命 +2，碰撞减伤", apply: player => { player.maxHp += 2; player.hp += 2; player.contactGuard += .25; } }
  ];

  let width = 0;
  let height = 0;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let lastTime = 0;
  let game;
  let screenShake = 0;
  let enemySerial = 0;
  let selectedHero = "breaker";
  let audioContext;
  const keys = new Set();
  const pointer = { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2, down: false, moveDown: false, active: false };
  const touchMove = { x: 0, y: 0 };

  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const isBoss = enemy => enemy.type.startsWith("boss");

  function sound(frequency, duration = .06, type = "triangle", volume = .018) {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    audioContext ||= new AudioEngine();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency * .62), audioContext.currentTime + duration);
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  }

  function seeded(seed) {
    const value = Math.sin(seed * 91.731 + 17.17) * 43758.5453;
    return value - Math.floor(value);
  }

  function roundedRect(x, y, widthValue, heightValue, radius) {
    const corner = Math.min(radius, widthValue / 2, heightValue / 2);
    context.beginPath();
    context.moveTo(x + corner, y);
    context.lineTo(x + widthValue - corner, y);
    context.quadraticCurveTo(x + widthValue, y, x + widthValue, y + corner);
    context.lineTo(x + widthValue, y + heightValue - corner);
    context.quadraticCurveTo(x + widthValue, y + heightValue, x + widthValue - corner, y + heightValue);
    context.lineTo(x + corner, y + heightValue);
    context.quadraticCurveTo(x, y + heightValue, x, y + heightValue - corner);
    context.lineTo(x, y + corner);
    context.quadraticCurveTo(x, y, x + corner, y);
    context.closePath();
  }

  function drawBlob(radius, points, seed, fill, stroke = "#241a1d", lineWidth = 3) {
    context.beginPath();
    for (let index = 0; index <= points; index += 1) {
      const angle = index / points * TAU;
      const wobble = .88 + seeded(seed + index * 3.1) * .2;
      const x = Math.cos(angle) * radius * wobble;
      const y = Math.sin(angle) * radius * wobble;
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }

  function drawEye(x, y, radius, lookX, lookY, angry = false) {
    context.save();
    context.translate(x, y);
    context.fillStyle = "#efe2c4";
    context.strokeStyle = "#2a1c20";
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(0, 0, radius, radius * (angry ? .68 : .86), angry ? -.18 : 0, 0, TAU);
    context.fill();
    context.stroke();
    context.fillStyle = "#342127";
    context.beginPath();
    context.arc(clamp(lookX, -2, 2), clamp(lookY, -2, 2), radius * .42, 0, TAU);
    context.fill();
    context.fillStyle = "#fff8e6";
    context.beginPath();
    context.arc(clamp(lookX, -2, 2) - 1, clamp(lookY, -2, 2) - 1, Math.max(1, radius * .13), 0, TAU);
    context.fill();
    context.restore();
  }

  function drawLimb(x1, y1, x2, y2, widthValue, color) {
    context.strokeStyle = "#25191d";
    context.lineWidth = widthValue + 4;
    context.lineCap = "round";
    context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
    context.strokeStyle = color;
    context.lineWidth = widthValue;
    context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke();
  }

  function drawFleshTexture(radius, seed, color = "#1d1317") {
    context.save();
    context.fillStyle = color;
    context.globalAlpha = .2;
    for (let index = 0; index < 7; index += 1) {
      const angle = seeded(seed + index * 13) * TAU;
      const distanceValue = seeded(seed + index * 19) * radius * .66;
      const x = Math.cos(angle) * distanceValue;
      const y = Math.sin(angle) * distanceValue;
      context.beginPath();
      context.ellipse(x, y, 1.5 + seeded(seed + index * 23) * 3, 1 + seeded(seed + index * 29) * 2, angle, 0, TAU);
      context.fill();
    }
    context.restore();
  }

  function drawScar(x, y, length, angle, color = "#51252b") {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.strokeStyle = color;
    context.lineWidth = 1.8;
    context.lineCap = "round";
    context.beginPath(); context.moveTo(-length / 2, 0); context.lineTo(length / 2, 0); context.stroke();
    for (const offset of [-length * .25, 0, length * .25]) {
      context.beginPath(); context.moveTo(offset - 1, -2.5); context.lineTo(offset + 1, 2.5); context.stroke();
    }
    context.restore();
  }

  function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function randomItems(count, preferredTag) {
    const pool = [...items];
    const result = [];
    if (preferredTag) {
      const preferred = pool.filter(item => item.tag === preferredTag);
      const chosen = randomChoice(preferred);
      result.push(chosen);
      pool.splice(pool.indexOf(chosen), 1);
    }
    while (result.length < count && pool.length) result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return result;
  }

  function generateDungeon() {
    const dungeon = [];
    chapters.forEach((chapter, chapterIndex) => {
      for (let roomIndex = 0; roomIndex < 6; roomIndex += 1) {
        const level = dungeon.length + 1;
        if (roomIndex === 5) {
          dungeon.push({ name: chapter.bossName, chapter: chapterIndex, floorRoom: 6, level, kind: "boss", enemies: [chapter.boss], theme: chapter.theme, cleared: false });
          continue;
        }
        if (roomIndex === 2) {
          dungeon.push({ name: `${chapter.name}宝库`, chapter: chapterIndex, floorRoom: roomIndex + 1, level, kind: "treasure", enemies: [], theme: chapter.theme, cleared: false, choices: randomItems(3, heroes[selectedHero].tag) });
          continue;
        }
        if (roomIndex === 4) {
          dungeon.push({ name: "盲眼商贩", chapter: chapterIndex, floorRoom: roomIndex + 1, level, kind: "shop", enemies: [], theme: chapter.theme, cleared: false, choices: randomItems(3, heroes[selectedHero].tag) });
          continue;
        }
        const pools = [
          ["grunt", "charger", "leech"],
          ["grunt", "charger", "turret", "bat", "cultist"],
          ["charger", "turret", "bat", "splitter", "cultist", "bomber"]
        ];
        const modifier = chapterIndex === 0 && roomIndex === 0 ? null : randomChoice(Object.keys(roomModifiers));
        const enemyCount = Math.min(3 + chapterIndex + roomIndex + Math.floor(random(0, 2)) + (modifier === "swarm" ? 2 : 0), 10);
        const enemyTypes = Array.from({ length: enemyCount }, () => randomChoice(pools[chapterIndex]));
        if (chapterIndex === 0 && roomIndex === 0) enemyTypes.splice(0, 2, "grunt", "charger");
        if (chapterIndex === 0 && roomIndex === 1) enemyTypes.splice(0, 2, "leech", "turret");
        if (chapterIndex === 1 && roomIndex === 0) enemyTypes.splice(0, 2, "bat", "cultist");
        if (chapterIndex === 2 && roomIndex === 0) enemyTypes.splice(0, 2, "splitter", "bomber");
        if (roomIndex === 3) enemyTypes.push(chapterIndex === 0 ? "cultist" : chapterIndex === 1 ? "bomber" : "splitter");
        dungeon.push({
          name: chapterIndex === 0 && roomIndex === 0 ? "入口前厅" : randomChoice(roomNames[chapterIndex]),
          chapter: chapterIndex, floorRoom: roomIndex + 1, level,
          kind: roomIndex === 3 ? "elite" : "combat",
          enemies: enemyTypes, theme: chapter.theme, modifier, cleared: false
        });
      }
    });
    return dungeon;
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    scale = Math.min(width / ROOM_WIDTH, height / ROOM_HEIGHT);
    offsetX = (width - ROOM_WIDTH * scale) / 2;
    offsetY = height > width ? Math.max(26, height * .08) : (height - ROOM_HEIGHT * scale) / 2;
  }

  function newGame() {
    keys.clear();
    pointer.down = false;
    pointer.moveDown = false;
    game = {
      state: "playing",
      room: 0,
      roomTime: 0,
      elapsed: 0,
      kills: 0,
      bossKills: 0,
      itemsFound: 0,
      combo: 0,
      comboTimer: 0,
      perfectRooms: 0,
      destroyedProps: 0,
      roomHit: false,
      synergies: {},
      itemStacks: {},
      rooms: generateDungeon(),
      bullets: [],
      enemyBullets: [],
      enemies: [],
      particles: [],
      pickups: [],
      obstacles: [],
      bombs: [],
      texts: [],
      doorOpen: false,
      transition: 1,
      player: {
        x: 120, y: ROOM_HEIGHT / 2, radius: 14, hp: 6, maxHp: 6,
        speed: 210, angle: 0, cooldown: 0, fireRate: .22,
        damage: 1, bulletSpeed: 530, bulletLife: 1.4, shots: 1, roll: 0, rollCooldown: 0,
        rollDelay: .9, critChance: .05, pierce: 0, pickupRadius: 28, roomHeal: 0, bulletSize: 4,
        armor: 0, invincible: 0, flash: 0, coins: 0, knockbackX: 0, knockbackY: 0,
        walk: 0, moveBlend: 0, skillCooldown: 0, skillDelay: 8, rage: 0,
        explosion: 0, deathBurst: 0, chain: 0, discount: 0, luck: 0,
        coinPower: 0, contactGuard: 0, hero: selectedHero
      }
    };
    heroes[selectedHero].apply(game.player);
    enterRoom(0);
    startScreen.classList.remove("visible");
    endScreen.classList.remove("visible");
    touchUi.classList.add("active");
    requestAnimationFrame(() => canvas.focus({ preventScroll: true }));
  }

  function enterRoom(index) {
    game.room = index;
    game.roomTime = 0;
    game.doorOpen = false;
    game.bullets.length = 0;
    game.enemyBullets.length = 0;
    game.enemies.length = 0;
    game.pickups.length = 0;
    game.obstacles.length = 0;
    game.bombs.length = 0;
    game.texts.length = 0;
    game.roomHit = false;
    game.player.x = 108;
    game.player.y = ROOM_HEIGHT / 2;
    game.transition = 1;
    const room = game.rooms[index];
    room.enemies.forEach(spawnEnemy);
    if (room.kind === "treasure" && !room.cleared) {
      room.choices.forEach((item, choice) => game.pickups.push({ x: 390 + choice * 135, y: ROOM_HEIGHT / 2, type: "item", item, phase: choice, choiceGroup: "treasure" }));
      game.texts.push({ text: "宝库馈赠 · 三选一", x: ROOM_WIDTH / 2, y: 130, life: 2.5 });
    }
    if (room.kind === "shop" && !room.cleared) {
      room.choices.forEach((item, choice) => game.pickups.push({ x: 390 + choice * 135, y: ROOM_HEIGHT / 2, type: "item", item, phase: choice, price: Math.max(3, Math.round((5 + choice * 2 + room.chapter) * (1 - game.player.discount))) }));
      game.doorOpen = true;
      game.texts.push({ text: "盲眼商贩 · 靠近遗物购买", x: ROOM_WIDTH / 2, y: 130, life: 2.5 });
    }
    createObstacles(room);
    if (room.cleared) game.doorOpen = true;
  }

  function createObstacles(room) {
    if (["treasure", "shop"].includes(room.kind)) return;
    const count = room.kind === "boss" ? 2 : 4 + room.chapter;
    for (let index = 0; index < count; index += 1) {
      const seed = room.level * 83 + index * 29;
      const type = room.kind === "boss" ? "spike" : seeded(seed) < .45 ? "rock" : seeded(seed + 4) < .72 ? "urn" : "spike";
      game.obstacles.push({
        x: 300 + seeded(seed + 7) * 500,
        y: 135 + seeded(seed + 13) * 270,
        radius: type === "rock" ? 25 : type === "urn" ? 17 : 20,
        type,
        hp: type === "rock" ? Infinity : type === "urn" ? 3 : Infinity,
        pulse: seeded(seed + 19) * TAU,
        dead: false
      });
    }
  }

  function spawnEnemy(type) {
    const boss = type.startsWith("boss");
    const turret = type === "turret";
    const charger = type === "charger";
    const bat = type === "bat";
    const splitter = type === "splitter";
    const leech = type === "leech";
    const cultist = type === "cultist";
    const bomber = type === "bomber";
    const room = game.rooms[game.room];
    const levelScale = (1 + game.room * .07) * (room.modifier === "swarm" ? .86 : 1);
    const bossHp = type === "bossBrood" ? 34 : type === "bossWarden" ? 52 : 72;
    const baseHp = boss ? bossHp : turret ? 9 : splitter ? 8 : cultist ? 7 : bomber ? 10 : charger ? 6 : leech ? 4 : bat ? 3 : 4;
    let x;
    let y;
    do {
      x = random(boss ? 430 : 330, ROOM_WIDTH - 90);
      y = random(90, ROOM_HEIGHT - 90);
    } while (Math.hypot(x - game.player.x, y - game.player.y) < 220);
    game.enemies.push({
      id: ++enemySerial, type, x, y, radius: boss ? (type === "bossHeart" ? 50 : type === "bossWarden" ? 47 : 49) : bomber ? 22 : turret ? 20 : splitter ? 19 : cultist ? 18 : charger ? 18 : leech ? 12 : bat ? 13 : 16,
      hp: Math.ceil(baseHp * levelScale * (game.rooms[game.room].kind === "elite" && !boss ? 1.55 : 1)),
      maxHp: Math.ceil(baseHp * levelScale * (game.rooms[game.room].kind === "elite" && !boss ? 1.55 : 1)),
      speed: (boss ? 70 : bomber ? 48 : turret ? 30 : splitter ? 56 : cultist ? 68 : charger ? 80 : leech ? 150 : bat ? 138 : random(64, 92)) * (room.modifier === "frenzy" ? 1.24 : 1),
      cooldown: random(.3, 1.2), angle: 0, flash: 0,
      phase: random(0, TAU), charge: 0, windup: 0, chargeAngle: 0, spawnCooldown: 2.8,
      elite: game.rooms[game.room].kind === "elite" && !boss, dead: false
    });
  }

  function firePlayer(angle) {
    const player = game.player;
    if (player.cooldown > 0 || player.roll > 0) return;
    player.cooldown = player.fireRate;
    player.angle = angle;
    const critical = Math.random() < player.critChance;
    const coinMultiplier = 1 + Math.min(1.5, player.coins * player.coinPower);
    const rageMultiplier = player.rage > 0 ? 1.65 : 1;
    for (let shot = 0; shot < player.shots; shot += 1) {
      const shotAngle = angle + (shot - (player.shots - 1) / 2) * .105;
      game.bullets.push({
        x: player.x + Math.cos(shotAngle) * 19,
        y: player.y + Math.sin(shotAngle) * 19,
        vx: Math.cos(shotAngle) * player.bulletSpeed,
        vy: Math.sin(shotAngle) * player.bulletSpeed,
        radius: player.bulletSize + (critical ? 1.5 : 0), life: player.bulletLife,
        damage: player.damage * coinMultiplier * rageMultiplier * (critical ? 2 : 1), critical,
        pierce: player.pierce, explosion: player.explosion, chain: player.chain, hitIds: new Set()
      });
    }
    burst(player.x + Math.cos(angle) * 21, player.y + Math.sin(angle) * 21, "#ffd76a", 3, 60);
    sound(220 + Math.random() * 35, .045, "triangle", .009);
  }

  function enemyFire(enemy, count = 1, spread = .18) {
    const base = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
    for (let index = 0; index < count; index += 1) {
      const angle = base + (index - (count - 1) / 2) * spread;
      const speed = isBoss(enemy) ? 240 : 190;
      game.enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: isBoss(enemy) ? 6 : 5, life: 4 });
    }
  }

  function radialFire(enemy, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = enemy.phase + index / count * TAU;
      game.enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 155, vy: Math.sin(angle) * 155, radius: 6, life: 5 });
    }
  }

  function roll() {
    const player = game.player;
    if (game.state !== "playing" || player.rollCooldown > 0) return;
    player.roll = .34;
    player.rollCooldown = player.rollDelay;
    player.invincible = .42;
    burst(player.x, player.y, "#d8c7a2", 8, 100);
    sound(115, .12, "sine", .014);
  }

  function activateSkill() {
    if (!game || game.state !== "playing") return;
    const player = game.player;
    if (player.skillCooldown > 0) return;
    const hero = player.hero;
    if (hero === "breaker") {
      for (const enemy of game.enemies) {
        const range = distance(enemy, player);
        if (range < 250) damageEnemy(enemy, 5 + player.damage * 3.5, { x: player.x, y: player.y, skill: true });
      }
      for (const obstacle of game.obstacles) if (distance(obstacle, player) < 250) damageObstacle(obstacle, 99);
      shockwave(player.x, player.y, heroes[hero].color, 38);
    } else if (hero === "gambler") {
      const spent = Math.min(3, player.coins);
      player.coins -= spent;
      const count = 12 + spent * 4;
      for (let index = 0; index < count; index += 1) {
        const angle = index / count * TAU;
        game.bullets.push({ x: player.x, y: player.y, vx: Math.cos(angle) * 520, vy: Math.sin(angle) * 520, radius: 5, life: 1.25, damage: player.damage * (1.2 + spent * .25), critical: spent === 3, pierce: 1, hitIds: new Set(), coin: true });
      }
      shockwave(player.x, player.y, heroes[hero].color, 22);
    } else if (hero === "seer") {
      const targets = [...game.enemies].filter(enemy => !enemy.dead).sort((first, second) => distance(first, player) - distance(second, player)).slice(0, 5 + player.chain);
      let source = player;
      for (const target of targets) {
        drawLightningBurst(source, target);
        damageEnemy(target, 3.5 + player.damage * 2.8, { x: source.x, y: source.y, skill: true });
        source = target;
      }
      shockwave(player.x, player.y, heroes[hero].color, 18);
    } else {
      player.rage = 4.5;
      player.invincible = Math.max(player.invincible, 1.2);
      player.armor += 1;
      for (const enemy of game.enemies) if (distance(enemy, player) < 170) damageEnemy(enemy, 3 + player.maxHp * .35, { x: player.x, y: player.y, skill: true });
      shockwave(player.x, player.y, heroes[hero].color, 45);
    }
    player.skillCooldown = player.skillDelay;
    screenShake = 12;
    game.texts.push({ text: heroes[hero].skill, x: clamp(player.x, 170, ROOM_WIDTH - 170), y: player.y - 44, life: 1.4 });
    sound(hero === "seer" ? 460 : hero === "titan" ? 82 : 150, .28, hero === "gambler" ? "square" : "sawtooth", .024);
  }

  function shockwave(x, y, color, count) {
    burst(x, y, color, count, 250);
    game.particles.push({ x, y, vx: 0, vy: 0, life: .55, maxLife: .55, color, size: 16, ring: true });
  }

  function drawLightningBurst(source, target) {
    const steps = 7;
    for (let index = 0; index <= steps; index += 1) {
      const ratio = index / steps;
      game.particles.push({
        x: source.x + (target.x - source.x) * ratio + random(-8, 8),
        y: source.y + (target.y - source.y) * ratio + random(-8, 8),
        vx: 0, vy: 0, life: .22, maxLife: .22, color: "#bfa8ff", size: 3
      });
    }
  }

  function burst(x, y, color, count, speed) {
    for (let index = 0; index < count; index += 1) {
      const angle = random(0, TAU);
      const velocity = random(speed * .35, speed);
      game.particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life: random(.2, .5), maxLife: .5, color, size: random(2, 5) });
    }
  }

  function damagePlayer(amount, source) {
    const player = game.player;
    if (player.invincible > 0) return;
    if (player.armor > 0) {
      player.armor -= 1;
      player.invincible = .7;
      screenShake = 5;
      burst(player.x, player.y, "#72b9da", 18, 170);
      sound(360, .16, "sine", .025);
      game.texts.push({ text: "护盾破碎", x: player.x, y: player.y - 34, life: 1.2 });
      return;
    }
    player.hp -= source && source.type && player.contactGuard ? Math.max(.5, amount * (1 - player.contactGuard)) : amount;
    game.roomHit = true;
    player.invincible = 1;
    player.flash = .2;
    if (source) {
      const angle = Math.atan2(player.y - source.y, player.x - source.x);
      player.knockbackX = Math.cos(angle) * 230;
      player.knockbackY = Math.sin(angle) * 230;
    }
    screenShake = 10;
    burst(player.x, player.y, "#e9544d", 16, 180);
    sound(92, .24, "sawtooth", .028);
    if (player.hp <= 0) finish(false);
  }

  function killEnemy(enemy) {
    enemy.dead = true;
    game.kills += 1;
    game.combo = Math.min(30, game.combo + 1);
    game.comboTimer = 3.5;
    if (isBoss(enemy)) game.bossKills += 1;
    screenShake = isBoss(enemy) ? 18 : 5;
    burst(enemy.x, enemy.y, isBoss(enemy) ? "#f7bd53" : "#c84c4c", isBoss(enemy) ? 40 : 15, isBoss(enemy) ? 260 : 150);
    sound(isBoss(enemy) ? 72 : 130, isBoss(enemy) ? .42 : .08, "square", isBoss(enemy) ? .04 : .012);
    if (isBoss(enemy)) {
      game.pickups.push({ x: enemy.x - 20, y: enemy.y, type: "crown", phase: 0 });
      if (game.room < game.rooms.length - 1) game.pickups.push({ x: enemy.x + 24, y: enemy.y, type: "item", item: randomChoice(items), phase: 0, spawnDelay: .35 });
    } else if (Math.random() < .38 + game.player.luck + Math.min(.22, game.combo * .012) + (game.rooms[game.room].modifier === "fortune" ? .24 : 0)) {
      game.pickups.push({ x: enemy.x, y: enemy.y, type: Math.random() < .35 ? "heart" : "coin", phase: 0 });
    }
    if (game.player.deathBurst > 0 && !isBoss(enemy)) {
      for (const target of game.enemies) {
        if (!target.dead && target !== enemy && distance(target, enemy) < 85 + game.player.deathBurst * 18) damageEnemy(target, .8 + game.player.damage * .45, enemy);
      }
      burst(enemy.x, enemy.y, "#d9c29c", 8 + game.player.deathBurst * 2, 120);
    }
    if (enemy.type === "splitter" && !game.suppressSpawns) {
      for (let index = 0; index < 2; index += 1) {
        spawnEnemy("bat");
        const child = game.enemies.at(-1);
        child.x = clamp(enemy.x + (index ? 18 : -18), WALL + child.radius, ROOM_WIDTH - WALL - child.radius);
        child.y = clamp(enemy.y + random(-12, 12), WALL + child.radius, ROOM_HEIGHT - WALL - child.radius);
        child.hp = Math.max(1, Math.ceil(child.hp * .65));
        child.maxHp = child.hp;
      }
    }
  }

  function update(dt) {
    if (!game || game.state !== "playing") return;
    const player = game.player;
    game.roomTime += dt;
    game.elapsed += dt;
    game.transition = Math.max(0, game.transition - dt * 2.2);
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.rollCooldown = Math.max(0, player.rollCooldown - dt);
    player.skillCooldown = Math.max(0, player.skillCooldown - dt);
    player.rage = Math.max(0, player.rage - dt);
    player.invincible = Math.max(0, player.invincible - dt);
    player.flash = Math.max(0, player.flash - dt);
    if (player.roll > 0) player.roll -= dt;
    player.knockbackX *= Math.pow(.025, dt);
    player.knockbackY *= Math.pow(.025, dt);

    let moveX = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0) + touchMove.x;
    let moveY = (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0) + touchMove.y;
    if (pointer.moveDown) {
      const pointerDistance = Math.hypot(pointer.x - player.x, pointer.y - player.y);
      if (pointerDistance > 10) {
        moveX += (pointer.x - player.x) / pointerDistance;
        moveY += (pointer.y - player.y) / pointerDistance;
      }
    }
    const moveLength = Math.hypot(moveX, moveY) || 1;
    if (Math.hypot(moveX, moveY) > 1) { moveX /= moveLength; moveY /= moveLength; }
    const currentSpeed = player.speed * (player.roll > 0 ? 2.75 : 1) * (player.rage > 0 ? 1.22 : 1);
    const moving = Math.min(1, Math.hypot(moveX, moveY));
    player.moveBlend += (moving - player.moveBlend) * Math.min(1, dt * 12);
    player.walk += dt * (4 + currentSpeed * .026) * moving;
    player.x = clamp(player.x + (moveX * currentSpeed + player.knockbackX) * dt, WALL + player.radius, ROOM_WIDTH - WALL - player.radius);
    player.y = clamp(player.y + (moveY * currentSpeed + player.knockbackY) * dt, WALL + player.radius, ROOM_HEIGHT - WALL - player.radius);
    resolveObstacleCollision(player);

    let aimX = 0;
    let aimY = 0;
    if (keys.has("ArrowLeft")) aimX -= 1;
    if (keys.has("ArrowRight")) aimX += 1;
    if (keys.has("ArrowUp")) aimY -= 1;
    if (keys.has("ArrowDown")) aimY += 1;
    if (aimX || aimY) firePlayer(Math.atan2(aimY, aimX));
    else if (pointer.down && pointer.active) firePlayer(Math.atan2(pointer.y - player.y, pointer.x - player.x));
    else if (pointer.down) {
      const target = nearestEnemy();
      if (target) firePlayer(Math.atan2(target.y - player.y, target.x - player.x));
    }

    updateBullets(dt);
    updateEnemies(dt);
    updateBombs(dt);
    updateParticles(dt);
    updatePickups(dt);
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;

    const currentRoom = game.rooms[game.room];
    const waitingForTreasure = currentRoom.kind === "treasure" && game.pickups.some(pickup => ["chest", "opening", "item"].includes(pickup.type));
    if (!game.enemies.some(enemy => !enemy.dead) && !waitingForTreasure && !game.doorOpen) {
      currentRoom.cleared = true;
      game.doorOpen = true;
      if (player.roomHeal > 0) player.hp = Math.min(player.maxHp, player.hp + player.roomHeal);
      if (!["treasure", "shop"].includes(currentRoom.kind) && !game.roomHit) {
        game.perfectRooms += 1;
        player.coins += currentRoom.kind === "boss" ? 4 : 2;
        game.texts.push({ text: "无伤清房 · 奖励弹壳币", x: ROOM_WIDTH / 2, y: 126, life: 2.2 });
      }
      if (currentRoom.modifier === "cursed") player.coins += 1;
      if (currentRoom.kind === "boss") player.hp = Math.min(player.maxHp, player.hp + 2);
      for (const bullet of game.enemyBullets) burst(bullet.x, bullet.y, "#765d69", 2, 30);
      game.enemyBullets.length = 0;
      if (currentRoom.kind !== "treasure" && currentRoom.kind !== "boss" && (currentRoom.kind === "elite" || Math.random() < .28)) {
        game.pickups.push({ x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2, type: "item", item: randomChoice(items), phase: 0 });
      }
      game.texts.push({ text: game.room === game.rooms.length - 1 ? "地牢核心已净化" : "房间已清空 · 出口开启", x: ROOM_WIDTH / 2, y: 94, life: 2 });
    }
    if (game.doorOpen && player.x > ROOM_WIDTH - WALL - player.radius - 3) {
      if (game.room === game.rooms.length - 1) finish(true);
      else enterRoom(game.room + 1);
    }
    game.texts.forEach(text => { text.life -= dt; text.y -= dt * 8; });
    game.texts = game.texts.filter(text => text.life > 0);
    screenShake = Math.max(0, screenShake - dt * 28);
  }

  function updateBullets(dt) {
    const player = game.player;
    for (const bullet of game.bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      for (const enemy of game.enemies) {
        if (enemy.dead || bullet.life <= 0 || bullet.hitIds.has(enemy.id) || distance(bullet, enemy) > bullet.radius + enemy.radius) continue;
        bullet.hitIds.add(enemy.id);
        damageEnemy(enemy, bullet.damage, bullet);
        if (bullet.pierce > 0) bullet.pierce -= 1;
        else bullet.life = 0;
        burst(bullet.x, bullet.y, bullet.critical ? "#fff4a8" : "#f7d47a", bullet.critical ? 9 : 5, bullet.critical ? 145 : 90);
        if (bullet.explosion > 0) {
          const radius = 45 + bullet.explosion * 90;
          for (const target of game.enemies) if (!target.dead && target !== enemy && distance(target, bullet) < radius) damageEnemy(target, bullet.damage * .45, bullet);
          shockwave(bullet.x, bullet.y, "#d46b49", 8);
        }
        if (bullet.chain > 0) {
          const target = game.enemies.find(candidate => !candidate.dead && candidate !== enemy && !bullet.hitIds.has(candidate.id) && distance(candidate, enemy) < 135);
          if (target) {
            bullet.hitIds.add(target.id);
            drawLightningBurst(enemy, target);
            damageEnemy(target, bullet.damage * .58, bullet);
          }
        }
      }
      for (const obstacle of game.obstacles) {
        if (obstacle.dead || bullet.life <= 0 || distance(bullet, obstacle) > bullet.radius + obstacle.radius) continue;
        if (obstacle.type !== "spike") {
          damageObstacle(obstacle, bullet.damage);
          if (bullet.pierce > 0) bullet.pierce -= 1; else bullet.life = 0;
        }
      }
    }
    for (const bullet of game.enemyBullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      if (bullet.life > 0 && distance(bullet, player) < bullet.radius + player.radius) {
        bullet.life = 0;
        damagePlayer(1, bullet);
      }
      for (const obstacle of game.obstacles) {
        if (!obstacle.dead && obstacle.type === "rock" && distance(bullet, obstacle) < bullet.radius + obstacle.radius) bullet.life = 0;
      }
    }
    game.bullets = game.bullets.filter(inBounds);
    game.enemyBullets = game.enemyBullets.filter(inBounds);
  }

  function damageEnemy(enemy, amount, source) {
    if (!enemy || enemy.dead) return;
    enemy.hp -= amount;
    enemy.flash = .12;
    if (source) {
      const angle = Math.atan2(enemy.y - source.y, enemy.x - source.x);
      enemy.x += Math.cos(angle) * (source.skill ? 18 : 4);
      enemy.y += Math.sin(angle) * (source.skill ? 18 : 4);
    }
    if (enemy.hp <= 0) killEnemy(enemy);
  }

  function damageObstacle(obstacle, amount) {
    if (!obstacle || obstacle.dead || !Number.isFinite(obstacle.hp)) return;
    obstacle.hp -= amount;
    burst(obstacle.x, obstacle.y, "#9b7351", 4, 70);
    if (obstacle.hp > 0) return;
    obstacle.dead = true;
    game.destroyedProps += 1;
    if (obstacle.type === "urn" && (game.player.hero === "breaker" || game.synergies.destroy3)) {
      game.player.damage += .035;
      game.texts.push({ text: "拆解余烬 · 攻击成长", x: obstacle.x, y: obstacle.y - 28, life: 1.1 });
    }
    burst(obstacle.x, obstacle.y, "#d2b27a", 12, 150);
    if (Math.random() < .7) game.pickups.push({ x: obstacle.x, y: obstacle.y, type: "coin", phase: 0 });
  }

  function resolveObstacleCollision(entity) {
    for (const obstacle of game.obstacles) {
      if (obstacle.dead) continue;
      if (obstacle.type === "spike") {
        if (distance(entity, obstacle) < entity.radius + obstacle.radius * .65) damagePlayer(1, obstacle);
        continue;
      }
      const deltaX = entity.x - obstacle.x;
      const deltaY = entity.y - obstacle.y;
      const currentDistance = Math.hypot(deltaX, deltaY) || 1;
      const minimumDistance = entity.radius + obstacle.radius;
      if (currentDistance < minimumDistance) {
        entity.x += deltaX / currentDistance * (minimumDistance - currentDistance);
        entity.y += deltaY / currentDistance * (minimumDistance - currentDistance);
      }
    }
  }

  function updateBombs(dt) {
    for (const bomb of game.bombs) {
      bomb.timer -= dt;
      bomb.pulse += dt * 8;
      if (bomb.timer > 0) continue;
      bomb.dead = true;
      shockwave(bomb.x, bomb.y, "#f07a45", 22);
      if (distance(bomb, game.player) < 82) damagePlayer(2, bomb);
      for (const obstacle of game.obstacles) if (distance(bomb, obstacle) < 92) damageObstacle(obstacle, 8);
      screenShake = 11;
    }
    game.bombs = game.bombs.filter(bomb => !bomb.dead);
  }

  function inBounds(bullet) {
    return bullet.life > 0 && bullet.x > WALL && bullet.x < ROOM_WIDTH - WALL && bullet.y > WALL && bullet.y < ROOM_HEIGHT - WALL;
  }

  function updateEnemies(dt) {
    const player = game.player;
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      enemy.cooldown -= dt;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.phase += dt * (isBoss(enemy) ? 1.5 : .8);
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.angle = angle;
      const playerDistance = distance(enemy, player);

      if (enemy.type === "grunt") {
        if (playerDistance > 120) {
          enemy.x += Math.cos(angle) * enemy.speed * dt;
          enemy.y += Math.sin(angle) * enemy.speed * dt;
        }
        if (enemy.cooldown <= 0 && playerDistance < 370) {
          enemyFire(enemy);
          enemy.cooldown = random(1.1, 1.7);
        }
      } else if (enemy.type === "turret") {
        enemy.y += Math.sin(enemy.phase) * 22 * dt;
        if (enemy.cooldown <= 0) {
          enemyFire(enemy, 3, .2);
          enemy.cooldown = 1.35;
        }
      } else if (enemy.type === "charger") {
        if (enemy.charge > 0) {
          enemy.x += Math.cos(enemy.chargeAngle) * enemy.speed * 4.4 * dt;
          enemy.y += Math.sin(enemy.chargeAngle) * enemy.speed * 4.4 * dt;
          enemy.charge -= dt;
        } else if (enemy.windup > 0) {
          enemy.windup -= dt;
          if (enemy.windup <= 0) enemy.charge = .62;
        } else if (enemy.cooldown <= 0) {
          enemy.chargeAngle = angle;
          enemy.windup = .48;
          enemy.cooldown = 2.1;
          burst(enemy.x, enemy.y, "#e2b45a", 6, 55);
        } else if (playerDistance > 150) {
          enemy.x += Math.cos(angle) * enemy.speed * .55 * dt;
          enemy.y += Math.sin(angle) * enemy.speed * .55 * dt;
        }
      } else if (enemy.type === "bat") {
        const swoop = angle + Math.sin(enemy.phase * 2.7) * 1.05;
        enemy.x += Math.cos(swoop) * enemy.speed * dt;
        enemy.y += Math.sin(swoop) * enemy.speed * dt;
        if (enemy.cooldown <= 0 && playerDistance < 250) {
          enemyFire(enemy);
          enemy.cooldown = random(1.7, 2.4);
        }
      } else if (enemy.type === "splitter") {
        if (playerDistance > 190) {
          enemy.x += Math.cos(angle) * enemy.speed * dt;
          enemy.y += Math.sin(angle) * enemy.speed * dt;
        }
        if (enemy.cooldown <= 0) {
          radialFire(enemy, enemy.hp < enemy.maxHp * .5 ? 8 : 5);
          enemy.cooldown = 1.75;
        }
      } else if (enemy.type === "leech") {
        const weave = angle + Math.sin(enemy.phase * 4.5) * .42;
        enemy.x += Math.cos(weave) * enemy.speed * dt;
        enemy.y += Math.sin(weave) * enemy.speed * dt;
        if (playerDistance < 55 && enemy.cooldown <= 0) {
          damagePlayer(1, enemy);
          enemy.cooldown = 1.1;
          enemy.x -= Math.cos(angle) * 55;
          enemy.y -= Math.sin(angle) * 55;
        }
      } else if (enemy.type === "cultist") {
        const orbit = angle + Math.PI / 2 * Math.sign(Math.sin(enemy.phase) || 1);
        if (playerDistance < 190) {
          enemy.x -= Math.cos(angle) * enemy.speed * .65 * dt;
          enemy.y -= Math.sin(angle) * enemy.speed * .65 * dt;
        } else if (playerDistance > 285) {
          enemy.x += Math.cos(angle) * enemy.speed * .7 * dt;
          enemy.y += Math.sin(angle) * enemy.speed * .7 * dt;
        } else {
          enemy.x += Math.cos(orbit) * enemy.speed * .55 * dt;
          enemy.y += Math.sin(orbit) * enemy.speed * .55 * dt;
        }
        if (enemy.cooldown <= 0) {
          radialFire(enemy, enemy.elite ? 8 : 6);
          enemy.cooldown = enemy.elite ? 1.45 : 2.1;
        }
      } else if (enemy.type === "bomber") {
        if (playerDistance > 245) {
          enemy.x += Math.cos(angle) * enemy.speed * dt;
          enemy.y += Math.sin(angle) * enemy.speed * dt;
        }
        if (enemy.cooldown <= 0) {
          game.bombs.push({ x: player.x + random(-34, 34), y: player.y + random(-34, 34), timer: enemy.elite ? .82 : 1.15, pulse: 0, radius: 12 });
          enemy.cooldown = enemy.elite ? 1.55 : 2.25;
          game.texts.push({ text: "爆破标记", x: player.x, y: player.y - 28, life: .75 });
        }
      } else if (enemy.type === "bossBrood") {
        updateBrood(enemy, angle, playerDistance, dt);
      } else if (enemy.type === "bossHeart") {
        updateHeart(enemy, angle, dt);
      } else {
        const orbit = angle + Math.sin(enemy.phase) * .85;
        if (playerDistance > 185) {
          enemy.x += Math.cos(orbit) * enemy.speed * dt;
          enemy.y += Math.sin(orbit) * enemy.speed * dt;
        }
        if (enemy.cooldown <= 0) {
          if (enemy.hp < enemy.maxHp * .5 && Math.random() < .48) radialFire(enemy, 12);
          else enemyFire(enemy, enemy.hp < enemy.maxHp * .5 ? 7 : 5, .15);
          enemy.cooldown = enemy.hp < enemy.maxHp * .5 ? .8 : 1.15;
        }
      }
      enemy.x = clamp(enemy.x, WALL + enemy.radius, ROOM_WIDTH - WALL - enemy.radius);
      enemy.y = clamp(enemy.y, WALL + enemy.radius, ROOM_HEIGHT - WALL - enemy.radius);
      resolveObstacleCollision(enemy);
      if (distance(enemy, player) < player.radius + enemy.radius) damagePlayer(1, enemy);
    }
    separateEnemies();
    game.enemies = game.enemies.filter(enemy => !enemy.dead);
  }

  function updateBrood(enemy, angle, playerDistance, dt) {
    enemy.spawnCooldown -= dt;
    if (enemy.charge > 0) {
      enemy.x += Math.cos(enemy.chargeAngle) * enemy.speed * 4.2 * dt;
      enemy.y += Math.sin(enemy.chargeAngle) * enemy.speed * 4.2 * dt;
      enemy.charge -= dt;
    } else if (enemy.windup > 0) {
      enemy.windup -= dt;
      if (enemy.windup <= 0) enemy.charge = .7;
    } else if (enemy.cooldown <= 0) {
      enemy.chargeAngle = angle;
      enemy.windup = .55;
      enemy.cooldown = 2.2;
    } else if (playerDistance > 150) {
      enemy.x += Math.cos(angle) * enemy.speed * .45 * dt;
      enemy.y += Math.sin(angle) * enemy.speed * .45 * dt;
    }
    if (enemy.spawnCooldown <= 0 && game.enemies.length < 9) {
      spawnEnemy("bat");
      if (enemy.hp < enemy.maxHp * .5) spawnEnemy("bat");
      enemy.spawnCooldown = enemy.hp < enemy.maxHp * .5 ? 3.5 : 5;
      game.texts.push({ text: "腐巢孵化", x: enemy.x, y: enemy.y - 46, life: 1.2 });
    }
  }

  function updateHeart(enemy, angle, dt) {
    enemy.spawnCooldown -= dt;
    const targetX = ROOM_WIDTH / 2 + Math.cos(enemy.phase * .55) * 155;
    const targetY = ROOM_HEIGHT / 2 + Math.sin(enemy.phase * .8) * 105;
    enemy.x += (targetX - enemy.x) * dt * 1.8;
    enemy.y += (targetY - enemy.y) * dt * 1.8;
    if (enemy.cooldown <= 0) {
      if (enemy.hp < enemy.maxHp * .55) {
        radialFire(enemy, 16);
        enemy.phase += .28;
      } else {
        enemyFire(enemy, 9, .13);
      }
      enemy.cooldown = enemy.hp < enemy.maxHp * .55 ? .72 : 1.05;
    }
    if (enemy.spawnCooldown <= 0) {
      const oldX = enemy.x;
      const oldY = enemy.y;
      enemy.x = random(300, ROOM_WIDTH - 110);
      enemy.y = random(110, ROOM_HEIGHT - 110);
      burst(oldX, oldY, "#a56891", 18, 150);
      burst(enemy.x, enemy.y, "#e986a8", 18, 150);
      enemy.spawnCooldown = 4.2;
    }
  }

  function separateEnemies() {
    for (let firstIndex = 0; firstIndex < game.enemies.length; firstIndex += 1) {
      const first = game.enemies[firstIndex];
      if (first.dead) continue;
      for (let secondIndex = firstIndex + 1; secondIndex < game.enemies.length; secondIndex += 1) {
        const second = game.enemies[secondIndex];
        if (second.dead) continue;
        const deltaX = second.x - first.x;
        const deltaY = second.y - first.y;
        const currentDistance = Math.hypot(deltaX, deltaY) || 1;
        const minimumDistance = first.radius + second.radius + 5;
        if (currentDistance >= minimumDistance) continue;
        const push = (minimumDistance - currentDistance) * .5;
        const normalX = deltaX / currentDistance;
        const normalY = deltaY / currentDistance;
        first.x -= normalX * push;
        first.y -= normalY * push;
        second.x += normalX * push;
        second.y += normalY * push;
      }
    }
  }

  function updateParticles(dt) {
    for (const particle of game.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= .93;
      particle.vy *= .93;
      particle.life -= dt;
    }
    game.particles = game.particles.filter(particle => particle.life > 0);
  }

  function updatePickups(dt) {
    for (const pickup of game.pickups) {
      if (pickup.dead) continue;
      pickup.phase += dt * 4;
      pickup.warnCooldown = Math.max(0, (pickup.warnCooldown || 0) - dt);
      if (pickup.type === "opening") {
        pickup.openTimer -= dt;
        if (pickup.openTimer <= 0) {
          pickup.type = "item";
          pickup.spawnDelay = .45;
          game.texts.push({ text: `发现 ${pickup.item.name}`, x: pickup.x, y: pickup.y - 42, life: 2 });
          burst(pickup.x, pickup.y, "#e8bb63", 18, 150);
        }
        continue;
      }
      if (pickup.spawnDelay > 0) {
        pickup.spawnDelay -= dt;
        continue;
      }
      const pickupDistance = distance(pickup, game.player);
      if (!["chest", "opening"].includes(pickup.type) && pickupDistance < game.player.pickupRadius && pickupDistance > 6) {
        const pull = Math.min(420, 110 + (game.player.pickupRadius - pickupDistance) * 5);
        pickup.x += (game.player.x - pickup.x) / pickupDistance * pull * dt;
        pickup.y += (game.player.y - pickup.y) / pickupDistance * pull * dt;
      }
      if (distance(pickup, game.player) > 28) continue;
      if (pickup.type === "chest") {
        pickup.type = "opening";
        pickup.openTimer = .55;
        pickup.phase = 0;
        burst(pickup.x, pickup.y, "#9c6b3e", 8, 80);
        continue;
      }
      if (pickup.type === "item" && pickup.price && game.player.coins < pickup.price) {
        if (!pickup.warnCooldown || pickup.warnCooldown <= 0) {
          game.texts.push({ text: `需要 ${pickup.price} 枚弹壳币`, x: pickup.x, y: pickup.y - 40, life: 1 });
          pickup.warnCooldown = 1.2;
        }
        continue;
      }
      pickup.dead = true;
      if (pickup.type === "heart") game.player.hp = Math.min(game.player.maxHp, game.player.hp + 2);
      if (pickup.type === "coin") game.player.coins += 1;
      if (pickup.type === "crown") { game.player.coins += 5; game.player.hp = game.player.maxHp; }
      if (pickup.type === "item") {
        if (pickup.price) game.player.coins -= pickup.price;
        grantItem(pickup.item);
        if (pickup.choiceGroup) game.pickups.forEach(candidate => { if (candidate.choiceGroup === pickup.choiceGroup && candidate !== pickup) candidate.dead = true; });
      }
      burst(pickup.x, pickup.y, "#74d69b", 12, 120);
      sound(pickup.type === "item" ? 520 : 680, pickup.type === "item" ? .2 : .08, "sine", .018);
    }
    game.pickups = game.pickups.filter(pickup => !pickup.dead);
  }

  function grantItem(item) {
    item.apply(game.player);
    game.itemsFound += 1;
    game.itemStacks[item.id] = (game.itemStacks[item.id] || 0) + 1;
    updateSynergies();
    game.texts.push({ text: `${item.icon} ${item.name} · ${item.detail}`, x: ROOM_WIDTH / 2, y: 122, life: 2.8 });
  }

  function updateSynergies() {
    const labels = { destroy: "摧毁", coin: "硬币", spell: "咒文", titan: "泰坦" };
    for (const tag of Object.keys(labels)) {
      const count = items.filter(item => item.tag === tag && game.itemStacks[item.id]).length;
      if (count >= 3 && !game.synergies[`${tag}3`]) {
        game.synergies[`${tag}3`] = true;
        if (tag === "destroy") game.player.explosion += .35;
        if (tag === "coin") game.player.coinPower += .012;
        if (tag === "spell") game.player.chain += 1;
        if (tag === "titan") { game.player.maxHp += 2; game.player.hp += 2; game.player.contactGuard += .15; }
        game.texts.push({ text: `${labels[tag]}流 · 三件共鸣`, x: ROOM_WIDTH / 2, y: 160, life: 3 });
      }
      if (count >= 5 && !game.synergies[`${tag}5`]) {
        game.synergies[`${tag}5`] = true;
        if (tag === "destroy") { game.player.damage += 1; game.player.deathBurst += 2; }
        if (tag === "coin") { game.player.coinPower += .025; game.player.luck += .2; }
        if (tag === "spell") { game.player.chain += 2; game.player.skillDelay *= .72; }
        if (tag === "titan") { game.player.damage += .7; game.player.armor += 2; game.player.rage = 6; }
        game.texts.push({ text: `${labels[tag]}流 · 终极成型`, x: ROOM_WIDTH / 2, y: 160, life: 3.5 });
      }
    }
  }

  function nearestEnemy() {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const enemy of game.enemies) {
      const currentDistance = distance(enemy, game.player);
      if (currentDistance < nearestDistance) { nearest = enemy; nearestDistance = currentDistance; }
    }
    return nearest;
  }

  function finish(won) {
    game.state = "ended";
    game.outcome = won ? "victory" : "defeat";
    touchUi.classList.remove("active");
    document.querySelector("#end-kicker").textContent = won ? "DUNGEON CLEARED" : "RUN OVER";
    document.querySelector("#end-title").textContent = won ? "地牢已净化" : "你倒在了门前";
    const seconds = Math.floor(game.elapsed % 60).toString().padStart(2, "0");
    const minutes = Math.floor(game.elapsed / 60);
    document.querySelector("#end-stats").innerHTML = `<span>${heroes[game.player.hero].name}</span><span>击败 ${game.kills}</span><span>Boss ${game.bossKills}/3</span><span>遗物 ${game.itemsFound}</span><span>无伤房 ${game.perfectRooms}</span><span>拆解 ${game.destroyedProps}</span><span>存活 ${minutes}:${seconds}</span><span>关卡 ${game.room + 1}/${game.rooms.length}</span>`;
    endScreen.classList.add("visible");
  }

  function render() {
    context.clearRect(0, 0, width, height);
    context.save();
    const shakeX = random(-screenShake, screenShake);
    const shakeY = random(-screenShake, screenShake);
    context.translate(offsetX + shakeX, offsetY + shakeY);
    context.scale(scale, scale);
    drawRoom();
    if (game) {
      drawObstacles();
      drawPickups();
      drawBombs();
      drawBullets();
      drawEnemies();
      drawPlayer();
      drawParticles();
      drawAtmosphere();
      drawHud();
      drawTexts();
      if (game.transition > 0) {
        context.fillStyle = `rgba(0,0,0,${game.transition})`;
        context.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
      }
    }
    context.restore();
  }

  function drawRoom() {
    const theme = game ? game.rooms[game.room].theme : 0;
    const palettes = [
      { floor: "#44393b", floorDark: "#30282b", grout: "#655154", wall: "#241d21", trim: "#6f5655", stain: "#21191d", glow: "#d29a58" },
      { floor: "#41392f", floorDark: "#2b2721", grout: "#685946", wall: "#241f1a", trim: "#735e43", stain: "#251d17", glow: "#d5aa61" },
      { floor: "#4c332f", floorDark: "#30201f", grout: "#75493f", wall: "#26191a", trim: "#824c3e", stain: "#2a1516", glow: "#e47b47" },
      { floor: "#373246", floorDark: "#252230", grout: "#574d6a", wall: "#1d1a27", trim: "#625779", stain: "#1c1625", glow: "#9d72b0" }
    ];
    const palette = palettes[theme];
    context.fillStyle = "#0e0b10";
    context.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    const floorGradient = context.createLinearGradient(0, WALL, 0, ROOM_HEIGHT - WALL);
    floorGradient.addColorStop(0, palette.floorDark);
    floorGradient.addColorStop(.22, palette.floor);
    floorGradient.addColorStop(.82, palette.floor);
    floorGradient.addColorStop(1, palette.floorDark);
    context.fillStyle = floorGradient;
    context.fillRect(WALL, WALL, ROOM_WIDTH - WALL * 2, ROOM_HEIGHT - WALL * 2);

    const roomSeed = game ? game.room * 97 + theme * 331 : 0;
    context.lineWidth = 1.4;
    for (let tileX = WALL; tileX < ROOM_WIDTH - WALL; tileX += 64) {
      for (let tileY = WALL; tileY < ROOM_HEIGHT - WALL; tileY += 54) {
        const tileSeed = roomSeed + tileX * .17 + tileY * .31;
        context.fillStyle = seeded(tileSeed) > .5 ? "#ffffff05" : "#00000008";
        context.fillRect(tileX + 3, tileY + 3, 58, 48);
        context.strokeStyle = palette.grout;
        context.globalAlpha = .45 + seeded(tileSeed + 3) * .2;
        context.beginPath();
        context.moveTo(tileX + 2, tileY + 2 + seeded(tileSeed) * 3);
        context.lineTo(tileX + 61, tileY + 2 + seeded(tileSeed + 1) * 3);
        context.lineTo(tileX + 61, tileY + 50);
        context.lineTo(tileX + 2, tileY + 50);
        context.closePath();
        context.stroke();
        context.globalAlpha = 1;
      }
    }

    drawFloorMarks(roomSeed, palette);
    drawRoomProps(roomSeed, theme, palette);
    if (game && game.rooms[game.room].kind === "boss") drawRitualCircle(palette);
    if (game && ["treasure", "shop"].includes(game.rooms[game.room].kind)) drawSpecialRoom(game.rooms[game.room], palette);

    context.fillStyle = palette.wall;
    context.fillRect(0, 0, ROOM_WIDTH, WALL);
    context.fillRect(0, ROOM_HEIGHT - WALL, ROOM_WIDTH, WALL);
    context.fillRect(0, 0, WALL, ROOM_HEIGHT);
    context.fillRect(ROOM_WIDTH - WALL, 0, WALL, ROOM_HEIGHT);
    context.fillStyle = palette.trim;
    context.globalAlpha = .58;
    context.fillRect(WALL, WALL, ROOM_WIDTH - WALL * 2, 8);
    context.fillRect(WALL, ROOM_HEIGHT - WALL - 8, ROOM_WIDTH - WALL * 2, 8);
    context.fillRect(WALL, WALL, 8, ROOM_HEIGHT - WALL * 2);
    context.fillRect(ROOM_WIDTH - WALL - 8, WALL, 8, ROOM_HEIGHT - WALL * 2);
    context.globalAlpha = 1;
    drawWallStones(palette, roomSeed);
    drawDoor(WALL - 4, ROOM_HEIGHT / 2, false);
    drawDoor(ROOM_WIDTH - WALL + 4, ROOM_HEIGHT / 2, game ? game.doorOpen : false);
    drawTorches(palette);
  }

  function drawFloorMarks(seed, palette) {
    context.save();
    for (let index = 0; index < 14; index += 1) {
      const x = WALL + 60 + seeded(seed + index * 7) * (ROOM_WIDTH - WALL * 2 - 120);
      const y = WALL + 50 + seeded(seed + index * 11) * (ROOM_HEIGHT - WALL * 2 - 100);
      const radius = 7 + seeded(seed + index * 13) * 24;
      context.fillStyle = palette.stain;
      context.globalAlpha = .08 + seeded(seed + index * 17) * .1;
      context.beginPath();
      context.ellipse(x, y, radius, radius * (.35 + seeded(seed + index * 19) * .45), seeded(seed + index * 23) * TAU, 0, TAU);
      context.fill();
    }
    context.globalAlpha = .3;
    context.strokeStyle = "#171217";
    context.lineWidth = 2;
    for (let index = 0; index < 8; index += 1) {
      const x = 90 + seeded(seed + index * 29) * 760;
      const y = 95 + seeded(seed + index * 31) * 350;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + seeded(seed + index * 37) * 22 - 11, y + 10);
      context.lineTo(x + seeded(seed + index * 41) * 34 - 17, y + 24);
      context.stroke();
    }
    context.restore();
  }

  function drawRoomProps(seed, theme, palette) {
    context.save();
    for (let index = 0; index < 6; index += 1) {
      const x = 255 + seeded(seed + index * 43) * 600;
      const y = 205 + seeded(seed + index * 47) * 250;
      const angle = seeded(seed + index * 53) * TAU;
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      if (theme === 2) drawAshProp(index, palette);
      else if (theme === 3) drawFleshProp(index, palette);
      else drawBoneProp(index, palette);
      context.restore();
    }
    context.strokeStyle = palette.trim;
    context.lineWidth = 1.5;
    context.globalAlpha = .28;
    for (const corner of [[WALL + 8, WALL + 8, 1, 1], [ROOM_WIDTH - WALL - 8, WALL + 8, -1, 1]]) {
      context.beginPath();
      for (let strand = 1; strand <= 4; strand += 1) {
        context.moveTo(corner[0], corner[1] + corner[3] * strand * 12);
        context.quadraticCurveTo(corner[0] + corner[2] * strand * 8, corner[1] + corner[3] * strand * 8, corner[0] + corner[2] * strand * 13, corner[1]);
      }
      context.stroke();
    }
    context.restore();
  }

  function drawBoneProp(index, palette) {
    context.globalAlpha = .56;
    if (index % 3 === 0) {
      context.fillStyle = "#c6b493";
      context.strokeStyle = "#33282a";
      context.lineWidth = 2;
      context.beginPath(); context.arc(-8, 0, 4, 0, TAU); context.arc(8, 0, 4, 0, TAU); context.fill(); context.stroke();
      context.beginPath(); context.moveTo(-8, -3); context.lineTo(8, -3); context.lineTo(8, 3); context.lineTo(-8, 3); context.closePath(); context.fill(); context.stroke();
    } else {
      context.fillStyle = "#21191d";
      context.beginPath(); context.ellipse(0, 4, 13, 6, 0, 0, TAU); context.fill();
      context.fillStyle = palette.trim;
      context.beginPath(); context.moveTo(-12, 4); context.lineTo(-5, -7); context.lineTo(0, 2); context.lineTo(7, -10); context.lineTo(13, 4); context.closePath(); context.fill();
    }
  }

  function drawAshProp(index, palette) {
    context.fillStyle = "#1a1517";
    context.globalAlpha = .5;
    context.beginPath(); context.ellipse(0, 8, 18, 7, 0, 0, TAU); context.fill();
    context.fillStyle = index % 2 ? "#39272a" : "#d1b58a";
    roundedRect(-5, -8, 10, 18, 3); context.fill();
    if (index % 2 === 0) {
      context.fillStyle = palette.glow;
      context.globalAlpha = .72;
      context.beginPath(); context.moveTo(0, -8); context.quadraticCurveTo(-7, -17, 1, -23); context.quadraticCurveTo(8, -15, 0, -8); context.fill();
    }
  }

  function drawFleshProp(index, palette) {
    context.strokeStyle = "#6f354d";
    context.lineWidth = 5;
    context.globalAlpha = .48;
    context.beginPath(); context.moveTo(-18, 8); context.bezierCurveTo(-8, -9, 7, 16, 19, -8); context.stroke();
    context.fillStyle = index % 2 ? "#8e4058" : palette.trim;
    context.beginPath(); context.ellipse(0, 1, 9, 7, 0, 0, TAU); context.fill();
    if (index % 2 === 0) {
      context.fillStyle = "#d8c9ad";
      context.beginPath(); context.ellipse(1, 0, 5, 3, 0, 0, TAU); context.fill();
      context.fillStyle = "#291a26";
      context.beginPath(); context.arc(2, 0, 2, 0, TAU); context.fill();
    }
  }

  function drawWallStones(palette, seed) {
    context.save();
    context.strokeStyle = palette.trim;
    context.globalAlpha = .35;
    context.lineWidth = 2;
    for (let x = 5; x < ROOM_WIDTH; x += 58) {
      const offset = seeded(seed + x) * 8;
      context.strokeRect(x, 7 + offset, 50, 27);
      context.strokeRect(x, ROOM_HEIGHT - 37 - offset * .4, 50, 27);
    }
    for (let y = 48; y < ROOM_HEIGHT - 48; y += 54) {
      context.strokeRect(6, y, 27, 46);
      context.strokeRect(ROOM_WIDTH - 34, y + seeded(seed + y) * 5, 27, 46);
    }
    context.restore();
  }

  function drawRitualCircle(palette) {
    context.save();
    context.translate(ROOM_WIDTH / 2 + 80, ROOM_HEIGHT / 2);
    context.strokeStyle = palette.glow;
    context.globalAlpha = .12;
    context.lineWidth = 4;
    context.beginPath(); context.arc(0, 0, 112, 0, TAU); context.stroke();
    context.beginPath(); context.arc(0, 0, 86, 0, TAU); context.stroke();
    for (let index = 0; index < 8; index += 1) {
      const angle = index / 8 * TAU;
      context.beginPath();
      context.moveTo(Math.cos(angle) * 88, Math.sin(angle) * 88);
      context.lineTo(Math.cos(angle + Math.PI) * 88, Math.sin(angle + Math.PI) * 88);
      context.stroke();
    }
    context.restore();
  }

  function drawSpecialRoom(room, palette) {
    context.save();
    context.globalAlpha = .4;
    context.fillStyle = room.kind === "shop" ? "#543e2b" : palette.glow;
    context.beginPath(); context.ellipse(ROOM_WIDTH / 2 + 45, ROOM_HEIGHT / 2 + 12, 245, 112, 0, 0, TAU); context.fill();
    context.globalAlpha = .32;
    context.strokeStyle = "#e3bc68";
    context.lineWidth = 3;
    context.beginPath(); context.ellipse(ROOM_WIDTH / 2 + 45, ROOM_HEIGHT / 2 + 12, 230, 98, 0, 0, TAU); context.stroke();
    context.globalAlpha = 1;
    if (room.kind === "shop") {
      context.translate(ROOM_WIDTH / 2 + 45, 154);
      context.fillStyle = "#181216";
      context.beginPath(); context.ellipse(0, 22, 34, 12, 0, 0, TAU); context.fill();
      context.fillStyle = "#73533c";
      context.strokeStyle = "#271c1e";
      context.lineWidth = 5;
      context.beginPath(); context.arc(0, 0, 26, 0, TAU); context.fill(); context.stroke();
      context.fillStyle = "#2b2022";
      context.beginPath(); context.arc(0, -12, 24, Math.PI, TAU); context.fill();
      drawEye(-8, 1, 5, 0, 0);
      drawEye(8, 1, 5, 0, 0);
      context.fillStyle = "#2e1d21";
      context.beginPath(); context.ellipse(0, 14, 8, 3, 0, 0, TAU); context.fill();
      context.fillStyle = "#e2b85c";
      context.font = "900 11px system-ui";
      context.textAlign = "center";
      context.fillText("盲眼商贩", 0, 48);
    }
    context.restore();
  }

  function drawTorches(palette) {
    for (const y of [130, ROOM_HEIGHT - 130]) {
      for (const x of [WALL + 10, ROOM_WIDTH - WALL - 10]) {
        const glow = context.createRadialGradient(x, y - 27, 2, x, y - 27, 74);
        glow.addColorStop(0, `${palette.glow}4d`);
        glow.addColorStop(1, `${palette.glow}00`);
        context.fillStyle = glow;
        context.fillRect(x - 74, y - 101, 148, 148);
        context.fillStyle = "#23191a";
        context.fillRect(x - 5, y - 16, 10, 30);
        context.fillStyle = palette.glow;
        context.globalAlpha = .45 + Math.sin((game ? game.elapsed : 0) * 9 + x + y) * .12;
        context.beginPath();
        context.moveTo(x, y - 12); context.quadraticCurveTo(x - 11, y - 28, x, y - 38); context.quadraticCurveTo(x + 11, y - 28, x, y - 12); context.fill();
        context.globalAlpha = 1;
      }
    }
  }

  function drawDoor(x, y, open) {
    context.save();
    context.translate(x, y);
    context.fillStyle = "#100d10";
    roundedRect(-18, -64, 36, 128, 15);
    context.fill();
    context.strokeStyle = "#6e5148";
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = open ? "#050405" : "#694638";
    roundedRect(-11, -49, 22, 98, 8);
    context.fill();
    if (!open) {
      context.strokeStyle = "#c18c4e";
      context.lineWidth = 4;
      for (const offset of [-24, 0, 24]) {
        context.beginPath(); context.moveTo(-10, offset - 10); context.lineTo(10, offset + 10); context.stroke();
      }
      context.fillStyle = "#dfb566";
      context.beginPath(); context.arc(0, 0, 5, 0, TAU); context.fill();
    }
    context.restore();
  }

  function drawAtmosphere() {
    const player = game.player;
    const light = context.createRadialGradient(player.x, player.y, 65, player.x, player.y, 510);
    light.addColorStop(0, "rgba(0,0,0,0)");
    light.addColorStop(.55, "rgba(0,0,0,.05)");
    light.addColorStop(1, "rgba(4,2,7,.31)");
    context.fillStyle = light;
    context.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    const vignette = context.createRadialGradient(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 170, ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 610);
    vignette.addColorStop(.5, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.43)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    if (game.rooms[game.room].modifier === "cursed") {
      context.fillStyle = "rgba(31, 13, 42, .12)";
      context.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    }
  }

  function drawPlayer() {
    const player = game.player;
    const hero = heroes[player.hero];
    const bob = Math.sin(player.walk * 2) * 2 * player.moveBlend;
    const stride = Math.sin(player.walk) * 4 * player.moveBlend;
    context.save();
    context.translate(player.x, player.y + bob);
    context.scale(1.08, 1.08);
    if (player.armor > 0) {
      context.strokeStyle = "#91d4e8";
      context.lineWidth = 4;
      context.globalAlpha = .55 + Math.sin(game.elapsed * 5) * .15;
      context.beginPath(); context.arc(0, -2, 29, 0, TAU); context.stroke();
      context.globalAlpha = 1;
    }
    if (player.invincible > 0 && Math.floor(player.invincible * 14) % 2 === 0) context.globalAlpha = .35;
    context.rotate(player.angle);
    context.fillStyle = "#100d11aa";
    context.beginPath(); context.ellipse(-3, 19, 24, 9, 0, 0, TAU); context.fill();
    drawLimb(-8, 11, -12 + stride, 20, 7, "#ceb58f");
    drawLimb(3, 12, 7 - stride, 20, 7, "#ceb58f");
    context.fillStyle = player.hero === "breaker" ? "#6d3b35" : player.hero === "gambler" ? "#6b5730" : player.hero === "seer" ? "#4c3d66" : "#315f55";
    context.strokeStyle = "#1d2523";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(-15, -1); context.quadraticCurveTo(-18, 16, -11, 22);
    context.quadraticCurveTo(0, 27, 12, 21); context.quadraticCurveTo(17, 12, 12, -3); context.closePath();
    context.fill(); context.stroke();
    context.fillStyle = hero.color;
    context.globalAlpha = .62;
    context.beginPath(); context.ellipse(-5, 8, 10, 14, -.2, 0, TAU); context.fill();
    context.globalAlpha = 1;
    context.strokeStyle = "#1f3933";
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(-7, 1); context.quadraticCurveTo(-1, 10, -5, 21); context.stroke();
    drawLimb(4, 3, 20, 1, 6, "#cfb58f");
    drawLimb(-8, 3, -18, 9, 6, "#cfb58f");
    context.fillStyle = player.flash > 0 ? "#fff" : "#dcc6a3";
    context.strokeStyle = "#281c20";
    context.lineWidth = 4;
    context.beginPath(); context.ellipse(2, -10, 19, 18, -.08, 0, TAU); context.fill(); context.stroke();
    drawFleshTexture(18, 811, "#745648");
    context.fillStyle = "#b39277";
    context.globalAlpha = .35;
    context.beginPath(); context.ellipse(-4, -3, 10, 5, 0, 0, TAU); context.fill();
    context.globalAlpha = 1;
    context.fillStyle = "#36242a";
    context.beginPath();
    context.moveTo(-14, -18); context.quadraticCurveTo(-8, -31, 0, -25);
    context.quadraticCurveTo(8, -31, 16, -20); context.quadraticCurveTo(6, -24, -2, -20); context.closePath(); context.fill();
    drawScar(-7, -8, 10, -.35, "#8d6453");
    drawEye(7, -14, 5.5, 1.5, 0);
    context.fillStyle = "#7fc4dc";
    context.globalAlpha = .9;
    context.beginPath(); context.ellipse(11, -5, 3.2, 6 + Math.sin(game.elapsed * 7), -.12, 0, TAU); context.fill();
    context.globalAlpha = 1;
    context.fillStyle = "#321e24";
    context.beginPath(); context.ellipse(17, -7, 4, 5, 0, 0, TAU); context.fill();
    if (player.hero === "breaker") {
      context.fillStyle = "#2c2022";
      context.beginPath(); context.arc(-7, -27, 7, 0, TAU); context.fill();
      context.strokeStyle = "#db6b4a"; context.lineWidth = 2; context.beginPath(); context.moveTo(-3, -31); context.lineTo(5, -36); context.stroke();
    } else if (player.hero === "gambler") {
      context.fillStyle = "#d6a94d"; context.beginPath(); context.arc(-7, -27, 7, 0, TAU); context.fill();
      context.fillStyle = "#fff0a5"; context.beginPath(); context.arc(-9, -29, 2, 0, TAU); context.fill();
    } else if (player.hero === "seer") {
      context.strokeStyle = "#bca4ea"; context.lineWidth = 3; context.beginPath(); context.arc(1, -29, 11, Math.PI, TAU); context.stroke();
      context.fillStyle = "#bca4ea"; context.beginPath(); context.arc(2, -30, 2, 0, TAU); context.fill();
    } else {
      context.strokeStyle = "#779e82"; context.lineWidth = 4; context.beginPath(); context.moveTo(-16, -16); context.lineTo(-22, -27); context.moveTo(16, -17); context.lineTo(22, -28); context.stroke();
    }
    if (player.rage > 0) {
      context.strokeStyle = hero.color; context.lineWidth = 3; context.globalAlpha = .5 + Math.sin(game.elapsed * 14) * .25;
      context.beginPath(); context.arc(0, -2, 34, 0, TAU); context.stroke(); context.globalAlpha = 1;
    }
    if (game.itemStacks.powder) {
      context.fillStyle = "#6f3e2c";
      context.beginPath(); context.moveTo(-10, -24); context.lineTo(-2, -37); context.lineTo(2, -23); context.fill();
    }
    if (game.itemStacks.halo) {
      context.strokeStyle = "#f2d477";
      context.lineWidth = 3;
      context.globalAlpha = .8;
      context.beginPath(); context.ellipse(1, -31, 17, 5, 0, 0, TAU); context.stroke();
      context.globalAlpha = 1;
    }
    context.fillStyle = "#6f5437";
    context.strokeStyle = "#21181a";
    context.lineWidth = 3;
    roundedRect(17, -4, 20, 8, 3); context.fill(); context.stroke();
    context.fillStyle = "#e2b55d";
    context.fillRect(31, -2, 8, 4);
    context.restore();
  }

  function drawEnemies() {
    for (const enemy of game.enemies) {
      context.save();
      context.translate(enemy.x, enemy.y);
      context.rotate(enemy.angle);
      if (enemy.elite) {
        context.strokeStyle = "#f0b85c";
        context.lineWidth = 3;
        context.globalAlpha = .42 + Math.sin(game.elapsed * 5 + enemy.id) * .12;
        context.beginPath(); context.arc(0, 0, enemy.radius + 8, 0, TAU); context.stroke();
        context.globalAlpha = 1;
      }
      context.fillStyle = "#100c10aa";
      context.beginPath(); context.ellipse(-2, enemy.radius * .9, enemy.radius * 1.25, enemy.radius * .48, 0, 0, TAU); context.fill();
      if (enemy.type === "grunt") drawGrunt(enemy);
      else if (enemy.type === "turret") drawTurret(enemy);
      else if (enemy.type === "charger") drawCharger(enemy);
      else if (enemy.type === "bat") drawBat(enemy);
      else if (enemy.type === "splitter") drawSplitter(enemy);
      else if (enemy.type === "leech") drawLeech(enemy);
      else if (enemy.type === "cultist") drawCultist(enemy);
      else if (enemy.type === "bomber") drawBomber(enemy);
      else drawBoss(enemy);
      context.restore();
      if (!["grunt", "bat", "leech"].includes(enemy.type)) drawHealthBar(enemy);
    }
  }

  function drawObstacles() {
    for (const obstacle of game.obstacles) {
      if (obstacle.dead) continue;
      context.save();
      context.translate(obstacle.x, obstacle.y);
      context.fillStyle = "#100d11aa";
      context.beginPath(); context.ellipse(2, obstacle.radius * .72, obstacle.radius * 1.1, obstacle.radius * .38, 0, 0, TAU); context.fill();
      if (obstacle.type === "rock") {
        drawBlob(obstacle.radius, 9, obstacle.x + obstacle.y, "#625b50", "#282327", 5);
        context.fillStyle = "#948b77";
        context.globalAlpha = .42;
        context.beginPath(); context.ellipse(-7, -8, 10, 6, -.45, 0, TAU); context.fill();
        context.globalAlpha = 1;
        context.strokeStyle = "#393238";
        context.lineWidth = 2;
        context.beginPath(); context.moveTo(-3, -19); context.lineTo(4, -5); context.lineTo(14, 0); context.stroke();
      } else if (obstacle.type === "urn") {
        context.fillStyle = "#886347";
        context.strokeStyle = "#2c2020";
        context.lineWidth = 4;
        context.beginPath(); context.moveTo(-11, -15); context.lineTo(11, -15); context.quadraticCurveTo(17, 1, 10, 17); context.quadraticCurveTo(0, 22, -10, 17); context.quadraticCurveTo(-17, 1, -11, -15); context.fill(); context.stroke();
        context.fillStyle = "#c2935b";
        context.fillRect(-13, -18, 26, 6);
        context.strokeStyle = "#4d3328";
        context.beginPath(); context.moveTo(-10, 1); context.lineTo(10, 1); context.stroke();
      } else {
        context.rotate(Math.sin(game.elapsed * 2 + obstacle.pulse) * .06);
        context.fillStyle = "#86704b";
        context.strokeStyle = "#2c2420";
        context.lineWidth = 3;
        for (let index = 0; index < 4; index += 1) {
          const angle = index / 4 * TAU;
          context.beginPath(); context.moveTo(Math.cos(angle - .35) * 6, Math.sin(angle - .35) * 6); context.lineTo(Math.cos(angle) * 25, Math.sin(angle) * 25); context.lineTo(Math.cos(angle + .35) * 6, Math.sin(angle + .35) * 6); context.closePath(); context.fill(); context.stroke();
        }
      }
      context.restore();
    }
  }

  function drawBombs() {
    for (const bomb of game.bombs) {
      const warning = 1 - clamp(bomb.timer / 1.2, 0, 1);
      context.save();
      context.translate(bomb.x, bomb.y);
      context.strokeStyle = `rgba(235, 79, 61, ${.32 + warning * .55})`;
      context.lineWidth = 3;
      context.beginPath(); context.arc(0, 0, 82 * warning, 0, TAU); context.stroke();
      context.fillStyle = "#221b1d";
      context.strokeStyle = "#d7a04f";
      context.lineWidth = 3;
      context.beginPath(); context.arc(0, 0, 12 + Math.sin(bomb.pulse) * 2, 0, TAU); context.fill(); context.stroke();
      context.fillStyle = warning > .7 ? "#fff0b0" : "#e85e43";
      context.beginPath(); context.arc(4, -5, 3, 0, TAU); context.fill();
      context.restore();
    }
  }

  function drawGrunt(enemy) {
    const twitch = Math.sin(enemy.phase * 5) * 2;
    drawLimb(-8, 10, -13, 18 + twitch, 6, "#a94a4b");
    drawLimb(7, 10, 12, 18 - twitch, 6, "#a94a4b");
    drawBlob(18, 12, enemy.id, enemy.flash > 0 ? "#fff" : "#b84a4c", "#361e24", 4);
    drawFleshTexture(18, enemy.id * 7, "#5e202a");
    context.fillStyle = "#d76c64";
    context.globalAlpha = .5;
    context.beginPath(); context.ellipse(-5, -6, 8, 5, -.4, 0, TAU); context.fill();
    context.globalAlpha = 1;
    drawEye(3, -5, 5, 2, 0, true);
    context.fillStyle = "#351d23";
    context.beginPath(); context.ellipse(10, 7, 8, 5, 0, 0, TAU); context.fill();
    context.fillStyle = "#ead3a5";
    for (const tooth of [-3, 2]) context.fillRect(11, tooth, 5, 2);
    drawScar(-8, 7, 11, .5);
    context.fillStyle = "#97c3c0";
    context.globalAlpha = .72;
    context.beginPath(); context.ellipse(14, 13, 2, 5, -.2, 0, TAU); context.fill();
    context.globalAlpha = 1;
    context.fillStyle = "#282026";
    roundedRect(14, -5, 24, 10, 4); context.fill();
    context.fillStyle = "#b58a4c";
    context.fillRect(32, -3, 8, 6);
  }

  function drawTurret(enemy) {
    context.rotate(-enemy.angle);
    drawBlob(23, 10, enemy.id, enemy.flash > 0 ? "#fff" : "#79513f", "#2a1b1c", 5);
    context.strokeStyle = "#b2784e";
    context.lineWidth = 4;
    for (let angle = 0; angle < TAU; angle += TAU / 6) {
      context.beginPath(); context.moveTo(Math.cos(angle) * 13, Math.sin(angle) * 13); context.lineTo(Math.cos(angle) * 21, Math.sin(angle) * 21); context.stroke();
    }
    context.fillStyle = "#d9b664";
    context.strokeStyle = "#33231e";
    context.lineWidth = 3;
    context.beginPath(); context.arc(0, 0, 12, 0, TAU); context.fill(); context.stroke();
    context.strokeStyle = "#6c452f";
    context.lineWidth = 2;
    context.beginPath(); context.arc(0, 0, 17, 0, TAU); context.stroke();
    context.fillStyle = "#f1d27b";
    for (let index = 0; index < 4; index += 1) {
      const angle = index * Math.PI / 2;
      context.beginPath(); context.arc(Math.cos(angle) * 15, Math.sin(angle) * 15, 2, 0, TAU); context.fill();
    }
    drawEye(0, 0, 7, Math.cos(enemy.angle) * 2, Math.sin(enemy.angle) * 2, true);
    context.rotate(enemy.angle);
    context.fillStyle = "#21191d";
    roundedRect(5, -7, 38, 14, 5); context.fill();
    context.fillStyle = "#a87945";
    context.fillRect(32, -4, 12, 8);
  }

  function drawCharger(enemy) {
    if (enemy.windup > 0) {
      context.save();
      context.rotate(-enemy.angle);
      context.strokeStyle = `rgba(241, 174, 83, ${.25 + Math.sin(enemy.windup * 38) * .18})`;
      context.lineWidth = 5;
      context.setLineDash([12, 9]);
      context.beginPath();
      context.moveTo(20, 0);
      context.lineTo(Math.cos(enemy.chargeAngle) * 170, Math.sin(enemy.chargeAngle) * 170);
      context.stroke();
      context.setLineDash([]);
      context.restore();
    }
    drawLimb(-10, 11, -16, 22, 7, "#74613f");
    drawLimb(7, 11, 13, 22, 7, "#74613f");
    context.fillStyle = enemy.flash > 0 ? "#fff" : enemy.charge > 0 ? "#d77a48" : "#837348";
    context.strokeStyle = "#2d231c";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(23, 0); context.quadraticCurveTo(8, -18, -16, -15); context.lineTo(-22, 0); context.lineTo(-16, 15); context.quadraticCurveTo(8, 18, 23, 0); context.closePath(); context.fill(); context.stroke();
    context.strokeStyle = "#54472d";
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(-13, -10); context.quadraticCurveTo(0, -3, 17, -5); context.stroke();
    context.beginPath(); context.moveTo(-13, 10); context.quadraticCurveTo(1, 3, 17, 5); context.stroke();
    drawFleshTexture(17, enemy.id * 11, "#2d2a1d");
    context.fillStyle = "#e6c779";
    context.strokeStyle = "#37281e";
    context.lineWidth = 3;
    context.beginPath(); context.moveTo(-7, -12); context.lineTo(-17, -29); context.lineTo(2, -17); context.closePath(); context.fill(); context.stroke();
    context.beginPath(); context.moveTo(-7, 12); context.lineTo(-17, 29); context.lineTo(2, 17); context.closePath(); context.fill(); context.stroke();
    drawEye(8, 0, 6, 2, 0, true);
  }

  function drawBat(enemy) {
    const flap = Math.sin(enemy.phase * 6) * 7;
    context.fillStyle = enemy.flash > 0 ? "#fff" : "#70566f";
    context.strokeStyle = "#281c29";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(0, 0); context.quadraticCurveTo(-17, -19 - flap, -31, -5); context.lineTo(-22, 5); context.lineTo(-13, 2); context.lineTo(-8, 11);
    context.quadraticCurveTo(0, 16, 8, 11); context.lineTo(13, 2); context.lineTo(22, 5); context.lineTo(31, -5); context.quadraticCurveTo(17, -19 - flap, 0, 0); context.fill(); context.stroke();
    context.strokeStyle = "#9a728d";
    context.globalAlpha = .55;
    context.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      context.beginPath(); context.moveTo(side * 4, 1); context.lineTo(side * 24, -7 - flap * .45); context.stroke();
      context.beginPath(); context.moveTo(side * 7, 3); context.lineTo(side * 19, 4); context.stroke();
    }
    context.globalAlpha = 1;
    context.fillStyle = "#d8b36a";
    context.strokeStyle = "#30211f";
    context.lineWidth = 3;
    context.beginPath(); context.arc(0, 1, 9, 0, TAU); context.fill(); context.stroke();
    context.fillStyle = "#f25d62";
    context.beginPath(); context.arc(4, -2, 2.5, 0, TAU); context.fill();
    context.fillStyle = "#efe0ba";
    context.beginPath(); context.moveTo(5, 7); context.lineTo(9, 13); context.lineTo(1, 8); context.fill();
  }

  function drawSplitter(enemy) {
    context.rotate(-enemy.angle);
    context.fillStyle = enemy.flash > 0 ? "#fff" : "#657c59";
    context.strokeStyle = "#263021";
    context.lineWidth = 4;
    context.beginPath();
    for (let point = 0; point < 12; point += 1) {
      const angle = point / 12 * TAU;
      const radius = point % 2 ? 14 : 21;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (point === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath(); context.fill(); context.stroke();
    context.fillStyle = "#90a66d";
    context.globalAlpha = .45;
    context.beginPath(); context.arc(-5, -6, 7, 0, TAU); context.fill();
    context.globalAlpha = 1;
    context.fillStyle = "#9ab77d";
    context.globalAlpha = .32;
    for (const spot of [[-10, 7, 4], [7, -8, 5], [12, 9, 3]]) {
      context.beginPath(); context.arc(spot[0], spot[1], spot[2], 0, TAU); context.fill();
    }
    context.globalAlpha = 1;
    drawEye(-4, 1, 5, 0, 0, true);
    drawEye(7, 3, 4, 0, 0, true);
    context.strokeStyle = "#263021";
    context.lineWidth = 2;
    context.beginPath(); context.moveTo(-6, 11); context.quadraticCurveTo(0, 15, 8, 10); context.stroke();
  }

  function drawLeech(enemy) {
    const wiggle = Math.sin(enemy.phase * 7) * 4;
    context.rotate(-enemy.angle);
    context.strokeStyle = "#2b171d";
    context.lineWidth = 15;
    context.lineCap = "round";
    context.beginPath(); context.moveTo(-16, wiggle); context.quadraticCurveTo(0, -wiggle, 15, 0); context.stroke();
    context.strokeStyle = enemy.flash > 0 ? "#fff" : "#9d3948";
    context.lineWidth = 10;
    context.stroke();
    context.fillStyle = "#28151c";
    context.beginPath(); context.ellipse(14, 0, 8, 7, 0, 0, TAU); context.fill();
    context.fillStyle = "#ead7b1";
    for (let index = -1; index <= 1; index += 1) {
      context.beginPath(); context.moveTo(11, index * 3); context.lineTo(18, index * 3 - 2); context.lineTo(18, index * 3 + 2); context.fill();
    }
    context.fillStyle = "#d86266";
    context.beginPath(); context.arc(-15, wiggle, 4, 0, TAU); context.fill();
  }

  function drawCultist(enemy) {
    context.rotate(-enemy.angle);
    const sway = Math.sin(enemy.phase * 3) * 2;
    drawLimb(-8, 9, -13, 20 + sway, 6, "#77628b");
    drawLimb(7, 9, 12, 20 - sway, 6, "#77628b");
    context.fillStyle = enemy.flash > 0 ? "#fff" : "#4c3a5e";
    context.strokeStyle = "#241927";
    context.lineWidth = 4;
    context.beginPath(); context.moveTo(0, -23); context.quadraticCurveTo(-22, -4, -18, 21); context.lineTo(18, 21); context.quadraticCurveTo(22, -4, 0, -23); context.fill(); context.stroke();
    context.fillStyle = "#211821";
    context.beginPath(); context.ellipse(0, -5, 12, 10, 0, 0, TAU); context.fill();
    drawEye(0, -5, 7, Math.cos(enemy.angle) * 2, Math.sin(enemy.angle) * 2, true);
    context.strokeStyle = "#b89ad2";
    context.lineWidth = 2;
    context.beginPath(); context.arc(0, 12, 6, 0, TAU); context.stroke();
    context.beginPath(); context.moveTo(-5, 12); context.lineTo(5, 12); context.moveTo(0, 7); context.lineTo(0, 17); context.stroke();
  }

  function drawBomber(enemy) {
    context.rotate(-enemy.angle);
    drawLimb(-9, 11, -15, 22, 7, "#88654b");
    drawLimb(8, 11, 14, 22, 7, "#88654b");
    drawBlob(22, 12, enemy.id * 5, enemy.flash > 0 ? "#fff" : "#76513f", "#291c1d", 5);
    drawFleshTexture(20, enemy.id * 17, "#3e2525");
    context.fillStyle = "#241a1d";
    context.beginPath(); context.arc(5, 1, 12, 0, TAU); context.fill();
    context.fillStyle = "#d7ab59";
    context.beginPath(); context.arc(5, 1, 7, 0, TAU); context.fill();
    context.fillStyle = "#392329";
    context.beginPath(); context.arc(7, 1, 3, 0, TAU); context.fill();
    context.strokeStyle = "#d66343";
    context.lineWidth = 3;
    context.beginPath(); context.moveTo(-8, -13); context.quadraticCurveTo(-18, -25, -7, -31); context.stroke();
    context.fillStyle = "#f5cf68";
    context.beginPath(); context.arc(-7, -31, 3, 0, TAU); context.fill();
  }

  function drawBoss(enemy) {
    context.scale(1.28, 1.28);
    if (enemy.type === "bossBrood") drawBroodBoss(enemy);
    else if (enemy.type === "bossHeart") drawHeartBoss(enemy);
    else drawWardenBoss(enemy);
  }

  function drawBroodBoss(enemy) {
    const pulse = 1 + Math.sin(enemy.phase * 3) * .035;
    context.scale(pulse, 1 / pulse);
    drawLimb(-18, -20, -36, -33, 11, "#875143");
    drawLimb(-19, 20, -37, 32, 11, "#875143");
    drawBlob(40, 14, enemy.id, enemy.flash > 0 ? "#fff" : "#875044", "#301d1d", 6);
    drawFleshTexture(39, enemy.id * 31, "#431f24");
    context.fillStyle = "#b06d57";
    context.strokeStyle = "#3a2320";
    context.lineWidth = 4;
    context.beginPath(); context.arc(-25, -18, 17, 0, TAU); context.arc(-27, 17, 15, 0, TAU); context.fill(); context.stroke();
    context.fillStyle = "#d79473";
    context.globalAlpha = .38;
    context.beginPath(); context.ellipse(-8, -14, 18, 9, -.3, 0, TAU); context.fill();
    context.globalAlpha = 1;
    drawScar(-12, 17, 18, -.4, "#5e2928");
    context.fillStyle = "#20171a";
    context.strokeStyle = "#3b2020";
    context.lineWidth = 4;
    context.beginPath(); context.ellipse(14, 1, 17, 19, 0, 0, TAU); context.fill(); context.stroke();
    context.fillStyle = "#e6c57d";
    for (let tooth = -2; tooth <= 2; tooth += 1) {
      context.beginPath();
      context.moveTo(11, tooth * 6 - 2); context.lineTo(25 + Math.abs(tooth) * 2, tooth * 6); context.lineTo(11, tooth * 6 + 3); context.fill();
    }
    drawEye(-4, -8, 7, 2, 1, true);
    context.fillStyle = "#afd0b5";
    context.globalAlpha = .55;
    context.beginPath(); context.ellipse(25, 21, 3, 8, -.15, 0, TAU); context.fill();
    context.globalAlpha = 1;
    if (enemy.windup > 0) {
      context.strokeStyle = "#f0b258"; context.lineWidth = 5;
      context.beginPath(); context.moveTo(30, 0); context.lineTo(180, 0); context.stroke();
    }
  }

  function drawWardenBoss(enemy) {
    context.save();
    context.rotate(-enemy.phase * .16);
    drawBlob(36, 14, enemy.id, enemy.flash > 0 ? "#fff" : "#62425c", "#271b28", 6);
    context.fillStyle = "#d7aa53";
    for (let index = 0; index < 6; index += 1) {
      const angle = index / 6 * TAU;
      context.beginPath();
      context.moveTo(Math.cos(angle - .16) * 28, Math.sin(angle - .16) * 28);
      context.lineTo(Math.cos(angle) * 44, Math.sin(angle) * 44);
      context.lineTo(Math.cos(angle + .16) * 28, Math.sin(angle + .16) * 28);
      context.fill(); context.strokeStyle = "#47321f"; context.lineWidth = 2; context.stroke();
    }
    context.restore();
    context.fillStyle = "#7f5772";
    context.beginPath(); context.ellipse(-5, -5, 21, 24, 0, 0, TAU); context.fill();
    drawFleshTexture(23, enemy.id * 37, "#352136");
    context.strokeStyle = "#d1a956";
    context.lineWidth = 3;
    context.beginPath(); context.arc(-5, -5, 27, -.75, 1.1); context.stroke();
    drawEye(3, -7, 10, 2, 1, true);
    context.fillStyle = "#241a25";
    roundedRect(15, -8, 44, 16, 6); context.fill();
    context.fillStyle = "#efce80";
    context.fillRect(48, -5, 13, 10);
    context.strokeStyle = "#b28a54";
    context.lineWidth = 3;
    context.beginPath(); context.arc(-16, 13, 9, 0, TAU); context.stroke();
    context.beginPath(); context.arc(-25, 22, 6, 0, TAU); context.stroke();
  }

  function drawHeartBoss(enemy) {
    context.rotate(-enemy.angle);
    const beat = 1 + Math.max(0, Math.sin(enemy.phase * 5)) * .08;
    context.scale(beat, beat);
    context.fillStyle = enemy.flash > 0 ? "#fff" : "#9e3f53";
    context.strokeStyle = "#381c27";
    context.lineWidth = 6;
    context.beginPath();
    context.arc(-17, -9, 23, Math.PI, 0);
    context.arc(17, -9, 23, Math.PI, 0);
    context.lineTo(0, 39);
    context.closePath();
    context.fill(); context.stroke();
    drawFleshTexture(38, enemy.id * 41, "#521f32");
    context.strokeStyle = "#c66773";
    context.lineWidth = 5;
    context.beginPath(); context.moveTo(-16, -25); context.bezierCurveTo(-30, -38, -24, -48, -33, -56); context.stroke();
    context.beginPath(); context.moveTo(15, -26); context.bezierCurveTo(29, -39, 22, -48, 34, -57); context.stroke();
    context.strokeStyle = "#d98087";
    context.lineWidth = 3;
    context.beginPath(); context.moveTo(0, -24); context.lineTo(-4, 5); context.lineTo(8, 17); context.lineTo(0, 33); context.stroke();
    drawScar(-16, 14, 15, -.72, "#6e283a");
    drawEye(-10, -9, 6, 0, 1, true);
    drawEye(11, -9, 6, 0, 1, true);
    context.fillStyle = "#4d202d";
    context.beginPath(); context.ellipse(0, 13, 9, 5, 0, 0, TAU); context.fill();
  }

  function drawHealthBar(enemy) {
    const boss = isBoss(enemy);
    const barWidth = boss ? 300 : 52;
    const y = boss ? ROOM_HEIGHT - 26 : enemy.y - enemy.radius - 14;
    const x = boss ? ROOM_WIDTH / 2 - barWidth / 2 : enemy.x - barWidth / 2;
    context.fillStyle = "#161218";
    context.fillRect(x - 2, y - 2, barWidth + 4, 10);
    context.fillStyle = boss ? "#c04f61" : "#d99449";
    context.fillRect(x, y, barWidth * enemy.hp / enemy.maxHp, 6);
    if (boss) {
      context.fillStyle = "#e9d4b0";
      context.font = "800 12px system-ui";
      context.textAlign = "center";
      context.fillText(game.rooms[game.room].name, ROOM_WIDTH / 2, y - 7);
      context.textAlign = "left";
    }
  }

  function drawBullets() {
    for (const bullet of game.bullets) {
      context.save();
      context.translate(bullet.x, bullet.y);
      context.rotate(Math.atan2(bullet.vy, bullet.vx));
      context.fillStyle = bullet.coin ? "#ffe079" : bullet.chain ? "#d6c4ff" : bullet.explosion ? "#ffc079" : bullet.critical ? "#fffbd1" : "#fff0a6";
      context.shadowColor = bullet.coin ? "#ffd13b" : bullet.chain ? "#9a7df0" : bullet.critical ? "#fff" : "#ffb52e"; context.shadowBlur = bullet.critical ? 17 : 10;
      context.strokeStyle = bullet.chain ? "#67528c" : "#906a38";
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(bullet.radius * 1.6, 0);
      context.quadraticCurveTo(-bullet.radius * .4, -bullet.radius * 1.2, -bullet.radius * 1.35, 0);
      context.quadraticCurveTo(-bullet.radius * .4, bullet.radius * 1.2, bullet.radius * 1.6, 0);
      context.fill(); context.stroke();
      context.restore();
    }
    context.shadowBlur = 0;
    for (const bullet of game.enemyBullets) {
      context.fillStyle = "#b93646";
      context.shadowColor = "#e94b5d";
      context.shadowBlur = 9;
      context.beginPath(); context.arc(bullet.x, bullet.y, bullet.radius + 1, 0, TAU); context.fill();
      context.fillStyle = "#ff9a91";
      context.beginPath(); context.arc(bullet.x - 2, bullet.y - 2, Math.max(1.5, bullet.radius * .35), 0, TAU); context.fill();
    }
    context.shadowBlur = 0;
  }

  function drawPickups() {
    for (const pickup of game.pickups) {
      const bob = Math.sin(pickup.phase) * 4;
      context.save(); context.translate(pickup.x, pickup.y + bob);
      context.fillStyle = "#0d0a0e88";
      context.beginPath(); context.ellipse(0, 23, 30, 9, 0, 0, TAU); context.fill();
      if (pickup.type === "chest" || pickup.type === "opening") {
        const opening = pickup.type === "opening";
        context.fillStyle = "#321f1c";
        context.strokeStyle = "#231719";
        context.lineWidth = 4;
        roundedRect(-27, -8, 54, 34, 5); context.fill(); context.stroke();
        context.fillStyle = "#805136";
        roundedRect(-23, -5, 46, 27, 4); context.fill();
        context.fillStyle = "#a56c3c";
        context.save();
        context.translate(0, -8);
        context.rotate(opening ? -0.55 : 0);
        context.beginPath(); context.arc(0, 0, 24, Math.PI, TAU); context.fill(); context.stroke();
        context.restore();
        context.fillStyle = "#d3a34e";
        context.fillRect(-4, -8, 8, 31);
        context.fillRect(-23, 1, 46, 6);
        context.fillStyle = "#f0cf73";
        context.beginPath(); context.arc(0, 10, 4, 0, TAU); context.fill();
      } else if (pickup.type === "item") {
        context.shadowColor = "#f2c96d";
        context.shadowBlur = 18 + Math.sin(pickup.phase) * 5;
        context.fillStyle = "#e7c26b33";
        context.beginPath(); context.arc(0, -7, 23, 0, TAU); context.fill();
        context.shadowBlur = 0;
        drawItemGlyph(pickup.item, 0, -8, 1.15);
        context.fillStyle = "#392923";
        context.strokeStyle = "#21181a";
        context.lineWidth = 3;
        context.beginPath(); context.moveTo(-25, 21); context.lineTo(-18, 8); context.lineTo(18, 8); context.lineTo(25, 21); context.closePath(); context.fill(); context.stroke();
        context.textAlign = "center";
        context.font = "800 11px system-ui";
        context.fillStyle = "#f4e6c4";
        context.fillText(pickup.item.name, 0, 39);
        context.font = "800 10px system-ui";
        context.fillStyle = pickup.price ? "#efc45e" : "#a99b88";
        context.fillText(pickup.price ? `◉ ${pickup.price}` : pickup.item.detail, 0, 52);
        context.textAlign = "left";
      } else if (pickup.type === "heart") {
        context.fillStyle = "#df5954";
        context.strokeStyle = "#521f2a"; context.lineWidth = 2;
        context.beginPath(); context.arc(-5, -2, 7, 0, TAU); context.arc(5, -2, 7, 0, TAU); context.lineTo(0, 12); context.closePath(); context.fill(); context.stroke();
      } else {
        context.fillStyle = pickup.type === "crown" ? "#f8dd72" : "#dca84e";
        context.strokeStyle = "#694327"; context.lineWidth = 2;
        context.beginPath(); context.arc(0, 0, pickup.type === "crown" ? 12 : 8, 0, TAU); context.fill(); context.stroke();
        context.fillStyle = "#fff0a0"; context.beginPath(); context.arc(-3, -3, 2, 0, TAU); context.fill();
      }
      context.restore();
    }
  }

  function drawItemGlyph(item, x, y, scaleValue = 1) {
    context.save();
    context.translate(x, y);
    context.scale(scaleValue, scaleValue);
    context.strokeStyle = "#2b1d20";
    context.fillStyle = "#e4bd63";
    context.lineWidth = 3;
    context.lineCap = "round";
    if (item.id === "powder") {
      context.beginPath(); context.arc(0, 3, 10, 0, TAU); context.fill(); context.stroke();
      context.strokeStyle = "#d75c47"; context.beginPath(); context.moveTo(4, -6); context.quadraticCurveTo(10, -14, 15, -9); context.stroke();
    } else if (item.id === "gear") {
      context.beginPath();
      for (let index = 0; index < 16; index += 1) { const angle = index / 16 * TAU; const radius = index % 2 ? 9 : 14; const px = Math.cos(angle) * radius; const py = Math.sin(angle) * radius; if (!index) context.moveTo(px, py); else context.lineTo(px, py); }
      context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#4b3429"; context.beginPath(); context.arc(0, 0, 4, 0, TAU); context.fill();
    } else if (item.id === "boots") {
      context.beginPath(); context.moveTo(-7, -12); context.lineTo(2, -12); context.lineTo(3, 3); context.quadraticCurveTo(13, 4, 13, 11); context.lineTo(-8, 11); context.closePath(); context.fill(); context.stroke();
    } else if (item.id === "barrel") {
      roundedRect(-14, -6, 28, 12, 4); context.fill(); context.stroke(); context.fillStyle = "#8b5d3c"; context.fillRect(5, -8, 4, 16);
    } else if (item.id === "split") {
      context.beginPath(); context.moveTo(0, 12); context.lineTo(0, -2); context.moveTo(0, 1); context.lineTo(-11, -10); context.moveTo(0, 1); context.lineTo(11, -10); context.stroke();
      context.fillStyle = "#f1d483"; for (const point of [[0,12],[-11,-10],[11,-10]]) { context.beginPath(); context.arc(point[0], point[1], 4, 0, TAU); context.fill(); }
    } else if (item.id === "heart") {
      context.fillStyle = "#c84d55"; context.beginPath(); context.arc(-6, -4, 7, Math.PI, 0); context.arc(6, -4, 7, Math.PI, 0); context.lineTo(0, 13); context.closePath(); context.fill(); context.stroke();
    } else if (item.id === "lens") {
      context.fillStyle = "#eee0b8"; context.beginPath(); context.ellipse(0, 0, 14, 9, 0, 0, TAU); context.fill(); context.stroke(); context.fillStyle = "#7998a5"; context.beginPath(); context.arc(0, 0, 5, 0, TAU); context.fill();
    } else if (item.id === "needle") {
      context.beginPath(); context.moveTo(-14, 10); context.lineTo(12, -11); context.stroke(); context.fillStyle = "#d9d1b7"; context.beginPath(); context.moveTo(12, -11); context.lineTo(7, -10); context.lineTo(11, -5); context.closePath(); context.fill();
    } else if (item.id === "magnet") {
      context.strokeStyle = "#a64e4e"; context.lineWidth = 8; context.beginPath(); context.arc(0, 0, 10, 0, Math.PI); context.stroke(); context.strokeStyle = "#d8d0ba"; context.lineWidth = 4; context.beginPath(); context.moveTo(-10, 0); context.lineTo(-10, 8); context.moveTo(10, 0); context.lineTo(10, 8); context.stroke();
    } else if (item.id === "cloak") {
      context.fillStyle = "#6a526f"; context.beginPath(); context.moveTo(0, -14); context.quadraticCurveTo(-15, -2, -12, 14); context.lineTo(0, 8); context.lineTo(12, 14); context.quadraticCurveTo(15, -2, 0, -14); context.fill(); context.stroke();
    } else if (item.id === "candle") {
      context.fillStyle = "#e3d0a4"; roundedRect(-6, -2, 12, 16, 3); context.fill(); context.stroke(); context.fillStyle = "#e77b45"; context.beginPath(); context.moveTo(0, -3); context.quadraticCurveTo(-7, -11, 1, -17); context.quadraticCurveTo(8, -9, 0, -3); context.fill();
    } else if (item.id === "halo") {
      context.strokeStyle = "#f4d675"; context.lineWidth = 5; context.beginPath(); context.ellipse(0, 0, 14, 7, 0, 0, TAU); context.stroke();
    } else if (item.id === "shield") {
      context.fillStyle = "#72a9bd"; context.beginPath(); context.moveTo(0, -14); context.lineTo(13, -8); context.lineTo(10, 8); context.lineTo(0, 15); context.lineTo(-10, 8); context.lineTo(-13, -8); context.closePath(); context.fill(); context.stroke();
    } else {
      const colors = { destroy: "#cf6548", coin: "#e1b555", spell: "#9d82d0", titan: "#79a183" };
      context.fillStyle = colors[item.tag] || "#e4bd63";
      context.beginPath();
      for (let index = 0; index < 10; index += 1) {
        const angle = index / 10 * TAU - Math.PI / 2;
        const radius = index % 2 ? 7 : 14;
        if (!index) context.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        else context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#f8edcf";
      context.font = "900 12px serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(item.icon, 0, 1);
    }
    context.restore();
  }

  function drawParticles() {
    for (const particle of game.particles) {
      context.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      if (particle.ring) {
        const progress = 1 - particle.life / particle.maxLife;
        context.strokeStyle = particle.color;
        context.lineWidth = 5 * (1 - progress);
        context.beginPath(); context.arc(particle.x, particle.y, particle.size + progress * 150, 0, TAU); context.stroke();
      } else {
        context.fillStyle = particle.color;
        context.beginPath(); context.arc(particle.x, particle.y, particle.size, 0, TAU); context.fill();
      }
    }
    context.globalAlpha = 1;
  }

  function drawHud() {
    const player = game.player;
    const room = game.rooms[game.room];
    drawHudPanel(55, 55, 242, 64);
    context.fillStyle = "#f6e2b4";
    context.font = "700 15px system-ui";
    context.fillText(`第${room.chapter + 1}章·${room.floorRoom}  ${room.name}`, 70, 78);
    if (room.modifier) {
      context.fillStyle = roomModifiers[room.modifier].color;
      context.font = "900 10px system-ui";
      context.fillText(`◆ ${roomModifiers[room.modifier].name}`, 238, 78);
    }
    for (let index = 0; index < player.maxHp; index += 2) {
      const full = player.hp >= index + 2;
      const half = player.hp === index + 1;
      drawHeart(74 + index / 2 * 27, 97, full, half);
    }
    context.fillStyle = "#c6aa72";
    context.font = "700 14px system-ui";
    context.fillText(`◉ ${player.coins}  ◆ ${player.armor}`, 220, 101);
    drawMinimap();
    drawStats();
    drawBuildHud();
    drawItems();
    if (game.combo >= 2) {
      context.textAlign = "center";
      context.fillStyle = game.combo >= 10 ? "#ffd36c" : "#f0cfa2";
      context.font = `900 ${18 + Math.min(10, game.combo)}px system-ui`;
      context.fillText(`${game.combo} 连杀`, ROOM_WIDTH / 2, 126);
      context.textAlign = "left";
    }
    if (game.doorOpen && game.room < game.rooms.length - 1) {
      context.fillStyle = "#f5d27c";
      context.font = "700 13px system-ui";
      context.textAlign = "right";
      context.fillText("出口已开启  →", ROOM_WIDTH - 60, 74);
      context.textAlign = "left";
    }
  }

  function drawHeart(x, y, full, half) {
    context.fillStyle = full ? "#d74f4d" : half ? "#9c3f42" : "#3d3036";
    context.beginPath(); context.arc(x - 4, y - 3, 5, 0, TAU); context.arc(x + 4, y - 3, 5, 0, TAU); context.lineTo(x, y + 8); context.fill();
    if (half) { context.fillStyle = "#d74f4d"; context.fillRect(x - 8, y - 8, 8, 14); }
  }

  function drawMinimap() {
    const startX = ROOM_WIDTH - 60 - game.rooms.length * 30;
    const y = 86;
    for (let index = 0; index < game.rooms.length; index += 1) {
      const room = game.rooms[index];
      context.fillStyle = index < game.room ? "#6f875d" : index === game.room ? "#e8bd63" : room.kind === "boss" ? "#682f3e" : "#302b31";
      context.fillRect(startX + index * 30, y, 22, 16);
      if (room.kind === "treasure") {
        context.fillStyle = "#d8af55";
        context.fillRect(startX + index * 30 + 8, y + 4, 6, 7);
      }
      if (room.kind === "shop") {
        context.fillStyle = "#d58d48";
        context.beginPath(); context.arc(startX + index * 30 + 11, y + 8, 4, 0, TAU); context.fill();
      }
      if (index < game.rooms.length - 1) { context.fillStyle = "#675a4c"; context.fillRect(startX + index * 30 + 22, y + 6, 8, 4); }
      if ((index + 1) % 6 === 0 && index < game.rooms.length - 1) {
        context.fillStyle = "#d1a657";
        context.fillRect(startX + index * 30 + 25, y - 4, 3, 24);
      }
    }
  }

  function drawStats() {
    const player = game.player;
    drawHudPanel(55, 128, 242, 58);
    context.fillStyle = "#bfb39e";
    context.font = "700 11px system-ui";
    context.fillText(`攻击 ${player.damage.toFixed(1)}   射速 ${(1 / player.fireRate).toFixed(1)}/秒   移速 ${Math.round(player.speed)}`, 68, 151);
    context.fillText(`射程 ${Math.round(player.bulletLife * player.bulletSpeed)}   弹道 ${player.shots}   暴击 ${Math.round(player.critChance * 100)}%   穿透 ${player.pierce}`, 68, 171);
    drawBuildTracks();
  }

  function drawBuildTracks() {
    const tags = [
      ["destroy", "摧", "#cf6548"],
      ["coin", "币", "#e1b555"],
      ["spell", "咒", "#9d82d0"],
      ["titan", "泰", "#79a183"]
    ];
    drawHudPanel(55, 194, 242, 34);
    tags.forEach((entry, index) => {
      const count = items.filter(item => item.tag === entry[0] && game.itemStacks[item.id]).length;
      const x = 70 + index * 56;
      context.fillStyle = entry[2];
      context.font = "900 11px system-ui";
      context.fillText(`${entry[1]} ${Math.min(5, count)}/5`, x, 215);
    });
  }

  function drawBuildHud() {
    const player = game.player;
    const hero = heroes[player.hero];
    const x = ROOM_WIDTH - 246;
    const y = ROOM_HEIGHT - 74;
    drawHudPanel(x, y, 190, 38);
    context.fillStyle = hero.color;
    context.font = "900 11px system-ui";
    context.fillText(`${hero.name} · ${hero.path}`, x + 12, y + 16);
    context.fillStyle = "#44383d";
    context.fillRect(x + 12, y + 24, 164, 5);
    context.fillStyle = player.skillCooldown <= 0 ? "#efd06e" : hero.color;
    context.fillRect(x + 12, y + 24, 164 * (1 - clamp(player.skillCooldown / player.skillDelay, 0, 1)), 5);
    context.fillStyle = "#d9cbb5";
    context.textAlign = "right";
    context.fillText(player.skillCooldown <= 0 ? "Q 就绪" : `${player.skillCooldown.toFixed(1)}s`, x + 176, y + 16);
    context.textAlign = "left";
  }

  function drawItems() {
    let x = 58;
    const y = ROOM_HEIGHT - 72;
    for (const item of items) {
      const count = game.itemStacks[item.id];
      if (!count) continue;
      drawHudPanel(x, y, 38, 32);
      drawItemGlyph(item, x + 15, y + 16, .55);
      context.fillStyle = "#f4ead0";
      context.font = "800 10px system-ui";
      context.fillText(`×${count}`, x + 25, y + 25);
      x += 44;
    }
  }

  function drawHudPanel(x, y, widthValue, heightValue) {
    context.fillStyle = "#120f13d9";
    context.strokeStyle = "#6a5549aa";
    context.lineWidth = 2;
    roundedRect(x, y, widthValue, heightValue, 6);
    context.fill(); context.stroke();
    context.fillStyle = "#d7b56a99";
    for (const point of [[x + 7, y + 7], [x + widthValue - 7, y + 7], [x + 7, y + heightValue - 7], [x + widthValue - 7, y + heightValue - 7]]) {
      context.beginPath(); context.arc(point[0], point[1], 1.5, 0, TAU); context.fill();
    }
  }

  function drawTexts() {
    context.textAlign = "center";
    context.font = "900 22px system-ui";
    for (const text of game.texts) {
      context.globalAlpha = Math.min(1, text.life);
      context.fillStyle = "#ffe09a";
      context.fillText(text.text, text.x, text.y);
    }
    context.globalAlpha = 1;
    context.textAlign = "left";
  }

  function frame(time) {
    const dt = Math.min((time - lastTime) / 1000 || 0, .033);
    lastTime = time;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function toRoom(clientX, clientY) {
    return { x: (clientX - offsetX) / scale, y: (clientY - offsetY) / scale };
  }

  window.addEventListener("resize", resize);
  const keyAliases = {
    w: "KeyW", a: "KeyA", s: "KeyS", d: "KeyD",
    ArrowUp: "ArrowUp", ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight",
    " ": "Space", Spacebar: "Space", q: "KeyQ", Q: "KeyQ"
  };

  function normalizedCode(event) {
    if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) return event.code;
    return keyAliases[event.key] || keyAliases[String(event.key).toLowerCase()] || event.code;
  }

  function handleKeyDown(event) {
    const code = normalizedCode(event);
    if (!["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) return;
    event.preventDefault();
    keys.add(code);
    if (code === "Space" && !event.repeat) roll();
    if (code === "KeyQ" && !event.repeat) activateSkill();
  }

  function handleKeyUp(event) {
    keys.delete(normalizedCode(event));
  }

  document.addEventListener("keydown", handleKeyDown, true);
  document.addEventListener("keyup", handleKeyUp, true);
  function resetInput() {
    keys.clear();
    pointer.down = false;
    pointer.moveDown = false;
    touchMove.x = 0;
    touchMove.y = 0;
    const knob = document.querySelector("#stick-knob");
    if (knob) knob.style.transform = "";
  }

  window.addEventListener("blur", resetInput);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetInput();
  });
  canvas.addEventListener("pointermove", event => {
    const point = toRoom(event.clientX, event.clientY);
    pointer.x = point.x; pointer.y = point.y; pointer.active = event.pointerType === "mouse";
  });
  canvas.addEventListener("pointerdown", event => {
    if (event.pointerType !== "mouse") return;
    canvas.focus({ preventScroll: true });
    if (event.button === 0) pointer.down = true;
    if (event.button === 2) pointer.moveDown = true;
  });
  canvas.addEventListener("contextmenu", event => event.preventDefault());
  window.addEventListener("pointerup", event => {
    if (event.pointerType !== "mouse") return;
    if (event.button === 0) pointer.down = false;
    if (event.button === 2) pointer.moveDown = false;
  });

  const stickZone = document.querySelector("#stick-zone");
  const stickKnob = document.querySelector("#stick-knob");
  function updateStick(event) {
    const bounds = stickZone.getBoundingClientRect();
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const length = Math.hypot(dx, dy) || 1;
    const limited = Math.min(length, 36);
    touchMove.x = dx / length * Math.min(length / 36, 1);
    touchMove.y = dy / length * Math.min(length / 36, 1);
    stickKnob.style.transform = `translate(${dx / length * limited}px, ${dy / length * limited}px)`;
  }
  function resetStick() {
    touchMove.x = 0;
    touchMove.y = 0;
    stickKnob.style.transform = "";
  }
  stickZone.addEventListener("pointerdown", event => { event.preventDefault(); stickZone.setPointerCapture(event.pointerId); updateStick(event); });
  stickZone.addEventListener("pointermove", event => { if (stickZone.hasPointerCapture(event.pointerId)) updateStick(event); });
  stickZone.addEventListener("pointerup", resetStick);
  stickZone.addEventListener("pointercancel", resetStick);
  const fireButton = document.querySelector("#fire-button");
  fireButton.addEventListener("pointerdown", event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); pointer.down = true; pointer.active = false; });
  fireButton.addEventListener("pointerup", () => { pointer.down = false; });
  fireButton.addEventListener("pointercancel", () => { pointer.down = false; });
  document.querySelector("#dash-button").addEventListener("pointerdown", event => { event.preventDefault(); roll(); });
  document.querySelector("#skill-button").addEventListener("pointerdown", event => { event.preventDefault(); activateSkill(); });
  document.querySelectorAll(".hero-card").forEach(button => button.addEventListener("click", () => {
    selectedHero = button.dataset.hero;
    document.querySelectorAll(".hero-card").forEach(card => card.classList.remove("selected"));
    button.classList.add("selected");
  }));
  document.querySelector("#start-button").addEventListener("click", newGame);
  document.querySelector("#restart-button").addEventListener("click", newGame);

  window.__game = {
    start: newGame,
    getState() {
      if (!game) return { state: "menu" };
      return {
        state: game.state,
        outcome: game.outcome || null,
        room: game.room,
        roomCount: game.rooms.length,
        roomType: game.rooms[game.room].kind,
        roomModifier: game.rooms[game.room].modifier || null,
        chapter: game.rooms[game.room].chapter + 1,
        floorRoom: game.rooms[game.room].floorRoom,
        roomKinds: game.rooms.map(room => room.kind),
        plannedEnemyTypes: game.rooms.flatMap(room => room.enemies),
        enemyTypes: game.enemies.map(enemy => enemy.type),
        enemyHealth: game.enemies.map(enemy => enemy.hp),
        enemies: game.enemies.map(enemy => ({ x: enemy.x, y: enemy.y, hp: enemy.hp, type: enemy.type })),
        doorOpen: game.doorOpen,
        pickupTypes: game.pickups.map(pickup => pickup.type),
        hp: game.player.hp,
        maxHp: game.player.maxHp,
        player: { x: game.player.x, y: game.player.y },
        enemyCount: game.enemies.length,
        playerBullets: game.bullets.length,
        enemyBullets: game.enemyBullets.length,
        kills: game.kills,
        bossKills: game.bossKills,
        hero: game.player.hero,
        combo: game.combo,
        perfectRooms: game.perfectRooms,
        destroyedProps: game.destroyedProps,
        synergies: { ...game.synergies },
        obstacles: game.obstacles.filter(obstacle => !obstacle.dead).length,
        bombs: game.bombs.length,
        coins: game.player.coins,
        skillCooldown: game.player.skillCooldown,
        itemsFound: game.itemsFound,
        itemStacks: { ...game.itemStacks },
        flowCounts: Object.fromEntries(["destroy", "coin", "spell", "titan"].map(tag => [tag, items.filter(item => item.tag === tag && game.itemStacks[item.id]).length])),
        stats: {
          damage: game.player.damage,
          fireRate: game.player.fireRate,
          speed: game.player.speed,
          range: game.player.bulletLife * game.player.bulletSpeed,
          shots: game.player.shots,
          critChance: game.player.critChance,
          pierce: game.player.pierce,
          pickupRadius: game.player.pickupRadius,
          rollDelay: game.player.rollDelay,
          roomHeal: game.player.roomHeal,
          bulletSize: game.player.bulletSize,
          armor: game.player.armor
        }
      };
    },
    clearRoom() {
      if (!game || game.state !== "playing") return;
      game.suppressSpawns = true;
      game.enemies.slice().forEach(killEnemy);
      game.suppressSpawns = false;
    },
    collectPickups() {
      if (!game || game.state !== "playing") return;
      game.pickups.forEach(pickup => { pickup.x = game.player.x; pickup.y = game.player.y; });
    },
    exitRoom() {
      if (!game || game.state !== "playing" || !game.doorOpen) return;
      game.player.x = ROOM_WIDTH - WALL - game.player.radius;
    },
    giveItem(id) {
      const item = items.find(candidate => candidate.id === id);
      if (game && item) grantItem(item);
    },
    hurt(amount = 1) {
      if (!game || game.state !== "playing") return;
      game.player.invincible = 0;
      damagePlayer(amount);
    },
    selectHero(id) {
      if (heroes[id]) selectedHero = id;
    },
    useSkill() {
      activateSkill();
    }
  };

  resize();
  if (window.location && window.location.search.includes("autostart=1")) newGame();
  requestAnimationFrame(frame);
})();
