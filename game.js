(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const context = canvas.getContext("2d");
  const gameShell = document.querySelector("#game-shell");
  const startScreen = document.querySelector("#start-screen");
  const endScreen = document.querySelector("#end-screen");
  const touchUi = document.querySelector("#touch-ui");
  const fullscreenButton = document.querySelector("#fullscreen-button");
  const guidePanel = document.querySelector("#guide-panel");
  const guideSummary = document.querySelector("#guide-summary");
  const guideItems = document.querySelector("#guide-items");
  const workshopPanel = document.querySelector("#workshop-panel");
  const workshopInventory = document.querySelector("#workshop-inventory");
  const farmPlots = document.querySelector("#farm-plots");
  const forgeRecipes = document.querySelector("#forge-recipes");
  const benefitsPanel = document.querySelector("#benefits-panel");
  const benefitsBalance = document.querySelector("#benefits-balance");
  const benefitsContent = document.querySelector("#benefits-content");
  const benefitsNotice = document.querySelector("#benefits-notice");
  const supplyBalanceBadge = document.querySelector("#supply-balance-badge");
  const rerollButton = document.querySelector("#reroll-button");
  const ROOM_WIDTH = 1280;
  const ROOM_HEIGHT = 720;
  const WALL = 48;
  const ARENA_DIAGONAL = Math.hypot(ROOM_WIDTH, ROOM_HEIGHT);
  const BOSS_STAGE_TWO_RATIO = 2 / 3;
  const BOSS_STAGE_THREE_RATIO = 1 / 3;
  const ROUTE_CARD_WIDTH = 340;
  const ROUTE_CARD_HEIGHT = 200;
  const ROUTE_CARD_GAP = 72;
  const ROUTE_CARD_Y = 250;
  const TAU = Math.PI * 2;
  const roomNames = [
    ["灰烬门厅", "铜锁走廊", "潮湿地窖", "蛾尘寝室"],
    ["溺骨回廊", "菌灯洞室", "坍塌岩穴", "滴水祭坑"],
    ["失火书库", "碎骨工坊", "焦黑祭坛", "熔蜡回廊"],
    ["血肉深井", "旧王餐厅", "脉动甬道", "低语心室"],
    ["苍蓝回声", "无声礼拜堂", "星屑侧殿", "镜光长廊"],
    ["焦骨刑场", "硫火回廊", "失名王座", "无光深室"]
  ];
  const chapters = [
    { act: 1, floor: "I", variants: [{ name: "腐朽地窖", theme: 0 }, { name: "孢子地窖", theme: 0 }, { name: "焚痕地窖", theme: 2 }], boss: "bossCoil", bossName: "腐环幼体" },
    { act: 1, floor: "II", variants: [{ name: "腐朽地窖", theme: 0 }, { name: "孢子地窖", theme: 0 }, { name: "焚痕地窖", theme: 2 }], boss: "bossHopper", bossName: "哀鸣巨像" },
    { act: 2, floor: "I", variants: [{ name: "溺骨岩窟", theme: 1 }, { name: "葬骨墓窟", theme: 1 }, { name: "淹没洞穴", theme: 4 }], boss: "bossDevourer", bossName: "饥渊蠕王" },
    { act: 2, floor: "II", variants: [{ name: "溺骨岩窟", theme: 1 }, { name: "葬骨墓窟", theme: 1 }, { name: "淹没洞穴", theme: 4 }], boss: "bossIdol", bossName: "脓根圣像" },
    { act: 3, floor: "I", variants: [{ name: "刑狱深层", theme: 2 }, { name: "王骸墓城", theme: 2 }, { name: "霉暗深层", theme: 0 }], boss: "bossPeep", bossName: "泪池窥者" },
    { act: 3, floor: "II", variants: [{ name: "刑狱深层", theme: 2 }, { name: "王骸墓城", theme: 2 }, { name: "霉暗深层", theme: 0 }], boss: "bossMatron", bossName: "门中母影" },
    { act: 4, floor: "I", variants: [{ name: "血肉宫腔", theme: 3 }, { name: "内脏子宫", theme: 3 }, { name: "瘢痕母巢", theme: 3 }], boss: "bossHollow", bossName: "空骨长虫" },
    { act: 4, floor: "II", variants: [{ name: "血肉宫腔", theme: 3 }, { name: "内脏子宫", theme: 3 }, { name: "瘢痕母巢", theme: 3 }], boss: "bossHeart", bossName: "深渊之心" },
    { act: 4.5, floor: "裂隙", variants: [{ name: "苍蓝胎海", theme: 4 }], boss: "bossBloat", bossName: "裂眼浮尸" },
    { act: 5, floor: "终路", variants: [{ name: "哀歌圣堂", theme: 4 }], boss: "bossBurrow", bossName: "圣髓潜兽", branchDepth: 1 },
    { act: 6, floor: "终局", variants: [{ name: "鎏金遗箱", theme: 4 }], boss: "bossInfernal", bossName: "鎏金审判", branchDepth: 2 }
  ];
  const roomModifiers = {
    swarm: { name: "虫潮", color: "#9caf69" },
    frenzy: { name: "狂热", color: "#d36c55" },
    fortune: { name: "富矿", color: "#d9b455" },
    cursed: { name: "诅咒", color: "#9a78bd" }
  };
  const eliteAffixes = {
    warded: { name: "护盾", glyph: "◆", color: "#70c5dd" },
    frenzied: { name: "狂怒", glyph: "✦", color: "#ee7658" },
    vampiric: { name: "汲血", glyph: "♥", color: "#c94e72" },
    volatile: { name: "爆裂", glyph: "✹", color: "#e8ad4f" }
  };
  const weaponNames = {
    repeater: "泪火连弩", scatter: "霰火心脏", wisp: "游魂提灯", cleaver: "锯齿祭刃",
    seeker: "追魂蜂巢", prism: "星陨棱镜", orbit: "血月环刃"
  };
  const weaponDescriptions = {
    repeater: "稳定连射 · 连击分裂", scatter: "近距扇形爆发", wisp: "双灵体齐射", cleaver: "宽幅斩击 · 护刃弹反",
    seeker: "自动锁敌追踪", prism: "折射弹跳光束", orbit: "往返回旋双刃"
  };
  const materialNames = { bone: "骨粉", crystal: "幽晶", sap: "血藤汁" };
  const weaponRecipes = {
    seeker: { name: "追魂蜂巢", icon: "⌁", blueprintAt: 1, cost: { bone: 2, crystal: 2, sap: 1 }, detail: "自动锁定最近敌人，发射会转向的双重魂弹。" },
    prism: { name: "星陨棱镜", icon: "◇", blueprintAt: 3, cost: { bone: 2, crystal: 4, sap: 2 }, detail: "高能棱镜弹命中后折射到新的目标。" },
    orbit: { name: "血月环刃", icon: "☾", blueprintAt: 5, cost: { bone: 5, crystal: 2, sap: 4 }, detail: "投出弧线双刃，飞出后自动回到持有者身边。" }
  };
  const benefitProducts = {
    voucherBasic: { category: "voucher", name: "基础权益兑换凭证", icon: "券", price: 100, detail: "未来可按正式活动规则兑换基础京东权益。", note: "活动测试 · 暂不可用于真实消费", limit: 1 },
    voucherPreferred: { category: "voucher", name: "优选权益兑换凭证", icon: "惠", price: 250, detail: "未来可按正式活动规则兑换指定品类权益。", note: "活动测试 · 暂不可用于真实消费", limit: 1 },
    voucherLimited: { category: "voucher", name: "限定权益兑换凭证", icon: "礼", price: 500, detail: "为后续节日或品牌活动保留的高级兑换凭证。", note: "活动测试 · 暂不可用于真实消费", limit: 1 },
    ration: { category: "booster", name: "旅行口粮", icon: "♥", price: 20, detail: "下一局首次进入 Boss 房时恢复半颗心。", note: "一次性 · 每局最多携带一个", maxOwned: 3 },
    luckyBadge: { category: "booster", name: "幸运徽章", icon: "✦", price: 25, detail: "下一局首次宝藏三选一可免费刷新一次。", note: "一次性 · 强度低于普通遗物", maxOwned: 3 },
    sparePlate: { category: "booster", name: "备用护片", icon: "◆", price: 30, detail: "下一局开始时获得一层一次性护盾。", note: "一次性 · 不提升永久属性", maxOwned: 3 },
    redTrail: { category: "cosmetic", slot: "projectile", name: "赤金弹道", icon: "➶", price: 180, detail: "将玩家弹体轨迹替换为赤金色余辉。", note: "永久外观 · 不改变伤害" },
    redSlash: { category: "cosmetic", slot: "cleaver", name: "京红刀光", icon: "⌁", price: 250, detail: "将锯齿祭刃的外圈刀波替换为京红特效。", note: "永久外观 · 不改变范围" },
    supplyTitle: { category: "cosmetic", slot: "title", name: "补给先锋", icon: "♜", price: 120, detail: "在战斗构筑栏展示限定称号“补给先锋”。", note: "永久称号 · 无属性加成" }
  };
  const dailyMissionCatalog = {
    rooms: { name: "地牢巡查", detail: "完成 3 个战斗房", target: 3, reward: 5 },
    kills: { name: "清剿委托", detail: "击败 20 个敌人", target: 20, reward: 5 },
    evades: { name: "无伤演练", detail: "成功翻滚躲避 5 次", target: 5, reward: 5 },
    shop: { name: "商旅往来", detail: "在局内商店购买 1 件遗物", target: 1, reward: 5 },
    risk: { name: "险路勘探", detail: "选择 1 次高风险路线", target: 1, reward: 8 },
    boss: { name: "领主悬赏", detail: "击败 1 位 Boss", target: 1, reward: 12 }
  };
  const bossProfiles = {
    bossCoil: { hp: 124, radius: 42, speed: 98, stages: ["蛇行", "遗蜕", "断节"] },
    bossHopper: { hp: 148, radius: 43, speed: 88, stages: ["喷涌", "腾跃", "天坠"] },
    bossDevourer: { hp: 176, radius: 47, speed: 80, stages: ["巡游", "吞噬", "暴食"] },
    bossIdol: { hp: 208, radius: 48, speed: 0, stages: ["凝视", "育巢", "喷发"] },
    bossPeep: { hp: 238, radius: 42, speed: 90, stages: ["泪池", "脱眼", "双瞳"] },
    bossMatron: { hp: 272, radius: 52, speed: 0, stages: ["叩门", "覆掌", "践踏"] },
    bossHollow: { hp: 306, radius: 40, speed: 128, stages: ["游空", "裂节", "疾返"] },
    bossHeart: { hp: 348, radius: 50, speed: 76, stages: ["凝视", "心跳", "狂搏"] },
    bossBloat: { hp: 392, radius: 45, speed: 84, stages: ["腐池", "裂眼", "血光"] },
    bossBurrow: { hp: 442, radius: 46, speed: 112, stages: ["潜行", "露尾", "掘袭"] },
    bossInfernal: { hp: 520, radius: 52, speed: 88, stages: ["献祭", "魔像", "双蹄"] }
  };
  const bossFormCatalog = {
    bossCoil: ["coil-larva", "coil-shed-serpent", "coil-broken-hydra"],
    bossHopper: ["hopper-brood", "hopper-stilt", "hopper-crater-colossus"],
    bossDevourer: ["devourer-crawler", "devourer-maw", "devourer-fourfold-gorge"],
    bossIdol: ["idol-sealed", "idol-brood-nest", "idol-bloom-altar"],
    bossPeep: ["peep-lacrimal", "peep-hollow-orbit", "peep-astral-eyes"],
    bossMatron: ["matron-door-face", "matron-pallbearer", "matron-four-hand-shadow"],
    bossHollow: ["hollow-spine-worm", "hollow-shattered-chain", "hollow-echo-centipede"],
    bossHeart: ["heart-cocoon", "heart-everted-veins", "heart-riven-core"],
    bossBloat: ["bloat-drowned-corpse", "bloat-exposed-orbits", "bloat-trinity-beam"],
    bossBurrow: ["burrow-carapace", "burrow-tail-bloom", "burrow-drill-beast"],
    bossInfernal: ["infernal-offering", "infernal-winged-idol", "infernal-judgement-hooves"]
  };
  const bossStageNames = Object.fromEntries(Object.entries(bossProfiles).map(([id, profile]) => [id, profile.stages]));
  const bossAttackThemes = {
    bossCoil: { name: "腐毒骨刺", color: "#9ac65b", core: "#efff9f", trail: "#55783d", shape: "thorn" },
    bossHopper: { name: "灼热脓雨", color: "#ef8a55", core: "#ffe2a1", trail: "#9d3f35", shape: "drop" },
    bossDevourer: { name: "饥渊獠牙", color: "#d8b66a", core: "#fff0b5", trail: "#74533b", shape: "fang" },
    bossIdol: { name: "育巢孢卵", color: "#b28ed4", core: "#f0d4ff", trail: "#63497f", shape: "rune" },
    bossPeep: { name: "泪池晶滴", color: "#65cde2", core: "#d9fbff", trail: "#39798e", shape: "tear" },
    bossMatron: { name: "母影血掌", color: "#e36a83", core: "#ffd0d6", trail: "#812c48", shape: "hand" },
    bossHollow: { name: "空骨残片", color: "#b7a5df", core: "#f3eaff", trail: "#5b4b7b", shape: "bone" },
    bossHeart: { name: "狂搏血珠", color: "#ff5079", core: "#ffd2df", trail: "#8d2446", shape: "heart" },
    bossBloat: { name: "裂眼血光", color: "#f15f54", core: "#ffe0ae", trail: "#7e2835", shape: "eye" },
    bossBurrow: { name: "圣髓砂砾", color: "#81c8a6", core: "#e4ffca", trail: "#3c715e", shape: "shard" },
    bossInfernal: { name: "鎏金狱火", color: "#f2b94f", core: "#fff3ae", trail: "#8f3b31", shape: "flame" }
  };
  const bossStageStats = [
    { move: 1, cadence: 1, projectileSpeed: 1, projectileSize: 1, damage: 1, contact: 1 },
    { move: 1.18, cadence: 1.28, projectileSpeed: 1.16, projectileSize: 1.2, damage: 1.2, contact: 1.18 },
    { move: 1.36, cadence: 1.52, projectileSpeed: 1.3, projectileSize: 1.34, damage: 1.42, contact: 1.38 }
  ];
  const heroes = {
    breaker: { name: "爆破者", path: "摧毁流", tag: "destroy", skill: "爆裂震波", color: "#c75c45", apply: player => { player.damage = 1.25; player.fireRate = .24; player.skillDelay = 8; } },
    gambler: { name: "铸币客", path: "硬币流", tag: "coin", skill: "弹壳风暴", color: "#d4a44e", apply: player => { player.coins = 6; player.damage = .9; player.fireRate = .2; player.skillDelay = 6; } },
    seer: { name: "秘仪师", path: "咒文流", tag: "spell", skill: "连锁雷咒", color: "#8f76bd", apply: player => { player.damage = .9; player.fireRate = .18; player.critChance = .12; player.chain = 1; player.skillDelay = 7; } },
    titan: { name: "囚笼巨人", path: "泰坦流", tag: "titan", skill: "不屈怒吼", color: "#6f967b", apply: player => { player.hp = 10; player.maxHp = 10; player.damage = 1.3; player.speed = 215; player.bulletSize = 5; player.skillDelay = 10; } }
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
    { id: "titanSkull", tag: "titan", name: "泰坦之颅", icon: "◫", detail: "生命 +2，碰撞减伤", apply: player => { player.maxHp += 2; player.hp += 2; player.contactGuard += .25; } },
    { id: "scatterHeart", tag: "destroy", name: "霰火心脏", icon: "⋔", detail: "切换霰火；重复获得可进化", core: true, apply: player => equipWeapon(player, "scatter") },
    { id: "emberFlask", tag: "destroy", name: "余烬胆汁", icon: "♨", detail: "攻击有 28% 概率燃烧", apply: player => { player.burnChance = Math.min(.8, player.burnChance + .28); } },
    { id: "furnaceCore", tag: "destroy", name: "爆燃炉芯", icon: "※", detail: "燃烧敌人死亡时爆炸", apply: player => { player.burnExplosion = true; } },
    { id: "stormCoil", tag: "coin", name: "雷鸣线圈", icon: "ϟ", detail: "攻击有 22% 概率感电", apply: player => { player.shockChance = Math.min(.75, player.shockChance + .22); } },
    { id: "venomCoin", tag: "coin", name: "蚀毒钱币", icon: "☣", detail: "攻击有 24% 概率中毒", apply: player => { player.poisonChance = Math.min(.8, player.poisonChance + .24); } },
    { id: "bloodContract", tag: "coin", name: "鲜血契约", icon: "↯", detail: "攻击翻倍，生命上限减半", cursed: true, unlockAt: 3, apply: player => { player.damage *= 2; player.maxHp = Math.max(2, Math.ceil(player.maxHp / 2)); player.hp = Math.min(player.hp, player.maxHp); } },
    { id: "witchLantern", tag: "spell", name: "游魂提灯", icon: "☄", detail: "切换游魂；重复获得可进化", core: true, unlockAt: 1, apply: player => equipWeapon(player, "wisp") },
    { id: "frostRune", tag: "spell", name: "霜噬符文", icon: "❄", detail: "攻击有 24% 概率冻结", apply: player => { player.freezeChance = Math.min(.8, player.freezeChance + .24); } },
    { id: "shatterSeal", tag: "spell", name: "碎晶魔印", icon: "✧", detail: "冻结敌人死亡时碎裂", unlockAt: 1, apply: player => { player.shatter = true; } },
    { id: "serratedCrown", tag: "titan", name: "锯齿王冠", icon: "⌁", detail: "切换祭刃；重复获得可进化", core: true, unlockAt: 3, apply: player => equipWeapon(player, "cleaver") },
    { id: "barbedHook", tag: "titan", name: "倒刺钩爪", icon: "⌇", detail: "攻击有 32% 概率流血", apply: player => { player.bleedChance = Math.min(.85, player.bleedChance + .32); } },
    { id: "bloodChalice", tag: "titan", name: "猩红圣杯", icon: "♜", detail: "近战命中流血目标时恢复", apply: player => { player.bleedHeal = true; } }
  ];

  let width = 0;
  let height = 0;
  let scale = 1;
  let verticalScale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let lastTime = 0;
  let game;
  let screenShake = 0;
  let hitStop = 0;
  let enemySerial = 0;
  let selectedHero = "breaker";
  let selectedWeapon = "repeater";
  let guideOpen = false;
  let workshopOpen = false;
  let benefitsOpen = false;
  let hudOpen = false;
  let treasureHover = null;
  let benefitsTab = "store";
  let benefitsMessage = "";
  let workshopRefreshTimer = 0;
  let audioContext;
  const keys = new Set();
  const pointer = { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2, down: false, moveDown: false, active: false, firePointerId: null };
  const touchMove = { x: 0, y: 0, pointerId: null };
  const META_KEY = window.location?.search.includes("__audit=1") ? "shell-dungeon-meta-audit-v2" : "shell-dungeon-meta-v2";
  const weaponUnlocks = { repeater: 0, scatter: 0, wisp: 1, cleaver: 3 };
  let metaProgress = loadMetaProgress();

  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const isBoss = enemy => enemy.type.startsWith("boss");
  const angleDelta = (target, current) => Math.atan2(Math.sin(target - current), Math.cos(target - current));
  const turnToward = (current, target, amount) => current + angleDelta(target, current) * clamp(amount, 0, 1);
  const bossStats = enemy => bossStageStats[clamp((enemy?.bossStage || 1) - 1, 0, bossStageStats.length - 1)];
  const bossDamage = (enemy, base = 1) => base * bossStats(enemy).damage;

  function loadMetaProgress() {
    const fallback = {
      runs: 0, wins: 0, bossDefeats: 0, bestKills: 0, seeds: 2, harvests: 0,
      materials: { bone: 0, crystal: 0, sap: 0 }, plots: [null, null, null], blueprints: [], craftedWeapons: [],
      supplyCoins: 0, defeatedBossTypes: [], vouchers: [], boosterInventory: {}, selectedBooster: null,
      ownedCosmetics: [], equippedCosmetics: { projectile: null, cleaver: null, title: null }, storePurchases: {}, daily: null
    };
    try {
      const stored = window.localStorage && window.localStorage.getItem(META_KEY);
      if (!stored) return fallback;
      const parsed = JSON.parse(stored);
      return {
        ...fallback, ...parsed,
        materials: { ...fallback.materials, ...(parsed.materials || {}) },
        plots: Array.from({ length: 3 }, (_, index) => parsed.plots?.[index] || null),
        blueprints: Array.isArray(parsed.blueprints) ? parsed.blueprints : [],
        craftedWeapons: Array.isArray(parsed.craftedWeapons) ? parsed.craftedWeapons : [],
        defeatedBossTypes: Array.isArray(parsed.defeatedBossTypes) ? parsed.defeatedBossTypes : [],
        vouchers: Array.isArray(parsed.vouchers) ? parsed.vouchers : [],
        boosterInventory: { ...fallback.boosterInventory, ...(parsed.boosterInventory || {}) },
        ownedCosmetics: Array.isArray(parsed.ownedCosmetics) ? parsed.ownedCosmetics : [],
        equippedCosmetics: { ...fallback.equippedCosmetics, ...(parsed.equippedCosmetics || {}) },
        storePurchases: { ...fallback.storePurchases, ...(parsed.storePurchases || {}) },
        daily: parsed.daily && typeof parsed.daily === "object" ? parsed.daily : null
      };
    } catch {
      return fallback;
    }
  }

  function saveMetaProgress() {
    try {
      if (window.localStorage) window.localStorage.setItem(META_KEY, JSON.stringify(metaProgress));
    } catch {}
    updateMetaUi();
    if (benefitsOpen) renderBenefits();
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dailyMissionIds(dateKey) {
    const ids = Object.keys(dailyMissionCatalog);
    const seed = [...dateKey].reduce((total, character) => total + character.charCodeAt(0), 0) % ids.length;
    return Array.from({ length: 3 }, (_, index) => ids[(seed + index * 2) % ids.length]);
  }

  function ensureDailyMissions() {
    const date = localDateKey();
    if (metaProgress.daily?.date === date) return false;
    const taskIds = dailyMissionIds(date);
    metaProgress.daily = {
      date,
      taskIds,
      progress: Object.fromEntries(taskIds.map(id => [id, 0])),
      claimed: [],
      loginReward: 5
    };
    metaProgress.supplyCoins += 5;
    return true;
  }

  function recordDailyProgress(id, amount = 1) {
    if (!game || game.debugAssisted || amount <= 0) return false;
    ensureDailyMissions();
    if (!metaProgress.daily.taskIds.includes(id)) return false;
    const mission = dailyMissionCatalog[id];
    const previous = metaProgress.daily.progress[id] || 0;
    const next = Math.min(mission.target, previous + amount);
    if (next === previous) return false;
    metaProgress.daily.progress[id] = next;
    saveMetaProgress();
    return true;
  }

  function claimDailyMission(id) {
    ensureDailyMissions();
    const daily = metaProgress.daily;
    const mission = dailyMissionCatalog[id];
    if (!mission || !daily.taskIds.includes(id) || daily.claimed.includes(id) || (daily.progress[id] || 0) < mission.target) return false;
    daily.claimed.push(id);
    metaProgress.supplyCoins += mission.reward;
    benefitsMessage = `${mission.name}已领取 · 补给币 +${mission.reward}`;
    saveMetaProgress();
    return true;
  }

  function benefitOwned(productId) {
    const product = benefitProducts[productId];
    if (!product) return false;
    if (product.category === "voucher") return metaProgress.vouchers.some(voucher => voucher.productId === productId);
    if (product.category === "cosmetic") return metaProgress.ownedCosmetics.includes(productId);
    return (metaProgress.boosterInventory[productId] || 0) >= (product.maxOwned || Infinity);
  }

  function purchaseBenefit(productId) {
    const product = benefitProducts[productId];
    if (!product || benefitOwned(productId) || metaProgress.supplyCoins < product.price) return false;
    metaProgress.supplyCoins -= product.price;
    metaProgress.storePurchases[productId] = (metaProgress.storePurchases[productId] || 0) + 1;
    if (product.category === "voucher") {
      metaProgress.vouchers.push({ productId, acquiredAt: Date.now(), status: "pending" });
      benefitsMessage = `${product.name}已放入权益背包 · 当前仅为测试凭证`;
    } else if (product.category === "booster") {
      metaProgress.boosterInventory[productId] = (metaProgress.boosterInventory[productId] || 0) + 1;
      if (!metaProgress.selectedBooster) metaProgress.selectedBooster = productId;
      benefitsMessage = `${product.name}已兑换${metaProgress.selectedBooster === productId ? "并自动携带" : ""}`;
    } else {
      metaProgress.ownedCosmetics.push(productId);
      metaProgress.equippedCosmetics[product.slot] = productId;
      benefitsMessage = `${product.name}已解锁并装备 · 仅改变外观`;
    }
    saveMetaProgress();
    return true;
  }

  function equipBenefit(productId) {
    const product = benefitProducts[productId];
    if (!product) return false;
    if (product.category === "booster") {
      if ((metaProgress.boosterInventory[productId] || 0) <= 0) return false;
      metaProgress.selectedBooster = metaProgress.selectedBooster === productId ? null : productId;
      benefitsMessage = metaProgress.selectedBooster ? `下一局将携带 ${product.name}` : `已卸下 ${product.name}`;
    } else if (product.category === "cosmetic") {
      if (!metaProgress.ownedCosmetics.includes(productId)) return false;
      metaProgress.equippedCosmetics[product.slot] = metaProgress.equippedCosmetics[product.slot] === productId ? null : productId;
      benefitsMessage = metaProgress.equippedCosmetics[product.slot] ? `已装备 ${product.name}` : `已卸下 ${product.name}`;
    } else return false;
    saveMetaProgress();
    return true;
  }

  function benefitCard(productId) {
    const product = benefitProducts[productId];
    const count = metaProgress.boosterInventory[productId] || 0;
    const owned = benefitOwned(productId);
    const affordable = metaProgress.supplyCoins >= product.price;
    const labels = { voucher: "权益兑换 · 测试凭证", booster: "轻量补给 · 单局消耗", cosmetic: "永久外观 · 零属性" };
    const buttonText = product.category === "booster" ? count >= product.maxOwned ? `库存已满 ${count}/${product.maxOwned}` : `兑换 · ◈ ${product.price}` : owned ? "已拥有" : `兑换 · ◈ ${product.price}`;
    return `<article class="benefit-card ${product.category}${owned && product.category !== "booster" ? " owned" : ""}">
      <span class="benefit-icon">${product.icon}</span><span class="benefit-type">${labels[product.category]}</span>
      <h3>${product.name}</h3><p>${product.detail}</p><small>${product.note}</small>
      <div class="benefit-price"><span>${product.category === "booster" ? `持有 ${count}/${product.maxOwned}` : owned ? "已存入背包" : "每个存档限 1 件"}</span><span>◈ ${product.price}</span></div>
      <button data-benefit-buy="${productId}" ${owned || !affordable ? "disabled" : ""}>${!affordable && !owned ? `还差 ${product.price - metaProgress.supplyCoins}` : buttonText}</button>
    </article>`;
  }

  function renderBenefitStore() {
    const sections = [
      ["voucher", "权益兑换凭证", "当前仅记录游戏内兑换资格，不生成真实券码"],
      ["booster", "轻量游戏补给", "每局最多携带一个，强度低于普通遗物"],
      ["cosmetic", "永久外观", "只改变视觉表现，不影响伤害、生命或掉落"]
    ];
    return sections.map(([category, title, subtitle]) => `<section><div class="benefits-section-title"><h3>${title}</h3><span>${subtitle}</span></div><div class="benefits-grid">${Object.keys(benefitProducts).filter(id => benefitProducts[id].category === category).map(benefitCard).join("")}</div></section>`).join("");
  }

  function renderDailyMissions() {
    ensureDailyMissions();
    const daily = metaProgress.daily;
    const cards = daily.taskIds.map(id => {
      const mission = dailyMissionCatalog[id];
      const progress = Math.min(mission.target, daily.progress[id] || 0);
      const complete = progress >= mission.target;
      const claimed = daily.claimed.includes(id);
      return `<article class="mission-card"><div><h3>${mission.name}</h3><p>${mission.detail} · 奖励 ◈ ${mission.reward}</p></div><div><div class="mission-progress"><i style="width:${progress / mission.target * 100}%"></i></div><p>${progress}/${mission.target}</p></div><button data-mission-claim="${id}" ${!complete || claimed ? "disabled" : ""}>${claimed ? "已领取" : complete ? `领取 +${mission.reward}` : "进行中"}</button></article>`;
    }).join("");
    return `<div class="benefits-section-title"><h3>今日地牢悬赏</h3><span>${daily.date} · 每日本地刷新 · 今日登录已得 ◈ ${daily.loginReward}</span></div><div class="mission-grid">${cards}</div>`;
  }

  function backpackCard(productId) {
    const product = benefitProducts[productId];
    if (!product) return "";
    if (product.category === "voucher") return `<article class="benefit-card voucher owned"><span class="benefit-icon">${product.icon}</span><span class="benefit-type">权益兑换凭证</span><h3>${product.name}</h3><p>${product.detail}</p><small>状态：活动测试 · 待正式权益开放</small><button disabled>尚不可核销</button></article>`;
    const equipped = product.category === "booster" ? metaProgress.selectedBooster === productId : metaProgress.equippedCosmetics[product.slot] === productId;
    const count = metaProgress.boosterInventory[productId] || 0;
    return `<article class="benefit-card ${product.category}${equipped ? " owned" : ""}"><span class="benefit-icon">${product.icon}</span><span class="benefit-type">${product.category === "booster" ? `库存 ${count}` : "永久外观"}</span><h3>${product.name}</h3><p>${product.detail}</p><small>${equipped ? product.category === "booster" ? "已携带 · 开始下一局时消耗" : "当前已装备" : "当前未装备"}</small><button data-benefit-equip="${productId}">${equipped ? "卸下" : product.category === "booster" ? "下局携带" : "装备外观"}</button></article>`;
  }

  function renderBenefitsBackpack() {
    const ids = [
      ...metaProgress.vouchers.map(voucher => voucher.productId),
      ...Object.keys(metaProgress.boosterInventory).filter(id => metaProgress.boosterInventory[id] > 0),
      ...metaProgress.ownedCosmetics
    ];
    return ids.length ? `<div class="benefits-section-title"><h3>权益背包</h3><span>补给仅在开始下一局时消耗；兑换凭证当前不可核销</span></div><div class="benefits-grid">${ids.map(backpackCard).join("")}</div>` : `<div class="backpack-empty">背包还是空的。完成远征与每日悬赏获得补给币，再到商城兑换内容。</div>`;
  }

  function renderBenefits() {
    ensureDailyMissions();
    benefitsBalance.textContent = metaProgress.supplyCoins;
    supplyBalanceBadge.textContent = metaProgress.supplyCoins;
    benefitsNotice.textContent = benefitsMessage;
    document.querySelectorAll("[data-benefits-tab]").forEach(button => button.classList.toggle("active", button.dataset.benefitsTab === benefitsTab));
    benefitsContent.innerHTML = benefitsTab === "missions" ? renderDailyMissions() : benefitsTab === "backpack" ? renderBenefitsBackpack() : renderBenefitStore();
  }

  function setBenefitsOpen(open, tab = benefitsTab) {
    benefitsOpen = Boolean(open);
    benefitsTab = ["store", "missions", "backpack"].includes(tab) ? tab : "store";
    if (benefitsOpen) {
      setGuideOpen(false);
      setWorkshopOpen(false);
      resetInput();
      renderBenefits();
      benefitsPanel.classList.add("visible");
      benefitsPanel.setAttribute("aria-hidden", "false");
    } else {
      benefitsPanel.classList.remove("visible");
      benefitsPanel.setAttribute("aria-hidden", "true");
      benefitsMessage = "";
      if (game && game.state === "playing") requestAnimationFrame(() => canvas.focus({ preventScroll: true }));
    }
  }

  function calculateRunSupplyReward(won) {
    if (!game || game.debugAssisted) return { base: 0, rooms: 0, kills: 0, bosses: 0, risk: 0, victory: 0, total: 0, eligible: false };
    const combatRooms = game.rooms.filter(room => room.cleared && !["treasure", "shop", "sanctuary"].includes(room.kind)).length;
    const activeRun = game.kills > 0 || combatRooms > 0;
    const reward = {
      base: activeRun ? 2 : 0,
      rooms: Math.min(10, Math.floor(combatRooms / 2)),
      kills: Math.min(8, Math.floor(game.kills / 6)),
      bosses: Math.min(25, game.bossKills * 4),
      risk: Math.min(6, game.routeChoices * 3),
      victory: won ? 25 : 0,
      eligible: true
    };
    reward.total = reward.base + reward.rooms + reward.kills + reward.bosses + reward.risk + reward.victory;
    return reward;
  }

  function settleRunSupplyReward(won) {
    if (game.supplySettlement) return game.supplySettlement;
    const reward = calculateRunSupplyReward(won);
    game.supplySettlement = reward;
    metaProgress.supplyCoins += reward.total;
    return reward;
  }

  function nextVoucherGoal() {
    const productId = ["voucherBasic", "voucherPreferred", "voucherLimited"].find(id => !benefitOwned(id));
    if (!productId) return "三档测试兑换凭证已全部收藏";
    const product = benefitProducts[productId];
    const missing = Math.max(0, product.price - metaProgress.supplyCoins);
    return missing ? `距离${product.name}还差 ◈ ${missing}` : `已可兑换${product.name}`;
  }

  function isWeaponUnlocked(weapon) {
    if (weaponRecipes[weapon]) return metaProgress.craftedWeapons.includes(weapon);
    return metaProgress.bossDefeats >= (weaponUnlocks[weapon] || 0);
  }

  function availableItems() {
    return items.filter(item => !item.unlockAt || metaProgress.bossDefeats >= item.unlockAt);
  }

  function itemKind(item) {
    if (item.core) return "武器核心 · 拾取后自动切换/升级";
    if (item.cursed) return "代价遗物 · 拾取后自动生效";
    return "被动遗物 · 拾取后自动生效";
  }

  function renderGuide() {
    const tagNames = { destroy: "摧毁流", coin: "硬币流", spell: "咒文流", titan: "泰坦流" };
    const tagColors = { destroy: "#d66c4f", coin: "#e0b555", spell: "#a88bd9", titan: "#82ad8b" };
    const ownedCount = game ? Object.keys(game.itemStacks).filter(id => game.itemStacks[id] > 0).length : 0;
    const hero = game ? heroes[game.player.hero] : heroes[selectedHero];
    guideSummary.innerHTML = [
      ["道具如何使用", "所有遗物触碰或购买后立即自动生效，无需再按键；效果会持续到本局结束。"],
      ["唯一主动操作", `按 Q 释放${hero.name}的“${hero.skill}”；武器核心会自动切换攻击方式。`],
      ["当前构筑", game ? `${hero.path} · 已持有 ${ownedCount} 种遗物 · 点击关闭或按 I 继续` : "尚未开始本局；可先浏览完整道具池。"]
    ].map(entry => `<article><b>${entry[0]}</b><span>${entry[1]}</span></article>`).join("");
    guideItems.innerHTML = items.map(item => {
      const count = game ? game.itemStacks[item.id] || 0 : 0;
      const locked = item.unlockAt && metaProgress.bossDefeats < item.unlockAt;
      const status = locked ? `击败 ${item.unlockAt} 个 Boss 后进入掉落池` : count ? `本局已生效 · ${count} 层` : "本局尚未获得";
      return `<article class="guide-item${count ? " owned" : ""}${locked ? " locked" : ""}" style="--item-color:${tagColors[item.tag]}">
        <span class="guide-glyph">${item.icon}</span>
        <span class="guide-tag">${tagNames[item.tag]} · ${itemKind(item)}</span>
        <h3>${item.name}${count ? ` <em>×${count}</em>` : ""}</h3>
        <p>${item.detail}</p><small>${status}</small>
      </article>`;
    }).join("");
  }

  function setGuideOpen(open) {
    guideOpen = Boolean(open);
    if (guideOpen) {
      setBenefitsOpen(false);
      setWorkshopOpen(false);
      resetInput();
      renderGuide();
      guidePanel.classList.add("visible");
      guidePanel.setAttribute("aria-hidden", "false");
    } else {
      guidePanel.classList.remove("visible");
      guidePanel.setAttribute("aria-hidden", "true");
      if (game && game.state === "playing") requestAnimationFrame(() => canvas.focus({ preventScroll: true }));
    }
  }

  function materialCostText(cost) {
    return Object.entries(cost).map(([id, amount]) => `${materialNames[id]} ${amount}`).join(" · ");
  }

  function renderWorkshop() {
    if (!workshopInventory || !farmPlots || !forgeRecipes) return;
    const materials = metaProgress.materials;
    workshopInventory.innerHTML = `<span>种子 ${metaProgress.seeds}</span>${Object.entries(materialNames).map(([id, name]) => `<span>${name} ${materials[id]}</span>`).join("")}<span>已锻造 ${metaProgress.craftedWeapons.length}/3</span>`;
    const now = Date.now();
    farmPlots.innerHTML = metaProgress.plots.map((plot, index) => {
      if (!plot) return `<button class="farm-plot" data-plot="${index}"><i class="farm-sprout">＋</i><b>空地 ${index + 1}</b><span>${metaProgress.seeds > 0 ? "点击播种 · 约 20 秒成熟" : "战斗中击败敌人获取种子"}</span></button>`;
      const remaining = Math.max(0, plot.readyAt - now);
      const ready = remaining <= 0;
      return `<button class="farm-plot${ready ? " ready" : ""}" data-plot="${index}"><i class="farm-sprout">${ready ? "✿" : "♧"}</i><b>${ready ? "材料成熟" : "幽烬幼苗"}</b><span>${ready ? `点击收获 ${materialCostText(plot.yield)}` : `${Math.ceil(remaining / 1000)} 秒后成熟`}</span></button>`;
    }).join("");
    forgeRecipes.innerHTML = Object.entries(weaponRecipes).map(([id, recipe]) => {
      const blueprint = metaProgress.blueprints.includes(id);
      const crafted = metaProgress.craftedWeapons.includes(id);
      const affordable = Object.entries(recipe.cost).every(([material, amount]) => materials[material] >= amount);
      const state = crafted ? "已锻造 · 可作为初始武器" : blueprint ? affordable ? "材料齐全 · 点击锻造" : `缺少材料 · ${materialCostText(recipe.cost)}` : `击败第 ${recipe.blueprintAt} 个 Boss 获取图纸`;
      return `<article class="forge-card${crafted ? " crafted" : ""}${blueprint ? "" : " locked"}"><b>${recipe.icon} ${recipe.name}</b><span>${recipe.detail}</span><span>${state}</span><button data-craft="${id}" ${!blueprint || crafted || !affordable ? "disabled" : ""}>${crafted ? "已完成" : blueprint ? "锻造武器" : "图纸未解锁"}</button></article>`;
    }).join("");
  }

  function setWorkshopOpen(open) {
    workshopOpen = Boolean(open);
    if (!workshopPanel) return;
    clearInterval(workshopRefreshTimer);
    workshopRefreshTimer = 0;
    if (workshopOpen) {
      setBenefitsOpen(false);
      guideOpen = false;
      guidePanel.classList.remove("visible");
      resetInput();
      renderWorkshop();
      workshopPanel.classList.add("visible");
      workshopPanel.setAttribute("aria-hidden", "false");
      workshopRefreshTimer = setInterval(renderWorkshop, 1000);
    } else {
      workshopPanel.classList.remove("visible");
      workshopPanel.setAttribute("aria-hidden", "true");
      if (game && game.state === "playing") requestAnimationFrame(() => canvas.focus({ preventScroll: true }));
    }
  }

  function plantSeed(index) {
    if (!Number.isInteger(index) || index < 0 || index >= metaProgress.plots.length || metaProgress.plots[index] || metaProgress.seeds <= 0) return false;
    const cycle = metaProgress.harvests + index;
    const yieldValue = { bone: 1 + cycle % 2, crystal: 1 + (cycle + 1) % 2, sap: 1 + (cycle % 3 === 0 ? 1 : 0) };
    metaProgress.seeds -= 1;
    metaProgress.plots[index] = { plantedAt: Date.now(), readyAt: Date.now() + 20000, yield: yieldValue };
    saveMetaProgress();
    renderWorkshop();
    return true;
  }

  function harvestPlot(index, force = false) {
    const plot = metaProgress.plots[index];
    if (!plot || (!force && Date.now() < plot.readyAt)) return false;
    for (const [material, amount] of Object.entries(plot.yield)) metaProgress.materials[material] += amount;
    metaProgress.harvests += 1;
    metaProgress.plots[index] = null;
    saveMetaProgress();
    renderWorkshop();
    return true;
  }

  function interactFarmPlot(index) {
    return metaProgress.plots[index] ? harvestPlot(index) : plantSeed(index);
  }

  function craftWeapon(weapon) {
    const recipe = weaponRecipes[weapon];
    if (!recipe || !metaProgress.blueprints.includes(weapon) || metaProgress.craftedWeapons.includes(weapon)) return false;
    if (!Object.entries(recipe.cost).every(([material, amount]) => metaProgress.materials[material] >= amount)) return false;
    for (const [material, amount] of Object.entries(recipe.cost)) metaProgress.materials[material] -= amount;
    metaProgress.craftedWeapons.push(weapon);
    selectedWeapon = weapon;
    saveMetaProgress();
    renderWorkshop();
    return true;
  }

  function equipWeapon(player, weapon) {
    if (player.weapon === weapon) player.weaponLevel = Math.min(3, player.weaponLevel + 1);
    else {
      player.weapon = weapon;
      player.weaponLevel = 1;
    }
    if (weapon === "scatter") player.shots = Math.max(2 + player.weaponLevel, player.shots);
    if (weapon === "wisp") player.familiars = Math.max(1 + player.weaponLevel, player.familiars);
    if (weapon === "cleaver") player.damage += .22 + player.weaponLevel * .08;
  }

  function updateMetaUi() {
    const progress = document.querySelector("#meta-progress");
    if (progress) progress.textContent = `远征 ${metaProgress.runs} · 通关 ${metaProgress.wins} · Boss 印记 ${metaProgress.bossDefeats} · 补给币 ◈ ${metaProgress.supplyCoins}`;
    if (supplyBalanceBadge) supplyBalanceBadge.textContent = metaProgress.supplyCoins;
    document.querySelectorAll(".weapon-card").forEach(button => {
      const unlocked = isWeaponUnlocked(button.dataset.weapon);
      button.disabled = !unlocked;
      button.classList.toggle("locked", !unlocked);
      const requirement = weaponUnlocks[button.dataset.weapon];
      const recipe = weaponRecipes[button.dataset.weapon];
      const hint = button.querySelector("em");
      if (hint) hint.textContent = unlocked ? weaponDescriptions[button.dataset.weapon] : recipe ? metaProgress.blueprints.includes(button.dataset.weapon) ? "图纸已得 · 前往工坊锻造" : `第 ${recipe.blueprintAt} 个 Boss 掉落图纸` : `击败 ${requirement} 个 Boss 解锁`;
      if (!unlocked && selectedWeapon === button.dataset.weapon) selectedWeapon = "repeater";
    });
  }

  function recordBossDefeat(bossType) {
    const before = Object.fromEntries(Object.keys(weaponUnlocks).map(weapon => [weapon, isWeaponUnlocked(weapon)]));
    metaProgress.bossDefeats += 1;
    metaProgress.seeds += 2;
    if (!game.debugAssisted && bossType && !metaProgress.defeatedBossTypes.includes(bossType)) {
      metaProgress.defeatedBossTypes.push(bossType);
      metaProgress.supplyCoins += 12;
      game.supplyBonus = (game.supplyBonus || 0) + 12;
      game.texts.push({ text: "首次领主悬赏 · 补给币 +12", x: ROOM_WIDTH / 2, y: 192, life: 3.2, color: "#ffd56e", size: 15 });
    }
    const blueprint = Object.entries(weaponRecipes).find(([id, recipe]) => recipe.blueprintAt <= metaProgress.bossDefeats && !metaProgress.blueprints.includes(id));
    if (blueprint) {
      metaProgress.blueprints.push(blueprint[0]);
      game.unlocks.push(`${blueprint[1].name}图纸`);
      game.texts.push({ text: `稀有掉落 · ${blueprint[1].name}图纸`, x: ROOM_WIDTH / 2, y: 188, life: 3.2, color: "#b8ef86" });
    }
    for (const weapon of Object.keys(weaponUnlocks)) {
      if (!before[weapon] && isWeaponUnlocked(weapon)) {
        game.unlocks.push(weaponNames[weapon]);
        game.texts.push({ text: `永久解锁 · ${weaponNames[weapon]}`, x: ROOM_WIDTH / 2, y: 160, life: 3.2, color: "#a9e5bc" });
      }
    }
    game.seedsFound += 2;
    saveMetaProgress();
  }

  function applySelectedBooster() {
    const boosterId = metaProgress.selectedBooster;
    if (!boosterId || !benefitProducts[boosterId] || (metaProgress.boosterInventory[boosterId] || 0) <= 0) return;
    metaProgress.boosterInventory[boosterId] -= 1;
    metaProgress.selectedBooster = null;
    game.activeBooster = boosterId;
    if (boosterId === "sparePlate") game.player.armor += 1;
    if (boosterId === "luckyBadge") game.treasureRerolls = 1;
    if (boosterId === "ration") game.rationReady = true;
    game.texts.push({ text: `补给生效 · ${benefitProducts[boosterId].name}`, x: ROOM_WIDTH / 2, y: 150, life: 3, color: "#ffd56e", size: 15 });
    saveMetaProgress();
  }

  function updateRerollControl() {
    if (!rerollButton) return;
    const room = game && game.rooms[game.room];
    const available = Boolean(game && game.state === "playing" && room?.kind === "treasure" && !room.cleared && game.treasureRerolls > 0 && game.pickups.some(pickup => pickup.choiceGroup === "treasure" && !pickup.dead));
    rerollButton.classList.toggle("active", available);
    rerollButton.textContent = available ? `幸运刷新 · R · 剩余 ${game.treasureRerolls}` : "幸运刷新 · R";
  }

  function rerollTreasure() {
    if (!game || game.state !== "playing") return false;
    const room = game.rooms[game.room];
    if (room.kind !== "treasure" || room.cleared || game.treasureRerolls <= 0) return false;
    const treasurePickups = game.pickups.filter(pickup => pickup.choiceGroup === "treasure" && !pickup.dead);
    if (!treasurePickups.length) return false;
    room.choices = randomItems(3, heroes[game.player.hero].tag);
    game.pickups = game.pickups.filter(pickup => pickup.choiceGroup !== "treasure");
    room.choices.forEach((item, choice) => game.pickups.push({ x: ROOM_WIDTH / 2 + (choice - 1) * 170, y: ROOM_HEIGHT / 2, type: "item", item, phase: choice, choiceGroup: "treasure" }));
    game.treasureRerolls -= 1;
    game.texts.push({ text: "幸运徽章 · 宝藏已刷新", x: ROOM_WIDTH / 2, y: 132, life: 2.2, color: "#d7b8ff", size: 16 });
    sound(520, .14, "sine", .015);
    updateRerollControl();
    return true;
  }

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

  function drawLayeredEllipse(x, y, radiusX, radiusY, rotation, fill, stroke, highlight = "#ffffff") {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.fillStyle = fill;
    context.strokeStyle = stroke;
    context.lineWidth = Math.max(2.5, Math.min(radiusX, radiusY) * .16);
    context.beginPath();
    context.ellipse(0, 0, radiusX, radiusY, 0, 0, TAU);
    context.fill();
    context.stroke();
    context.fillStyle = highlight;
    context.globalAlpha = .16;
    context.beginPath();
    context.ellipse(-radiusX * .24, -radiusY * .3, radiusX * .5, radiusY * .24, -.25, 0, TAU);
    context.fill();
    context.globalAlpha = 1;
    context.restore();
  }

  function drawBonePlate(x, y, widthValue, heightValue, rotation = 0, cracked = false, fill = "#c8b98f") {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.fillStyle = fill;
    context.strokeStyle = "#33282a";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(-widthValue * .5, -heightValue * .18);
    context.lineTo(-widthValue * .28, -heightValue * .5);
    context.lineTo(widthValue * .32, -heightValue * .43);
    context.lineTo(widthValue * .52, 0);
    context.lineTo(widthValue * .28, heightValue * .5);
    context.lineTo(-widthValue * .38, heightValue * .4);
    context.closePath();
    context.fill();
    context.stroke();
    context.strokeStyle = "rgba(78, 58, 52, .58)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(-widthValue * .3, -heightValue * .16);
    context.lineTo(widthValue * .3, heightValue * .15);
    if (cracked) {
      context.moveTo(0, -heightValue * .34);
      context.lineTo(-widthValue * .08, 0);
      context.lineTo(widthValue * .12, heightValue * .3);
    }
    context.stroke();
    context.restore();
  }

  function drawFang(x, y, length, widthValue, rotation = 0, fill = "#ead9a8") {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.fillStyle = fill;
    context.strokeStyle = "#352528";
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(-widthValue / 2, 0);
    context.quadraticCurveTo(0, -widthValue * .35, widthValue / 2, 0);
    context.lineTo(0, length);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  function drawVein(x1, y1, controlX, controlY, x2, y2, color, widthValue = 4) {
    context.strokeStyle = "#2b1920";
    context.lineWidth = widthValue + 3;
    context.lineCap = "round";
    context.beginPath(); context.moveTo(x1, y1); context.quadraticCurveTo(controlX, controlY, x2, y2); context.stroke();
    context.strokeStyle = color;
    context.lineWidth = widthValue;
    context.beginPath(); context.moveTo(x1, y1); context.quadraticCurveTo(controlX, controlY, x2, y2); context.stroke();
  }

  function drawRimmedEye(x, y, radiusX, radiusY, lookX, lookY, iris = "#8d2739", sclera = "#e8d9b9") {
    context.save();
    context.translate(x, y);
    context.fillStyle = "#431f2a";
    context.beginPath(); context.ellipse(0, 0, radiusX + 5, radiusY + 5, 0, 0, TAU); context.fill();
    context.fillStyle = sclera;
    context.strokeStyle = "#24191e";
    context.lineWidth = 2.5;
    context.beginPath(); context.ellipse(0, 0, radiusX, radiusY, 0, 0, TAU); context.fill(); context.stroke();
    context.fillStyle = iris;
    context.beginPath(); context.arc(clamp(lookX, -radiusX * .25, radiusX * .25), clamp(lookY, -radiusY * .25, radiusY * .25), Math.min(radiusX, radiusY) * .55, 0, TAU); context.fill();
    context.fillStyle = "#171218";
    context.beginPath(); context.arc(clamp(lookX, -radiusX * .25, radiusX * .25), clamp(lookY, -radiusY * .25, radiusY * .25), Math.min(radiusX, radiusY) * .25, 0, TAU); context.fill();
    context.fillStyle = "#fff7e5";
    context.beginPath(); context.arc(-radiusX * .17, -radiusY * .22, Math.max(1.5, radiusY * .13), 0, TAU); context.fill();
    context.restore();
  }

  function drawMaw(x, y, radiusX, radiusY, teeth = 7, rotation = 0, open = 1) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.fillStyle = "#24141c";
    context.strokeStyle = "#4d242d";
    context.lineWidth = 4;
    context.beginPath(); context.ellipse(0, 0, radiusX, radiusY * open, 0, 0, TAU); context.fill(); context.stroke();
    for (let index = 0; index < teeth; index += 1) {
      const ratio = teeth === 1 ? .5 : index / (teeth - 1);
      const toothX = -radiusX * .72 + ratio * radiusX * 1.44;
      drawFang(toothX, -radiusY * open * .72, radiusY * open * .65, Math.max(3, radiusX / teeth), 0);
      drawFang(toothX, radiusY * open * .72, radiusY * open * .65, Math.max(3, radiusX / teeth), Math.PI);
    }
    context.restore();
  }

  function drawChitinSegment(x, y, radiusX, radiusY, rotation, fill, accent, cracked = false) {
    drawLayeredEllipse(x, y, radiusX, radiusY, rotation, fill, "#292126", accent);
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.strokeStyle = accent;
    context.globalAlpha = .48;
    context.lineWidth = 2;
    context.beginPath(); context.arc(0, 0, Math.min(radiusX, radiusY) * .72, -.9, .9); context.stroke();
    if (cracked) {
      context.strokeStyle = "#372128";
      context.globalAlpha = .9;
      context.beginPath(); context.moveTo(-4, -radiusY * .72); context.lineTo(2, -3); context.lineTo(-5, 7); context.lineTo(4, radiusY * .66); context.stroke();
    }
    context.restore();
  }

  function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function randomItems(count, preferredTag) {
    const pool = [...availableItems()];
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
      const variant = randomChoice(chapter.variants);
      for (let roomIndex = 0; roomIndex < 5; roomIndex += 1) {
        const level = dungeon.length + 1;
        const shared = { chapter: chapter.act - 1, depth: chapterIndex + 1, floorLabel: chapter.floor, biome: variant.name, floorRoom: roomIndex + 1, level, theme: variant.theme, branchDepth: chapter.branchDepth || 0, cleared: false };
        if (roomIndex === 4) {
          dungeon.push({ ...shared, name: chapter.bossName, bossName: chapter.bossName, kind: "boss", enemies: [chapter.boss] });
          continue;
        }
        if (roomIndex === 1) {
          dungeon.push({ ...shared, name: `${variant.name}宝库`, kind: "treasure", enemies: [], choices: randomItems(3, heroes[selectedHero].tag) });
          continue;
        }
        if (roomIndex === 3) {
          dungeon.push({ ...shared, name: "盲眼商贩", kind: "shop", enemies: [], choices: randomItems(3, heroes[selectedHero].tag) });
          continue;
        }
        const pools = [
          ["grunt", "charger", "leech"],
          ["grunt", "charger", "turret", "bat", "cultist"],
          ["charger", "turret", "bat", "splitter", "cultist", "bomber"]
        ];
        const pool = pools[Math.min(2, Math.floor(chapterIndex / 3))];
        const modifier = chapterIndex === 0 && roomIndex === 0 ? null : randomChoice(Object.keys(roomModifiers));
        const enemyCount = Math.min(4 + Math.floor(chapterIndex / 2) + roomIndex + Math.floor(random(0, 2)) + (modifier === "swarm" ? 2 : 0), 12);
        const enemyTypes = Array.from({ length: enemyCount }, () => randomChoice(pool));
        if (chapterIndex === 0 && roomIndex === 0) enemyTypes.splice(0, 2, "grunt", "charger");
        if (chapterIndex === 0 && roomIndex === 1) enemyTypes.splice(0, 2, "leech", "turret");
        if (chapterIndex === 2 && roomIndex === 0) enemyTypes.splice(0, 2, "bat", "cultist");
        if (chapterIndex === 4 && roomIndex === 0) enemyTypes.splice(0, 2, "splitter", "bomber");
        if (roomIndex === 2) enemyTypes.push(chapterIndex < 3 ? "cultist" : chapterIndex < 7 ? "bomber" : "splitter");
        dungeon.push({
          ...shared,
          name: chapterIndex === 0 && roomIndex === 0 ? "入口前厅" : randomChoice(roomNames[variant.theme]),
          kind: roomIndex === 2 ? "elite" : "combat",
          enemies: enemyTypes, modifier
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
    const portrait = height > width && width <= 760;
    if (portrait) {
      scale = width / ROOM_WIDTH;
      const topGutter = Math.max(48, height * .07);
      const touchReserve = Math.min(190, height * .27);
      verticalScale = Math.min(scale * 2, Math.max(scale, (height - topGutter - touchReserve) / ROOM_HEIGHT));
      offsetX = 0;
      offsetY = topGutter;
    } else {
      scale = Math.min(width / ROOM_WIDTH, height / ROOM_HEIGHT);
      verticalScale = scale;
      offsetX = (width - ROOM_WIDTH * scale) / 2;
      offsetY = (height - ROOM_HEIGHT * verticalScale) / 2;
    }
  }

  function isTouchDevice() {
    return Boolean(window.matchMedia?.("(pointer: coarse)").matches || window.navigator?.maxTouchPoints > 0 || width <= 760);
  }

  async function requestLandscapeMode() {
    if (!isTouchDevice()) return false;
    try {
      if (!document.fullscreenElement && document.documentElement?.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      }
    } catch {}
    try {
      if (window.screen?.orientation?.lock) await window.screen.orientation.lock("landscape");
    } catch {}
    resize();
    return window.innerWidth > window.innerHeight;
  }

  function newGame() {
    setGuideOpen(false);
    setWorkshopOpen(false);
    setBenefitsOpen(false);
    keys.clear();
    pointer.down = false;
    pointer.moveDown = false;
    hitStop = 0;
    game = {
      state: "playing",
      room: 0,
      roomTime: 0,
      elapsed: 0,
      kills: 0,
      bossKills: 0,
      seedsFound: 0,
      itemsFound: 0,
      combo: 0,
      comboTimer: 0,
      perfectRooms: 0,
      evades: 0,
      destroyedProps: 0,
      shopPurchases: 0,
      damageDealt: 0,
      damageTaken: 0,
      damageBySource: {},
      lastDamageSource: "尚未受伤",
      unlocks: [],
      affixesSeen: {},
      routeChoices: 0,
      routeChoice: null,
      finalBranch: null,
      bossMechanics: {},
      bossSignatures: {},
      bossSignatureResolutions: {},
      debugAssisted: false,
      activeBooster: null,
      rationReady: false,
      treasureRerolls: 0,
      supplyBonus: 0,
      supplySettlement: null,
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
      hazards: [],
      slashes: [],
      bossWaves: [],
      bossLasers: [],
      arenaInset: 0,
      texts: [],
      doorOpen: false,
      transition: 1,
      player: {
        x: WALL + 76, y: ROOM_HEIGHT / 2, radius: 14, hp: 6, maxHp: 6,
        speed: 230, angle: 0, aimAngle: 0, moveAngle: 0, vx: 0, vy: 0, cooldown: 0, fireRate: .22,
        damage: 1, bulletSpeed: 530, bulletLife: 1.4, shots: 1, roll: 0, rollCooldown: 0,
        rollDelay: .9, critChance: .05, pierce: 0, pickupRadius: 28, roomHeal: 0, bulletSize: 4,
        armor: 0, invincible: 0, flash: 0, coins: 0, knockbackX: 0, knockbackY: 0,
        walk: 0, moveBlend: 0, recoil: 0, squash: 0, muzzleFlash: 0, rollAngle: 0,
        rollSpin: 0, trailTimer: 0, skillCooldown: 0, skillDelay: 8, rage: 0,
        explosion: 0, deathBurst: 0, chain: 0, discount: 0, luck: 0,
        coinPower: 0, contactGuard: 0, hero: selectedHero, weapon: "repeater", weaponLevel: 1, familiars: 0,
        shotSequence: 0, evadeCount: 0,
        burnChance: 0, freezeChance: 0, poisonChance: 0, bleedChance: 0, shockChance: 0,
        burnExplosion: false, shatter: false, bleedHeal: false, healCharge: 0, familiarPhase: 0
      }
    };
    heroes[selectedHero].apply(game.player);
    applyStartingWeapon(game.player, isWeaponUnlocked(selectedWeapon) ? selectedWeapon : "repeater");
    enterRoom(0);
    applySelectedBooster();
    startScreen.classList.remove("visible");
    endScreen.classList.remove("visible");
    gameShell.classList.add("playing");
    touchUi.classList.add("active");
    game.texts.push({ text: "遗物会自动生效 · 按 I 查看完整说明", x: ROOM_WIDTH / 2, y: 122, life: 4, color: "#f1d28c", size: 15 });
    requestAnimationFrame(() => canvas.focus({ preventScroll: true }));
  }

  function applyStartingWeapon(player, weapon) {
    player.weapon = weapon;
    player.weaponLevel = 1;
    if (weapon === "scatter") {
      player.shots = Math.max(3, player.shots);
      player.damage *= .86;
    } else if (weapon === "wisp") {
      player.familiars = 2;
      player.damage *= .9;
    } else if (weapon === "cleaver") {
      player.damage *= 1.18;
      player.speed += 10;
    } else if (weapon === "seeker") {
      player.damage *= .92;
      player.fireRate *= 1.08;
      player.shots = Math.max(2, player.shots);
    } else if (weapon === "prism") {
      player.damage *= 1.22;
      player.fireRate *= 1.45;
      player.pierce += 1;
    } else if (weapon === "orbit") {
      player.damage *= 1.15;
      player.fireRate *= 1.7;
      player.bulletLife *= 1.2;
    }
  }

  function enterRoom(index) {
    releaseFire();
    game.room = index;
    game.roomTime = 0;
    game.doorOpen = false;
    game.bullets.length = 0;
    game.enemyBullets.length = 0;
    game.enemies.length = 0;
    game.pickups.length = 0;
    game.obstacles.length = 0;
    game.bombs.length = 0;
    game.hazards.length = 0;
    game.slashes.length = 0;
    game.bossWaves.length = 0;
    game.bossLasers.length = 0;
    game.arenaInset = 0;
    game.texts.length = 0;
    game.roomHit = false;
    game.player.x = WALL + 66;
    game.player.y = ROOM_HEIGHT / 2;
    game.player.vx = 0;
    game.player.vy = 0;
    game.transition = 1;
    const room = game.rooms[index];
    room.enemies.forEach(spawnEnemy);
    if (room.kind === "boss" && game.rationReady) {
      game.rationReady = false;
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + 1);
      game.texts.push({ text: "旅行口粮 · 恢复半颗心", x: ROOM_WIDTH / 2, y: 156, life: 2.4, color: "#9ee3a8", size: 15 });
    }
    if (room.kind === "sanctuary" && !room.cleared) {
      room.cleared = true;
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + 3);
      game.player.armor += 1;
      game.player.coins += 2 + room.chapter;
      game.doorOpen = true;
      game.texts.push({ text: `守烛圣所 · 恢复生命、护盾与 ${2 + room.chapter} 枚弹壳币`, x: ROOM_WIDTH / 2, y: 128, life: 2.8, color: "#a7e4bc", size: 16 });
    }
    if (room.kind === "treasure" && !room.cleared) {
      room.choices.forEach((item, choice) => game.pickups.push({ x: ROOM_WIDTH / 2 + (choice - 1) * 170, y: ROOM_HEIGHT / 2, type: "item", item, phase: choice, choiceGroup: "treasure" }));
      game.texts.push({ text: "宝库馈赠 · 三选一", x: ROOM_WIDTH / 2, y: 130, life: 2.5 });
    }
    if (room.kind === "shop" && !room.cleared) {
      room.choices.forEach((item, choice) => {
        const x = ROOM_WIDTH / 2 + (choice - 1) * 170;
        const price = Math.max(1, Math.round((2 + choice * 2 + room.chapter) * (1 - game.player.discount)));
        game.pickups.push({ x, y: ROOM_HEIGHT / 2, homeX: x, homeY: ROOM_HEIGHT / 2, type: "item", item, phase: choice, price, shopItem: true });
      });
      game.doorOpen = true;
      game.texts.push({ text: `盲眼商贩 · 靠近或点击购买 · 持有 ${game.player.coins} 枚`, x: ROOM_WIDTH / 2, y: 130, life: 2.8, size: 16 });
    }
    createObstacles(room);
    if (room.cleared) game.doorOpen = true;
    updateRerollControl();
  }

  function createObstacles(room) {
    if (["treasure", "shop", "sanctuary"].includes(room.kind)) return;
    const count = room.kind === "boss" ? 3 : 6 + Math.min(4, room.chapter);
    for (let index = 0; index < count; index += 1) {
      const seed = room.level * 83 + index * 29;
      const type = room.kind === "boss" ? "spike" : seeded(seed) < .45 ? "rock" : seeded(seed + 4) < .72 ? "urn" : "spike";
      game.obstacles.push({
        x: WALL + 240 + seeded(seed + 7) * (ROOM_WIDTH - WALL * 2 - 330),
        y: WALL + 90 + seeded(seed + 13) * (ROOM_HEIGHT - WALL * 2 - 180),
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
    const bossProfile = bossProfiles[type];
    const turret = type === "turret";
    const charger = type === "charger";
    const bat = type === "bat";
    const splitter = type === "splitter";
    const leech = type === "leech";
    const cultist = type === "cultist";
    const bomber = type === "bomber";
    const room = game.rooms[game.room];
    const levelScale = (1 + (room.depth - 1) * .13) * (room.modifier === "swarm" ? .86 : 1) * (room.riskReward ? 1.3 : 1);
    const bossHp = bossProfile ? bossProfile.hp : 34;
    const baseHp = boss ? bossHp : turret ? 9 : splitter ? 8 : cultist ? 7 : bomber ? 10 : charger ? 6 : leech ? 4 : bat ? 3 : 4;
    let x;
    let y;
    do {
      x = random(boss ? ROOM_WIDTH * .48 : ROOM_WIDTH * .3, ROOM_WIDTH - WALL - 58);
      y = random(WALL + 54, ROOM_HEIGHT - WALL - 54);
    } while (Math.hypot(x - game.player.x, y - game.player.y) < 220);
    const elite = game.rooms[game.room].kind === "elite" && !boss;
    const affixKeys = Object.keys(eliteAffixes);
    const affix = elite ? affixKeys[(game.room + enemySerial + 1) % affixKeys.length] : null;
    if (affix) game.affixesSeen[affix] = (game.affixesSeen[affix] || 0) + 1;
    const enemy = {
      id: ++enemySerial, type, x, y, radius: boss ? bossProfile.radius : bomber ? 22 : turret ? 20 : splitter ? 19 : cultist ? 18 : charger ? 18 : leech ? 12 : bat ? 13 : 16,
      baseRadius: boss ? bossProfile.radius : null,
      hp: Math.ceil(baseHp * levelScale * (elite ? 1.55 : 1)),
      maxHp: Math.ceil(baseHp * levelScale * (elite ? 1.55 : 1)),
      speed: (boss ? bossProfile.speed : bomber ? 48 : turret ? 30 : splitter ? 56 : cultist ? 68 : charger ? 80 : leech ? 150 : bat ? 138 : random(64, 92)) * (room.modifier === "frenzy" ? 1.24 : 1) * (affix === "frenzied" ? 1.22 : 1),
      cooldown: random(.3, 1.2), angle: 0, flash: 0, recoil: 0, attackFlash: 0, squash: 0,
      phase: random(0, TAU), charge: 0, windup: 0, chargeAngle: 0, spawnCooldown: 2.8,
      elite, affix, shield: affix === "warded" ? Math.ceil(4 * levelScale) : 0,
      maxShield: affix === "warded" ? Math.ceil(4 * levelScale) : 0,
      summons: 0, guardTextCooldown: 0,
      statuses: { burn: 0, freeze: 0, poison: 0, bleed: 0, shock: 0 },
      statusTicks: { burn: 0, poison: 0, bleed: 0 }, bossStage: boss ? 1 : 0,
      stageTransition: 0, signatureCooldown: 4.6, waveCooldown: 2.4, hazardCooldown: 2.8, actionTimer: 0,
      moveX: Math.random() < .5 ? -1 : 1, moveY: 0, attackMode: null, telegraph: 0,
      targetX: 0, targetY: 0, telegraphTargets: [], signatureName: "", submerged: false, invulnerable: false, orbsSpawned: 0, dead: false
    };
    if (boss && ["bossIdol", "bossMatron", "bossHeart", "bossInfernal"].includes(type)) {
      enemy.x = ROOM_WIDTH / 2 + 80;
      enemy.y = type === "bossInfernal" ? ROOM_HEIGHT * .23 : ROOM_HEIGHT / 2;
    }
    game.enemies.push(enemy);
  }

  function firePlayer(angle) {
    const player = game.player;
    if (player.cooldown > 0 || player.roll > 0) return;
    if (player.weapon === "seeker") {
      const lock = nearestEnemy(player);
      if (lock) angle = Math.atan2(lock.y - player.y, lock.x - player.x);
    }
    player.angle = angle;
    player.aimAngle = angle;
    if (player.weapon === "cleaver") {
      swingCleaver(angle);
      return;
    }
    player.shotSequence += 1;
    const burstShot = player.weapon === "repeater" && player.shotSequence % 5 === 0;
    player.cooldown = player.weapon === "scatter" ? Math.max(.32, player.fireRate * 1.55) : player.weapon === "prism" ? Math.max(.32, player.fireRate) : player.weapon === "orbit" ? Math.max(.4, player.fireRate) : player.fireRate;
    player.recoil = player.weapon === "scatter" || player.weapon === "prism" ? 10 : 6;
    player.squash = Math.max(player.squash, .28);
    player.muzzleFlash = player.weapon === "prism" ? .14 : .075;
    const critical = Math.random() < player.critChance;
    const coinMultiplier = 1 + Math.min(1.5, player.coins * player.coinPower);
    const rageMultiplier = player.rage > 0 ? 1.65 : 1;
    const shotCount = player.weapon === "scatter" ? Math.max(3, player.shots) : player.weapon === "wisp" ? Math.max(2, player.familiars) : player.weapon === "seeker" ? 2 : player.weapon === "orbit" ? 2 : burstShot ? 3 : player.shots;
    const spread = player.weapon === "scatter" ? .2 : player.weapon === "wisp" ? .08 : player.weapon === "seeker" ? .14 : player.weapon === "orbit" ? .3 : burstShot ? .18 : .105;
    const damageMultiplier = player.weapon === "scatter" ? .68 : player.weapon === "wisp" ? .72 : player.weapon === "seeker" ? .78 : player.weapon === "prism" ? 1.65 : player.weapon === "orbit" ? 1.35 : burstShot ? .8 : 1;
    const speedMultiplier = player.weapon === "scatter" ? .88 : player.weapon === "wisp" ? .82 : player.weapon === "seeker" ? .68 : player.weapon === "prism" ? 1.35 : player.weapon === "orbit" ? .72 : 1;
    const lifeMultiplier = player.weapon === "scatter" ? .58 : player.weapon === "wisp" ? 1.18 : player.weapon === "seeker" ? 1.45 : player.weapon === "orbit" ? 1.35 : 1;
    for (let shot = 0; shot < shotCount; shot += 1) {
      const shotAngle = angle + (shot - (shotCount - 1) / 2) * spread;
      const familiarAngle = player.familiarPhase + shot / shotCount * TAU;
      const originX = player.weapon === "wisp" ? player.x + Math.cos(familiarAngle) * 34 : player.x + Math.cos(shotAngle) * 19;
      const originY = player.weapon === "wisp" ? player.y + Math.sin(familiarAngle) * 24 : player.y + Math.sin(shotAngle) * 19;
      const maxLife = player.bulletLife * lifeMultiplier;
      const target = player.weapon === "seeker" ? nearestEnemy({ x: originX, y: originY }) : null;
      game.bullets.push({
        x: originX, y: originY, previousX: originX - Math.cos(shotAngle) * 7, previousY: originY - Math.sin(shotAngle) * 7,
        vx: Math.cos(shotAngle) * player.bulletSpeed * speedMultiplier,
        vy: Math.sin(shotAngle) * player.bulletSpeed * speedMultiplier,
        radius: player.bulletSize + (player.weapon === "prism" ? 2 : 0) + (critical ? 1.5 : 0), life: maxLife, maxLife,
        damage: player.damage * damageMultiplier * coinMultiplier * rageMultiplier * (critical ? 2 : 1), critical,
        pierce: player.pierce + (player.weapon === "orbit" ? 4 : 0), explosion: player.explosion, chain: player.chain + (player.weapon === "wisp" ? 1 : 0),
        weapon: player.weapon, playerAttack: true, hitIds: new Set(), age: 0, trailCooldown: 0,
        homing: player.weapon === "seeker" ? 8.5 : 0, targetId: target?.id || null,
        bounces: player.weapon === "prism" ? 2 + Math.floor(player.weaponLevel / 2) : 0,
        boomerang: player.weapon === "orbit", curve: player.weapon === "orbit" ? (shot ? -1 : 1) : 0
      });
    }
    const color = player.weapon === "wisp" ? "#bca8ff" : player.weapon === "seeker" ? "#8cf3dc" : player.weapon === "prism" ? "#9edbff" : player.weapon === "orbit" ? "#ff7299" : "#ffd76a";
    directionalBurst(player.x + Math.cos(angle) * 34, player.y + Math.sin(angle) * 34, angle, color, player.weapon === "scatter" || player.weapon === "prism" ? 12 : 7, player.weapon === "scatter" ? 155 : 125);
    if (["prism", "orbit"].includes(player.weapon)) shockwave(player.x + Math.cos(angle) * 24, player.y + Math.sin(angle) * 24, color, 5);
    sound(player.weapon === "scatter" ? 145 : player.weapon === "wisp" ? 330 : player.weapon === "seeker" ? 410 : player.weapon === "prism" ? 560 : player.weapon === "orbit" ? 180 : 220 + Math.random() * 35, player.weapon === "scatter" ? .08 : .055, ["wisp", "seeker", "prism"].includes(player.weapon) ? "sine" : "triangle", player.weapon === "scatter" ? .016 : .011);
  }

  function swingCleaver(angle) {
    const player = game.player;
    const level = player.weaponLevel;
    const critical = Math.random() < player.critChance;
    const coinMultiplier = 1 + Math.min(1.5, player.coins * player.coinPower);
    const radius = 126 + player.bulletSize * 2.5 + (level - 1) * 16;
    const maxLife = .28 + (level - 1) * .015;
    player.cooldown = Math.max(.28, player.fireRate * 1.42);
    player.recoil = -4;
    player.squash = .62;
    game.slashes.push({
      x: player.x, y: player.y, angle, radius, waveRadius: radius + 38 + (level - 1) * 5,
      guardRadius: 64 + (level - 1) * 8,
      arc: 2.25 + (level - 1) * .18, waveArc: 1.62 + (level - 1) * .15,
      life: maxLife, maxLife,
      damage: player.damage * coinMultiplier * (player.rage > 0 ? 1.65 : 1) * (2.15 + (level - 1) * .28) * (critical ? 2 : 1),
      waveDamage: .62 + (level - 1) * .04,
      critical, playerAttack: true, melee: true, hitIds: new Set(), blocked: 0
    });
    directionalBurst(player.x + Math.cos(angle) * 76, player.y + Math.sin(angle) * 76, angle, critical ? "#fff2a1" : "#d8c7a4", 16, 215);
    shockwave(player.x + Math.cos(angle) * 42, player.y + Math.sin(angle) * 42, critical ? "#fff0a3" : "#b9e8ef", 7);
    sound(125, .11, "sawtooth", .018);
  }

  function createBossBullet(enemy, angle, speed, options = {}) {
    const stageStats = bossStats(enemy);
    const theme = bossAttackThemes[enemy.type] || bossAttackThemes.bossHeart;
    const projectileSpeed = speed * stageStats.projectileSpeed * (options.speedScale || 1);
    game.enemyBullets.push({
      x: options.x ?? enemy.x, y: options.y ?? enemy.y,
      previousX: options.x ?? enemy.x, previousY: options.y ?? enemy.y,
      vx: Math.cos(angle) * projectileSpeed, vy: Math.sin(angle) * projectileSpeed,
      radius: (options.radius || 5.5) * stageStats.projectileSize,
      damage: bossDamage(enemy, options.damageScale || 1), stage: enemy.bossStage, life: options.life || 5,
      ownerId: enemy.id, kind: `${theme.name} · ${enemy.bossStage} 阶`, bossType: enemy.type,
      style: theme.shape, color: theme.color, coreColor: theme.core, trailColor: theme.trail,
      curve: options.curve || 0, acceleration: options.acceleration || 0, age: 0
    });
  }

  function enemyFire(enemy, count = 1, spread = .18) {
    const base = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
    const stageStats = isBoss(enemy) ? bossStats(enemy) : null;
    enemy.recoil = isBoss(enemy) ? 8 : 4;
    enemy.attackFlash = .12;
    for (let index = 0; index < count; index += 1) {
      const angle = base + (index - (count - 1) / 2) * spread;
      if (isBoss(enemy)) createBossBullet(enemy, angle, 215, { life: 4 });
      else game.enemyBullets.push({
        x: enemy.x, y: enemy.y, previousX: enemy.x, previousY: enemy.y,
        vx: Math.cos(angle) * 190, vy: Math.sin(angle) * 190,
        radius: 5, life: 4, damage: 1, stage: 0, ownerId: enemy.id, kind: "敌方弹幕"
      });
    }
    const muzzleColor = isBoss(enemy) ? bossAttackThemes[enemy.type].color : "#ff7657";
    directionalBurst(enemy.x + Math.cos(base) * enemy.radius, enemy.y + Math.sin(base) * enemy.radius, base, muzzleColor, isBoss(enemy) ? 8 : 4, 80);
  }

  function radialFire(enemy, count) {
    const stageStats = isBoss(enemy) ? bossStats(enemy) : null;
    enemy.attackFlash = .16;
    enemy.squash = .34;
    for (let index = 0; index < count; index += 1) {
      const angle = enemy.phase + index / count * TAU;
      if (isBoss(enemy)) createBossBullet(enemy, angle, 155);
      else game.enemyBullets.push({ x: enemy.x, y: enemy.y, previousX: enemy.x, previousY: enemy.y, vx: Math.cos(angle) * 155, vy: Math.sin(angle) * 155, radius: 6, damage: 1, stage: 0, life: 5, ownerId: enemy.id, kind: "敌方弹幕" });
    }
    shockwave(enemy.x, enemy.y, isBoss(enemy) ? bossAttackThemes[enemy.type].color : "#e45645", 4);
  }

  function radialFireAtSpeed(enemy, count, speed, offset = enemy.phase) {
    const stageStats = bossStats(enemy);
    enemy.attackFlash = .16;
    enemy.squash = .34;
    for (let index = 0; index < count; index += 1) {
      const angle = offset + index / count * TAU;
      createBossBullet(enemy, angle, speed);
    }
    shockwave(enemy.x, enemy.y, bossAttackThemes[enemy.type].color, 4);
  }

  function roll() {
    const player = game.player;
    if (game.state !== "playing" || player.rollCooldown > 0) return;
    player.roll = .24;
    player.rollCooldown = player.rollDelay;
    player.invincible = .34;
    const velocityLength = Math.hypot(player.vx, player.vy);
    player.rollAngle = velocityLength > 18 ? Math.atan2(player.vy, player.vx) : player.moveBlend > .1 ? player.moveAngle : player.aimAngle;
    player.rollSpin = 0;
    player.trailTimer = 0;
    player.squash = .75;
    burst(player.x, player.y, "#d8c7a2", 10, 90);
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

  function drawLightningBurst(source, target, color = "#bfa8ff") {
    const steps = 7;
    for (let index = 0; index <= steps; index += 1) {
      const ratio = index / steps;
      game.particles.push({
        x: source.x + (target.x - source.x) * ratio + random(-8, 8),
        y: source.y + (target.y - source.y) * ratio + random(-8, 8),
        vx: 0, vy: 0, life: .22, maxLife: .22, color, size: 3, glow: true
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

  function directionalBurst(x, y, angle, color, count, speed) {
    for (let index = 0; index < count; index += 1) {
      const sparkAngle = angle + random(-.62, .62);
      const velocity = random(speed * .45, speed);
      game.particles.push({
        x, y, vx: Math.cos(sparkAngle) * velocity, vy: Math.sin(sparkAngle) * velocity,
        life: random(.08, .2), maxLife: .2, color, size: random(1.4, 3.2), streak: true
      });
    }
  }

  function impactBurst(x, y, angle, critical, weapon = "repeater") {
    const weaponColors = { repeater: "#f7bc62", scatter: "#ff8b55", wisp: "#bfa8ff", cleaver: "#e8dfc7", seeker: "#79f2d0", prism: "#a8e8ff", orbit: "#ff719f" };
    const color = critical ? "#fff4a8" : weaponColors[weapon] || "#f7bc62";
    directionalBurst(x, y, angle + Math.PI, color, critical ? 12 : 7, critical ? 240 : 165);
    if (["wisp", "seeker", "prism", "orbit"].includes(weapon)) {
      game.particles.push({ x, y, vx: 0, vy: 0, life: .28, maxLife: .28, color, size: weapon === "prism" ? 9 : 6, ring: true });
      for (let index = 0; index < (critical ? 7 : 4); index += 1) {
        const sparkAngle = angle + index / (critical ? 7 : 4) * TAU;
        game.particles.push({ x, y, vx: Math.cos(sparkAngle) * 85, vy: Math.sin(sparkAngle) * 85, life: .26, maxLife: .26, color, size: 3.5, star: weapon === "prism", glow: true });
      }
    }
    for (let index = 0; index < (critical ? 8 : 4); index += 1) {
      const bloodAngle = angle + random(-1.15, 1.15);
      const velocity = random(45, critical ? 175 : 115);
      game.particles.push({
        x, y, vx: Math.cos(bloodAngle) * velocity, vy: Math.sin(bloodAngle) * velocity,
        life: random(.2, .42), maxLife: .42, color: "#9e3340", size: random(2.2, 4.4), drop: true
      });
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
    const damage = source && source.type && player.contactGuard ? Math.max(.5, amount * (1 - player.contactGuard)) : amount;
    player.hp -= damage;
    game.damageTaken += damage;
    game.lastDamageSource = source?.kind || (source?.type ? `接触：${source.type}` : "未知伤害");
    const attacker = source && source.ownerId ? game.enemies.find(enemy => enemy.id === source.ownerId) : source && source.id ? source : null;
    if (attacker && attacker.affix === "vampiric" && !attacker.dead) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + 1.5);
      game.texts.push({ text: "汲血 +", x: attacker.x, y: attacker.y - attacker.radius - 10, life: .65, color: "#f07899", size: 13, velocityY: -18 });
      directionalBurst(player.x, player.y, Math.atan2(attacker.y - player.y, attacker.x - player.x), "#c94e72", 8, 120);
    }
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
    recordDailyProgress("kills", 1);
    game.combo = Math.min(30, game.combo + 1);
    game.comboTimer = 3.5;
    if (isBoss(enemy)) {
      game.bossKills += 1;
      recordDailyProgress("boss", 1);
      recordBossDefeat(enemy.type);
    }
    if (isBoss(enemy)) game.arenaInset = 0;
    screenShake = isBoss(enemy) ? 18 : 5;
    burst(enemy.x, enemy.y, isBoss(enemy) ? "#f7bd53" : "#c84c4c", isBoss(enemy) ? 40 : 15, isBoss(enemy) ? 260 : 150);
    sound(isBoss(enemy) ? 72 : 130, isBoss(enemy) ? .42 : .08, "square", isBoss(enemy) ? .04 : .012);
    if (game.player.shatter && enemy.statuses && enemy.statuses.freeze > 0) {
      shockwave(enemy.x, enemy.y, "#9fe8f4", 16);
      for (const target of game.enemies) {
        if (!target.dead && target !== enemy && distance(target, enemy) < 105) damageEnemy(target, .75 + game.player.damage * .45, { x: enemy.x, y: enemy.y, statusTick: true, statusType: "shock" });
      }
    }
    if (game.player.burnExplosion && enemy.statuses && enemy.statuses.burn > 0) {
      shockwave(enemy.x, enemy.y, "#f28b49", 18);
      for (const target of game.enemies) {
        if (!target.dead && target !== enemy && distance(target, enemy) < 115) {
          target.statuses.burn = Math.max(target.statuses.burn, 2.2);
          damageEnemy(target, .6 + game.player.damage * .35, { x: enemy.x, y: enemy.y, statusTick: true, statusType: "burn" });
        }
      }
    }
    if (isBoss(enemy)) {
      game.pickups.push({ x: enemy.x - 20, y: enemy.y, type: "crown", phase: 0 });
      if (game.room < game.rooms.length - 1) game.pickups.push({ x: enemy.x + 24, y: enemy.y, type: "item", item: randomChoice(availableItems()), phase: 0, spawnDelay: .35 });
    } else if (!enemy.summonedBy && Math.random() < .38 + game.player.luck + Math.min(.22, game.combo * .012) + (game.rooms[game.room].modifier === "fortune" ? .24 : 0)) {
      game.pickups.push({ x: enemy.x, y: enemy.y, type: Math.random() < .35 ? "heart" : "coin", phase: 0 });
    }
    if (!isBoss(enemy) && !enemy.summonedBy && !game.suppressSpawns && Math.random() < (enemy.elite ? .28 : .075)) {
      metaProgress.seeds += 1;
      game.seedsFound += 1;
      game.texts.push({ text: "获得幽烬种子 +1", x: enemy.x, y: enemy.y - 30, life: 1.25, color: "#b9e77f", size: 13, velocityY: -20 });
      burst(enemy.x, enemy.y, "#9bd66e", 8, 90);
      saveMetaProgress();
    }
    if (enemy.affix === "volatile") {
      game.bombs.push({ x: enemy.x, y: enemy.y, timer: .72, pulse: 0, radius: 12, volatile: true });
      game.texts.push({ text: "爆裂遗骸", x: enemy.x, y: enemy.y - 30, life: .72, color: "#ffb257", size: 13, velocityY: -18 });
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
    player.recoil *= Math.pow(.0008, dt);
    player.squash *= Math.pow(.003, dt);
    player.muzzleFlash = Math.max(0, player.muzzleFlash - dt);
    player.familiarPhase += dt * 2.15;
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
    const moving = Math.min(1, Math.hypot(moveX, moveY));
    const rageMultiplier = player.rage > 0 ? 1.22 : 1;
    const hazardSlow = game.hazards.some(hazard => hazard.kind !== "游荡眼球" && distance(player, hazard) < hazard.radius + player.radius) ? .58 : 1;
    player.slowed = hazardSlow < 1;
    const rolling = player.roll > 0;
    const targetSpeed = player.speed * rageMultiplier * (rolling ? 2.35 : moving * hazardSlow);
    const targetAngle = rolling ? player.rollAngle : Math.atan2(moveY, moveX);
    const desiredX = moving || rolling ? Math.cos(targetAngle) * targetSpeed : 0;
    const desiredY = moving || rolling ? Math.sin(targetAngle) * targetSpeed : 0;
    const responsiveness = 1 - Math.exp(-(rolling ? 30 : moving ? 16 : 22) * dt);
    player.vx += (desiredX - player.vx) * responsiveness;
    player.vy += (desiredY - player.vy) * responsiveness;
    const velocity = Math.hypot(player.vx, player.vy);
    if (velocity > 5) player.moveAngle = turnToward(player.moveAngle, Math.atan2(player.vy, player.vx), dt * (rolling ? 24 : 13));
    player.moveBlend += (clamp(velocity / Math.max(1, player.speed), 0, 1) - player.moveBlend) * Math.min(1, dt * 14);
    player.walk += dt * (4.5 + velocity * .031) * player.moveBlend;
    player.rollSpin += rolling ? dt * TAU / .24 : 0;
    if (rolling) {
      player.trailTimer -= dt;
      if (player.trailTimer <= 0) {
        player.trailTimer = .045;
        game.particles.push({
          x: player.x, y: player.y, vx: -player.vx * .045, vy: -player.vy * .045,
          life: .2, maxLife: .2, color: heroes[player.hero].color, size: 22,
          ghost: true, angle: player.moveAngle + player.rollSpin
        });
      }
    }
    const arenaWall = WALL + game.arenaInset;
    player.x = clamp(player.x + (player.vx + player.knockbackX) * dt, arenaWall + player.radius, ROOM_WIDTH - arenaWall - player.radius);
    player.y = clamp(player.y + (player.vy + player.knockbackY) * dt, arenaWall + player.radius, ROOM_HEIGHT - arenaWall - player.radius);
    resolveObstacleCollision(player);

    let aimX = 0;
    let aimY = 0;
    if (keys.has("ArrowLeft")) aimX -= 1;
    if (keys.has("ArrowRight")) aimX += 1;
    if (keys.has("ArrowUp")) aimY -= 1;
    if (keys.has("ArrowDown")) aimY += 1;
    if (aimX || aimY) {
      player.aimAngle = Math.atan2(aimY, aimX);
      firePlayer(player.aimAngle);
    } else if (pointer.down && pointer.active) {
      player.aimAngle = Math.atan2(pointer.y - player.y, pointer.x - player.x);
      firePlayer(player.aimAngle);
    }
    else if (pointer.down) {
      const target = nearestEnemy();
      if (target) {
        player.aimAngle = Math.atan2(target.y - player.y, target.x - player.x);
      }
      firePlayer(player.aimAngle);
    }

    updateBullets(dt);
    updateSlashes(dt);
    updateEnemies(dt);
    updateBombs(dt);
    updateHazards(dt);
    updateBossWaves(dt);
    updateBossLasers(dt);
    updateParticles(dt);
    updatePickups(dt);
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;

    const currentRoom = game.rooms[game.room];
    const waitingForTreasure = currentRoom.kind === "treasure" && game.pickups.some(pickup => ["chest", "opening", "item"].includes(pickup.type));
    const waitingForRoute = Boolean(game.routeChoice);
    if (!game.enemies.some(enemy => !enemy.dead) && !waitingForTreasure && !waitingForRoute && !game.doorOpen) {
      currentRoom.cleared = true;
      game.doorOpen = true;
      if (!["treasure", "shop", "sanctuary"].includes(currentRoom.kind)) recordDailyProgress("rooms", 1);
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
        game.pickups.push({ x: ROOM_WIDTH / 2, y: ROOM_HEIGHT / 2, type: "item", item: randomChoice(availableItems()), phase: 0 });
        if (currentRoom.riskReward) game.pickups.push({ x: ROOM_WIDTH / 2 + 64, y: ROOM_HEIGHT / 2, type: "item", item: randomChoice(availableItems()), phase: 1 });
      }
      if (currentRoom.riskReward) player.coins += 4;
      if (currentRoom.kind === "boss" && currentRoom.depth === 9 && !currentRoom.routeSelected) openDescentChoice();
      game.texts.push({ text: game.room === game.rooms.length - 1 ? "地牢核心已净化" : game.routeChoice?.kind === "descent" ? "终路分岔 · 选择下坠方向" : "房间已清空 · 出口开启", x: ROOM_WIDTH / 2, y: 94, life: 2 });
    }
    if (game.doorOpen && player.x > ROOM_WIDTH - WALL - player.radius - 3) {
      if (game.room === game.rooms.length - 1) finish(true);
      else enterRoom(game.room + 1);
    }
    game.texts.forEach(text => { text.life -= dt; text.y += (text.velocityY ?? -8) * dt; });
    game.texts = game.texts.filter(text => text.life > 0);
    screenShake = Math.max(0, screenShake - dt * 28);
  }

  function updateBullets(dt) {
    const player = game.player;
    for (const bullet of game.bullets) {
      bullet.previousX = bullet.x;
      bullet.previousY = bullet.y;
      bullet.age = (bullet.age || 0) + dt;
      bullet.trailCooldown = Math.max(0, (bullet.trailCooldown || 0) - dt);
      const bulletSpeed = Math.hypot(bullet.vx, bullet.vy) || player.bulletSpeed;
      if (bullet.homing) {
        let target = game.enemies.find(enemy => !enemy.dead && enemy.id === bullet.targetId && !bullet.hitIds.has(enemy.id));
        if (!target) {
          target = nearestEnemy(bullet, bullet.hitIds);
          bullet.targetId = target?.id || null;
        }
        if (target) {
          const currentAngle = Math.atan2(bullet.vy, bullet.vx);
          const targetAngle = Math.atan2(target.y - bullet.y, target.x - bullet.x);
          const nextAngle = turnToward(currentAngle, targetAngle, bullet.homing * dt);
          bullet.vx = Math.cos(nextAngle) * bulletSpeed;
          bullet.vy = Math.sin(nextAngle) * bulletSpeed;
        }
      }
      if (bullet.boomerang) {
        if (!bullet.returning && (bullet.age > .42 || bullet.life < bullet.maxLife * .58)) {
          bullet.returning = true;
          bullet.hitIds.clear();
          bullet.life = Math.max(bullet.life, .65);
        }
        if (bullet.returning) {
          const currentAngle = Math.atan2(bullet.vy, bullet.vx);
          const returnAngle = Math.atan2(player.y - bullet.y, player.x - bullet.x);
          const nextAngle = turnToward(currentAngle, returnAngle, dt * 10.5);
          bullet.vx = Math.cos(nextAngle) * bulletSpeed * 1.08;
          bullet.vy = Math.sin(nextAngle) * bulletSpeed * 1.08;
          if (distance(bullet, player) < player.radius + 13) {
            bullet.life = 0;
            directionalBurst(player.x, player.y, returnAngle + Math.PI, "#ff7ca7", 5, 80);
          }
        } else {
          const currentAngle = Math.atan2(bullet.vy, bullet.vx) + bullet.curve * dt * 2.1;
          bullet.vx = Math.cos(currentAngle) * bulletSpeed;
          bullet.vy = Math.sin(currentAngle) * bulletSpeed;
        }
      }
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      if (bullet.trailCooldown <= 0) {
        bullet.trailCooldown = bullet.weapon === "prism" ? .026 : ["seeker", "orbit", "wisp"].includes(bullet.weapon) ? .045 : .075;
        const trailColors = { repeater: "#f1c773", scatter: "#f28654", wisp: "#bfa8ff", seeker: "#79f2d0", prism: "#a8e8ff", orbit: "#ff719f" };
        const cosmeticTrail = metaProgress.equippedCosmetics.projectile === "redTrail" ? "#ff594d" : null;
        game.particles.push({
          x: bullet.x, y: bullet.y, vx: -bullet.vx * .025, vy: -bullet.vy * .025,
          life: bullet.weapon === "prism" ? .24 : .16, maxLife: bullet.weapon === "prism" ? .24 : .16,
          color: cosmeticTrail || trailColors[bullet.weapon] || "#f1c773",
          size: bullet.weapon === "prism" ? 4.5 : ["seeker", "orbit", "wisp"].includes(bullet.weapon) ? 3.2 : 2.2,
          star: bullet.weapon === "prism", glow: ["wisp", "seeker", "prism", "orbit"].includes(bullet.weapon)
        });
      }
      for (const enemy of game.enemies) {
        if (enemy.dead || bullet.life <= 0 || bullet.hitIds.has(enemy.id) || distance(bullet, enemy) > bullet.radius + enemy.radius) continue;
        bullet.hitIds.add(enemy.id);
        damageEnemy(enemy, bullet.damage, bullet);
        if (bullet.bounces > 0) {
          const target = nearestEnemy(enemy, bullet.hitIds);
          bullet.bounces -= 1;
          if (target) {
            const bounceAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
            bullet.x = enemy.x + Math.cos(bounceAngle) * (enemy.radius + bullet.radius + 3);
            bullet.y = enemy.y + Math.sin(bounceAngle) * (enemy.radius + bullet.radius + 3);
            bullet.vx = Math.cos(bounceAngle) * bulletSpeed;
            bullet.vy = Math.sin(bounceAngle) * bulletSpeed;
            bullet.life = Math.max(bullet.life, .42);
            bullet.damage *= .82;
            drawLightningBurst(enemy, target, "#9fe8ff");
            shockwave(enemy.x, enemy.y, "#8bdfff", 4);
          } else bullet.life = 0;
        } else if (bullet.pierce > 0) bullet.pierce -= 1;
        else bullet.life = 0;
        impactBurst(bullet.x, bullet.y, Math.atan2(bullet.vy, bullet.vx), bullet.critical, bullet.weapon);
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
      bullet.previousX = bullet.x;
      bullet.previousY = bullet.y;
      bullet.age = (bullet.age || 0) + dt;
      if (bullet.curve) {
        const speed = Math.hypot(bullet.vx, bullet.vy);
        const angle = Math.atan2(bullet.vy, bullet.vx) + bullet.curve * dt;
        bullet.vx = Math.cos(angle) * speed;
        bullet.vy = Math.sin(angle) * speed;
      }
      if (bullet.acceleration) {
        const acceleration = 1 + bullet.acceleration * dt;
        bullet.vx *= acceleration;
        bullet.vy *= acceleration;
      }
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;
      if (bullet.life > 0 && distance(bullet, player) < bullet.radius + player.radius) {
        bullet.life = 0;
        if (player.roll > 0) {
          game.evades += 1;
          recordDailyProgress("evades", 1);
          player.evadeCount += 1;
          directionalBurst(player.x, player.y, Math.atan2(bullet.vy, bullet.vx), "#b9f2ff", 9, 165);
          if (player.evadeCount % 4 === 0) game.texts.push({ text: `连续闪避 ×${player.evadeCount}`, x: player.x, y: player.y - 36, life: .65, color: "#b9f2ff", size: 13, velocityY: -24 });
          else game.texts.push({ text: "完美闪避", x: player.x, y: player.y - 30, life: .42, color: "#d5f8ff", size: 11, velocityY: -28 });
          sound(620, .05, "sine", .009);
        } else damagePlayer(bullet.damage || 1, bullet);
      }
      for (const obstacle of game.obstacles) {
        if (!obstacle.dead && obstacle.type === "rock" && distance(bullet, obstacle) < bullet.radius + obstacle.radius) bullet.life = 0;
      }
    }
    game.bullets = game.bullets.filter(inBounds);
    game.enemyBullets = game.enemyBullets.filter(inBounds);
  }

  function updateSlashes(dt) {
    for (const slash of game.slashes) {
      slash.life -= dt;
      for (const enemy of game.enemies) {
        if (enemy.dead || slash.hitIds.has(enemy.id)) continue;
        const enemyDistance = distance(slash, enemy);
        const targetAngle = Math.atan2(enemy.y - slash.y, enemy.x - slash.x);
        const angleOffset = Math.abs(angleDelta(targetAngle, slash.angle));
        const guarded = enemyDistance <= slash.guardRadius + enemy.radius;
        const mainHit = enemyDistance <= slash.radius + enemy.radius && angleOffset <= slash.arc / 2;
        const waveHit = enemyDistance <= slash.waveRadius + enemy.radius && angleOffset <= slash.waveArc / 2;
        if (!guarded && !mainHit && !waveHit) continue;
        slash.hitIds.add(enemy.id);
        const outerWave = !guarded && !mainHit;
        const source = outerWave ? { ...slash, knockback: 6, wave: true } : { ...slash, knockback: 11 };
        damageEnemy(enemy, slash.damage * (outerWave ? slash.waveDamage : 1), source);
        impactBurst(enemy.x, enemy.y, slash.angle, slash.critical, outerWave ? "prism" : "cleaver");
        if (!outerWave) directionalBurst(enemy.x, enemy.y, slash.angle, "#ead7ac", 7, 145);
      }
      for (const bullet of game.enemyBullets) {
        if (bullet.life <= 0) continue;
        const bulletDistance = distance(slash, bullet);
        const bulletAngle = Math.atan2(bullet.y - slash.y, bullet.x - slash.x);
        const guarded = bulletDistance <= slash.guardRadius + bullet.radius;
        const parried = bulletDistance <= slash.radius + bullet.radius && Math.abs(angleDelta(bulletAngle, slash.angle)) <= slash.arc / 2;
        if (!guarded && !parried) continue;
        bullet.life = 0;
        slash.blocked += 1;
        directionalBurst(bullet.x, bullet.y, Math.atan2(bullet.vy, bullet.vx) + Math.PI, "#c9f7ff", 10, 185);
        shockwave(bullet.x, bullet.y, "#9de8f4", 5);
        screenShake = Math.max(screenShake, 3.5);
        if (slash.blocked === 1) {
          game.texts.push({ text: guarded ? "护刃弹反" : "斩落弹幕", x: bullet.x, y: bullet.y - 15, life: .48, color: "#c9f7ff", size: 12, velocityY: -24 });
          sound(540, .055, "square", .012);
        }
      }
    }
    game.slashes = game.slashes.filter(slash => slash.life > 0);
    game.enemyBullets = game.enemyBullets.filter(inBounds);
  }

  function applyAttackStatuses(enemy, source) {
    if (!source || !source.playerAttack || source.statusTick || enemy.dead) return;
    const player = game.player;
    const statuses = enemy.statuses;
    if (Math.random() < player.burnChance) { statuses.burn = Math.max(statuses.burn, 3.2); enemy.statusTicks.burn = 0; }
    if (Math.random() < player.freezeChance) statuses.freeze = Math.max(statuses.freeze, 2.1);
    if (Math.random() < player.poisonChance) { statuses.poison = Math.max(statuses.poison, 4.2); enemy.statusTicks.poison = 0; }
    if (Math.random() < player.bleedChance) {
      statuses.bleed = Math.max(statuses.bleed, 3.8);
      enemy.bleedStacks = Math.min(5, (enemy.bleedStacks || 0) + 1);
      enemy.statusTicks.bleed = 0;
    }
    if (Math.random() < player.shockChance) {
      statuses.shock = Math.max(statuses.shock, 1.1);
      const target = game.enemies.find(candidate => !candidate.dead && candidate !== enemy && distance(candidate, enemy) < 125);
      if (target) {
        drawLightningBurst(enemy, target);
        damageEnemy(target, .45 + player.damage * .22, { x: enemy.x, y: enemy.y, statusTick: true, statusType: "shock" });
        target.statuses.shock = Math.max(target.statuses.shock, .65);
        if (statuses.burn > 0) target.statuses.burn = Math.max(target.statuses.burn, 1.8);
      }
    }
    if (source.melee && player.bleedHeal && statuses.bleed > 0) {
      player.healCharge += .34;
      if (player.healCharge >= 1) {
        player.healCharge -= 1;
        player.hp = Math.min(player.maxHp, player.hp + 1);
        game.texts.push({ text: "鲜血回响 +½", x: player.x, y: player.y - 35, life: .75, color: "#ef7186", size: 13, velocityY: -20 });
      }
    }
  }

  function updateEnemyStatuses(enemy, dt) {
    const statuses = enemy.statuses;
    for (const key of Object.keys(statuses)) statuses[key] = Math.max(0, statuses[key] - dt);
    if (statuses.burn > 0) {
      enemy.statusTicks.burn -= dt;
      if (enemy.statusTicks.burn <= 0) {
        enemy.statusTicks.burn = .55;
        damageEnemy(enemy, .2 + game.player.damage * .08, { x: enemy.x - 1, y: enemy.y, statusTick: true, statusType: "burn" });
      }
    }
    if (!enemy.dead && statuses.poison > 0) {
      enemy.statusTicks.poison -= dt;
      if (enemy.statusTicks.poison <= 0) {
        enemy.statusTicks.poison = .72;
        damageEnemy(enemy, .16 + game.player.damage * .06, { x: enemy.x - 1, y: enemy.y, statusTick: true, statusType: "poison" });
      }
    }
    if (!enemy.dead && statuses.bleed > 0) {
      enemy.statusTicks.bleed -= dt;
      if (enemy.statusTicks.bleed <= 0) {
        enemy.statusTicks.bleed = .78;
        damageEnemy(enemy, .16 * Math.max(1, enemy.bleedStacks || 1), { x: enemy.x - 1, y: enemy.y, statusTick: true, statusType: "bleed" });
      }
    } else if (statuses.bleed <= 0) enemy.bleedStacks = 0;
  }

  function guardianFor(enemy) {
    return game.enemies.find(candidate => {
      if (candidate.dead || candidate === enemy || isBoss(candidate)) return false;
      const activeGuardian = candidate.type === "splitter" || (candidate.affix === "warded" && candidate.shield > 0);
      return activeGuardian && distance(candidate, enemy) < (candidate.type === "splitter" ? 155 : 125);
    });
  }

  function damageEnemy(enemy, amount, source) {
    if (!enemy || enemy.dead) return;
    const statusTick = Boolean(source && source.statusTick);
    if (enemy.invulnerable && !(source && source.forceDamage)) {
      if ((enemy.guardTextCooldown || 0) <= 0) {
        enemy.guardTextCooldown = .6;
        game.texts.push({ text: enemy.type === "bossBurrow" ? "甲壳无效 · 等待尾部弱点" : "暂时无法伤害", x: enemy.x, y: enemy.y - enemy.radius - 12, life: .65, color: "#9dd7df", size: 12, velocityY: -18 });
      }
      return;
    }
    if (enemy.stageTransition > 0) {
      const deflectAngle = source && Number.isFinite(source.vx) ? Math.atan2(source.vy, source.vx) + Math.PI : 0;
      if (!statusTick) directionalBurst(enemy.x, enemy.y, deflectAngle, "#d9c4a0", 5, 110);
      return;
    }
    const critical = Boolean(source && source.critical);
    const impactAngle = source && Number.isFinite(source.vx) ? Math.atan2(source.vy, source.vx) : source ? Math.atan2(enemy.y - source.y, enemy.x - source.x) : 0;
    if (enemy.shield > 0) {
      const absorbed = Math.min(enemy.shield, amount);
      enemy.shield -= absorbed;
      amount -= absorbed;
      enemy.flash = .1;
      hitStop = Math.max(hitStop, .026);
      directionalBurst(enemy.x, enemy.y, impactAngle + Math.PI, "#80daf1", 9, 175);
      game.texts.push({ text: enemy.shield > 0 ? `护盾 -${absorbed.toFixed(0)}` : "护盾破碎", x: enemy.x, y: enemy.y - enemy.radius - 12, life: .62, color: "#9cecff", size: 13, velocityY: -22 });
      if (enemy.shield <= 0) shockwave(enemy.x, enemy.y, "#72c9df", 10);
      if (amount <= 0) return;
    }
    const guardian = guardianFor(enemy);
    if (guardian) {
      amount *= .45;
      if (enemy.guardTextCooldown <= 0) {
        enemy.guardTextCooldown = .45;
        game.texts.push({ text: "护持减伤", x: enemy.x, y: enemy.y - enemy.radius - 10, life: .5, color: "#9ee6c1", size: 12, velocityY: -18 });
      }
      directionalBurst(enemy.x, enemy.y, Math.atan2(guardian.y - enemy.y, guardian.x - enemy.x), "#75c89c", 4, 80);
    }
    if (isBoss(enemy) && !(source && source.forceDamage)) {
      const hitCap = enemy.maxHp * (statusTick ? .018 : source && source.skill ? .1 : .06);
      amount = Math.min(amount, hitCap);
      const phaseFloor = enemy.bossStage === 1 ? enemy.maxHp * BOSS_STAGE_TWO_RATIO : enemy.bossStage === 2 ? enemy.maxHp * BOSS_STAGE_THREE_RATIO : 0;
      amount = Math.min(amount, Math.max(0, enemy.hp - phaseFloor));
      if (amount <= .001) return;
    }
    const previousHp = enemy.hp;
    enemy.hp -= amount;
    enemy.flash = .12;
    enemy.squash = Math.max(enemy.squash || 0, critical ? .72 : .38);
    if (!statusTick) hitStop = Math.max(hitStop, source && source.skill ? .055 : critical ? .045 : .018);
    screenShake = Math.max(screenShake, statusTick ? 0 : source && source.skill ? 7 : critical ? 5 : 2.5);
    const statusColors = { burn: "#f18a4f", poison: "#8dcb68", bleed: "#df5570", shock: "#c9b6ff" };
    game.texts.push({
      text: `${critical ? "暴击 " : ""}${Math.max(.1, amount).toFixed(amount < 1 ? 1 : 0)}`,
      x: enemy.x + random(-8, 8), y: enemy.y - enemy.radius - 8,
      life: critical ? .72 : .5, color: statusTick ? statusColors[source.statusType] : critical ? "#fff3a5" : "#f2c77f", size: statusTick ? 11 : critical ? 18 : 13,
      velocityY: critical ? -34 : -24
    });
    if (source && !statusTick) {
      const knockback = Number.isFinite(source.knockback) ? source.knockback : source.skill ? 18 : critical ? 8 : 4;
      enemy.x += Math.cos(impactAngle) * knockback;
      enemy.y += Math.sin(impactAngle) * knockback;
    }
    if (critical) sound(410, .07, "square", .012);
    applyAttackStatuses(enemy, source);
    const sourceKey = statusTick ? `status:${source.statusType}` : source?.melee ? "cleaver" : source?.weapon || (source?.skill ? "skill" : "effect");
    const dealt = Math.min(previousHp, amount);
    game.damageDealt += dealt;
    game.damageBySource[sourceKey] = (game.damageBySource[sourceKey] || 0) + dealt;
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
        if (entity === game.player && distance(entity, obstacle) < entity.radius + obstacle.radius * .65) damagePlayer(1, obstacle);
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
      game.hazards.push({ x: bomb.x, y: bomb.y, radius: bomb.volatile ? 54 : 68, life: bomb.volatile ? 2.4 : 4.2, maxLife: bomb.volatile ? 2.4 : 4.2, phase: random(0, TAU), tick: .1, kind: bomb.volatile ? "爆裂遗骸" : "腐蚀地面" });
      screenShake = 11;
    }
    game.bombs = game.bombs.filter(bomb => !bomb.dead);
  }

  function updateHazards(dt) {
    for (const hazard of game.hazards) {
      hazard.life -= dt;
      hazard.phase += dt * 3.2;
      hazard.tick -= dt;
      if (hazard.kind === "游荡眼球") {
        const ownerAlive = game.enemies.some(enemy => !enemy.dead && enemy.id === hazard.ownerId);
        if (!ownerAlive) { hazard.life = 0; continue; }
        hazard.x += hazard.vx * dt;
        hazard.y += hazard.vy * dt;
        const edge = WALL + hazard.radius;
        if (hazard.x <= edge || hazard.x >= ROOM_WIDTH - edge) hazard.vx *= -1;
        if (hazard.y <= edge || hazard.y >= ROOM_HEIGHT - edge) hazard.vy *= -1;
        hazard.x = clamp(hazard.x, edge, ROOM_WIDTH - edge);
        hazard.y = clamp(hazard.y, edge, ROOM_HEIGHT - edge);
      }
      if (hazard.tick <= 0 && distance(hazard, game.player) < hazard.radius + game.player.radius) {
        hazard.tick = hazard.kind === "游荡眼球" ? .9 : .7;
        damagePlayer(hazard.kind === "游荡眼球" ? 1 : .5, hazard);
      }
    }
    game.hazards = game.hazards.filter(hazard => hazard.life > 0);
  }

  function inBounds(bullet) {
    return bullet.life > 0 && bullet.x > WALL && bullet.x < ROOM_WIDTH - WALL && bullet.y > WALL && bullet.y < ROOM_HEIGHT - WALL;
  }

  function updateEnemies(dt) {
    const player = game.player;
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      updateEnemyStatuses(enemy, dt);
      if (enemy.dead) continue;
      if (isBoss(enemy) && updateBossStage(enemy, dt)) continue;
      const startX = enemy.x;
      const startY = enemy.y;
      enemy.cooldown -= dt * (enemy.affix === "frenzied" ? 1.35 : 1) * (isBoss(enemy) ? bossStats(enemy).cadence : 1);
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.recoil *= Math.pow(.001, dt);
      enemy.attackFlash = Math.max(0, enemy.attackFlash - dt);
      enemy.squash *= Math.pow(.004, dt);
      enemy.guardTextCooldown = Math.max(0, enemy.guardTextCooldown - dt);
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
          const activeSummons = game.enemies.filter(candidate => !candidate.dead && candidate.summonedBy === enemy.id).length;
          if (enemy.summons < 2 && activeSummons < 2 && game.enemies.filter(candidate => !candidate.dead).length < 10) {
            spawnEnemy("leech");
            const summon = game.enemies.at(-1);
            const summonAngle = enemy.phase + enemy.summons * Math.PI;
            summon.x = clamp(enemy.x + Math.cos(summonAngle) * 46, WALL + summon.radius, ROOM_WIDTH - WALL - summon.radius);
            summon.y = clamp(enemy.y + Math.sin(summonAngle) * 46, WALL + summon.radius, ROOM_HEIGHT - WALL - summon.radius);
            summon.hp = Math.max(1, Math.ceil(summon.hp * .65));
            summon.maxHp = summon.hp;
            summon.summonedBy = enemy.id;
            enemy.summons += 1;
            shockwave(summon.x, summon.y, "#9d72c2", 8);
            game.texts.push({ text: "召唤血蛭", x: enemy.x, y: enemy.y - 34, life: .72, color: "#c9a4ef", size: 13, velocityY: -18 });
            enemy.cooldown = enemy.elite ? 2.2 : 2.8;
          } else {
            radialFire(enemy, enemy.elite ? 8 : 6);
            enemy.cooldown = enemy.elite ? 1.45 : 2.1;
          }
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
      } else if (isBoss(enemy)) {
        updateBossBehavior(enemy, angle, playerDistance, dt * bossStats(enemy).move);
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
      if (enemy.statuses.freeze > 0) {
        enemy.x = startX + (enemy.x - startX) * .45;
        enemy.y = startY + (enemy.y - startY) * .45;
      }
      enemy.x = clamp(enemy.x, WALL + enemy.radius, ROOM_WIDTH - WALL - enemy.radius);
      enemy.y = clamp(enemy.y, WALL + enemy.radius, ROOM_HEIGHT - WALL - enemy.radius);
      resolveObstacleCollision(enemy);
      if (!enemy.intangible && distance(enemy, player) < player.radius + enemy.radius) damagePlayer(isBoss(enemy) ? bossStats(enemy).contact : 1, enemy);
    }
    separateEnemies();
    game.enemies = game.enemies.filter(enemy => !enemy.dead);
  }

  function updateBossStage(enemy, dt) {
    const healthRatio = enemy.hp / enemy.maxHp;
    const nextStage = healthRatio <= BOSS_STAGE_THREE_RATIO + .0001 ? 3 : healthRatio <= BOSS_STAGE_TWO_RATIO + .0001 ? 2 : 1;
    if (nextStage > enemy.bossStage) {
      enemy.bossStage = nextStage;
      enemy.radius = enemy.baseRadius * (nextStage === 3 ? 1.22 : 1.1);
      enemy.stageTransition = nextStage === 3 ? 1.9 : 1.55;
      enemy.cooldown = .8;
      enemy.signatureCooldown = .75;
      enemy.spawnCooldown = Math.min(enemy.spawnCooldown, 1.2);
      enemy.squash = 1;
      game.enemyBullets.length = 0;
      game.bossLasers.length = 0;
      game.bossWaves.length = 0;
      game.arenaInset = nextStage === 3 ? 18 : 8;
      enemy.invulnerable = false;
      enemy.submerged = false;
      enemy.intangible = false;
      enemy.telegraph = 0;
      enemy.attackMode = null;
      shockwave(enemy.x, enemy.y, nextStage === 3 ? "#ff4f75" : "#74d9d0", nextStage === 3 ? 46 : 34);
      for (let index = 0; index < 18 + nextStage * 6; index += 1) {
        const angle = index / (18 + nextStage * 6) * TAU;
        game.particles.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * (90 + nextStage * 45), vy: Math.sin(angle) * (90 + nextStage * 45), life: .55, maxLife: .55, color: nextStage === 3 ? "#ff7699" : "#8ff4de", size: 5, star: true, glow: true });
      }
      screenShake = nextStage === 3 ? 18 : 14;
      const label = bossStageNames[enemy.type]?.[nextStage - 1] || "狂怒";
      const escalation = nextStage === 3 ? "最终狂怒 · 双重攻击解禁" : "躯体异变 · 新攻击解禁";
      game.texts.push({ text: `阶段 ${nextStage} · ${label}`, x: ROOM_WIDTH / 2, y: 136, life: 2.4, color: nextStage === 3 ? "#ff7898" : "#82ead8", size: 24 });
      game.texts.push({ text: escalation, x: ROOM_WIDTH / 2, y: 168, life: 2.2, color: nextStage === 3 ? "#ffc0c9" : "#c3fff2", size: 14 });
      sound(nextStage === 3 ? 66 : 92, .48, "sawtooth", .04);
    }
    if (enemy.stageTransition > 0) {
      enemy.stageTransition -= dt;
      enemy.phase += dt * 4;
      return true;
    }
    return false;
  }

  function spawnOwnedEnemy(type, owner, offsetX = 0, offsetY = 0) {
    if (game.enemies.filter(enemy => !enemy.dead).length >= 11) return null;
    spawnEnemy(type);
    const summon = game.enemies.at(-1);
    summon.x = clamp(owner.x + offsetX, WALL + summon.radius, ROOM_WIDTH - WALL - summon.radius);
    summon.y = clamp(owner.y + offsetY, WALL + summon.radius, ROOM_HEIGHT - WALL - summon.radius);
    summon.hp = Math.max(1, Math.ceil(summon.hp * .62));
    summon.maxHp = summon.hp;
    summon.summonedBy = owner.id;
    return summon;
  }

  function addBossHazard(x, y, radius = 50, life = 4.2, kind = "腐蚀地面") {
    game.hazards.push({ x, y, radius, life, maxLife: life, phase: random(0, TAU), tick: .1, kind });
  }

  function addWatchingEye(owner, angle) {
    game.hazards.push({
      x: owner.x + Math.cos(angle) * 60, y: owner.y + Math.sin(angle) * 60,
      vx: Math.cos(angle + .65) * 125, vy: Math.sin(angle + .65) * 125,
      radius: 13, life: 999, maxLife: 999, phase: angle, tick: .1, kind: "游荡眼球", ownerId: owner.id
    });
    owner.orbsSpawned += 1;
  }

  function startBossTelegraph(enemy, mode, duration, options = {}) {
    enemy.attackMode = mode;
    enemy.telegraph = duration;
    enemy.targetX = options.targetX ?? game.player.x;
    enemy.targetY = options.targetY ?? game.player.y;
    enemy.telegraphRadius = options.radius ?? 62;
    enemy.laserDirections = options.directions || [];
    enemy.laserOriginX = options.originX ?? enemy.x;
    enemy.laserOriginY = options.originY ?? enemy.y;
    enemy.laserLength = options.length ?? ARENA_DIAGONAL;
    enemy.laserWidth = options.width ?? 24;
    enemy.telegraphTargets = options.targets || [];
    enemy.wallGapY = options.gapY ?? game.player.y;
    enemy.intangible = mode === "jump" || mode.startsWith("burrow");
    if (options.invulnerable !== undefined) enemy.invulnerable = options.invulnerable;
  }

  function fireBossLaser(enemy, angle, originX = enemy.x, originY = enemy.y, length = ARENA_DIAGONAL, widthValue = 24) {
    const theme = bossAttackThemes[enemy.type];
    game.bossLasers.push({ x: originX, y: originY, angle, length, width: widthValue, life: .24, maxLife: .24, stage: enemy.bossStage, kind: `${theme.name}光束`, bossType: enemy.type, color: theme.color, coreColor: theme.core });
    const dx = game.player.x - originX;
    const dy = game.player.y - originY;
    const along = dx * Math.cos(angle) + dy * Math.sin(angle);
    const across = Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle));
    if (along > 0 && along < length && across < widthValue / 2 + game.player.radius) damagePlayer(bossDamage(enemy), { x: originX, y: originY, kind: `${theme.name} · ${enemy.bossStage} 阶光束` });
  }

  function resolveTargetedImpacts(enemy, targets, damageScale = 1.25, color = bossAttackThemes[enemy.type].color) {
    for (const target of targets) {
      const radius = target.radius || enemy.telegraphRadius;
      if (Math.hypot(game.player.x - target.x, game.player.y - target.y) < radius + game.player.radius) damagePlayer(bossDamage(enemy, damageScale), { x: target.x, y: target.y, kind: `${enemy.signatureName || "重击"} · 落点` });
      shockwave(target.x, target.y, color, 18);
      for (let index = 0; index < 6; index += 1) createBossBullet(enemy, index / 6 * TAU, 135, { x: target.x, y: target.y, radius: 4.5, damageScale: .72, life: 3.2 });
    }
    screenShake = Math.max(screenShake, 15);
  }

  function resolveBossTelegraph(enemy, dt) {
    if (enemy.telegraph <= 0) return false;
    if (enemy.attackMode === "suction") {
      const deltaX = enemy.x - game.player.x;
      const deltaY = enemy.y - game.player.y;
      const pullDistance = Math.hypot(deltaX, deltaY) || 1;
      const pull = Math.max(0, 1 - pullDistance / 320) * (enemy.bossStage === 3 ? 145 : 105) * dt;
      game.player.x += deltaX / pullDistance * pull;
      game.player.y += deltaY / pullDistance * pull;
    }
    enemy.telegraph -= dt;
    if (enemy.telegraph > 0) return true;
    const mode = enemy.attackMode;
    if (mode === "jump") {
      enemy.x = clamp(enemy.targetX, WALL + enemy.radius, ROOM_WIDTH - WALL - enemy.radius);
      enemy.y = clamp(enemy.targetY, WALL + enemy.radius, ROOM_HEIGHT - WALL - enemy.radius);
      radialFireAtSpeed(enemy, enemy.bossStage === 3 ? 12 : 8, 170 + enemy.bossStage * 15);
      if (["bossPeep", "bossBloat"].includes(enemy.type)) addBossHazard(enemy.x, enemy.y, enemy.type === "bossBloat" ? 62 : 48, 5.4, enemy.type === "bossBloat" ? "血池" : "泪池");
      shockwave(enemy.x, enemy.y, "#e16e58", 18);
    } else if (mode === "stomp") {
      if (Math.hypot(game.player.x - enemy.targetX, game.player.y - enemy.targetY) < enemy.telegraphRadius + game.player.radius) damagePlayer(bossDamage(enemy, 1.5), { x: enemy.targetX, y: enemy.targetY, kind: `Boss ${enemy.bossStage} 阶践踏` });
      for (const obstacle of game.obstacles) if (Math.hypot(obstacle.x - enemy.targetX, obstacle.y - enemy.targetY) < enemy.telegraphRadius) damageObstacle(obstacle, 99);
      shockwave(enemy.targetX, enemy.targetY, "#e96c4f", 26);
      screenShake = 15;
    } else if (mode === "laser" || mode === "hand") {
      for (const direction of enemy.laserDirections) fireBossLaser(enemy, direction, enemy.laserOriginX, enemy.laserOriginY, enemy.laserLength, enemy.laserWidth);
      directionalBurst(enemy.laserOriginX, enemy.laserOriginY, enemy.laserDirections[0] || 0, "#ff735b", 18, 180);
      screenShake = 9;
    } else if (mode === "coilCross") {
      for (let index = 0; index < 16; index += 1) createBossBullet(enemy, index / 16 * TAU, index % 2 ? 180 : 125, { curve: index % 2 ? .48 : -.48, radius: 5 });
      for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) addBossHazard(enemy.x + Math.cos(angle) * 82, enemy.y + Math.sin(angle) * 82, 27, 4.5, "蜕皮毒囊");
      shockwave(enemy.x, enemy.y, bossAttackThemes[enemy.type].color, 24);
    } else if (mode === "skyfall") {
      resolveTargetedImpacts(enemy, enemy.telegraphTargets, 1.18);
      const landing = enemy.telegraphTargets.at(-1);
      if (landing) { enemy.x = landing.x; enemy.y = landing.y; }
    } else if (mode === "suction") {
      for (let index = 0; index < 18; index += 1) createBossBullet(enemy, index / 18 * TAU, 115 + index % 3 * 34, { curve: index % 2 ? .34 : -.34, acceleration: .14, radius: 5 });
      shockwave(enemy.x, enemy.y, bossAttackThemes[enemy.type].color, 30);
    } else if (mode === "idolSpiral") {
      for (let index = 0; index < 20; index += 1) createBossBullet(enemy, index / 20 * TAU, 145 + index % 2 * 42, { curve: index % 2 ? .62 : -.62, life: 5.8 });
      if (game.enemies.filter(candidate => candidate.summonedBy === enemy.id && !candidate.dead).length < 3) spawnOwnedEnemy(enemy.bossStage === 3 ? "cultist" : "bat", enemy, 0, 58);
    } else if (mode === "eyeCross") {
      const eyes = game.hazards.filter(hazard => hazard.ownerId === enemy.id && hazard.kind === "游荡眼球");
      const origins = eyes.length ? eyes : [{ x: enemy.x, y: enemy.y }];
      for (const origin of origins) for (let index = 0; index < 4; index += 1) createBossBullet(enemy, index * Math.PI / 2 + enemy.phase, 230, { x: origin.x, y: origin.y, acceleration: .08 });
      radialFireAtSpeed(enemy, enemy.bossStage === 3 ? 12 : 8, 150, enemy.phase + Math.PI / 8);
    } else if (mode === "handClamp") {
      fireBossLaser(enemy, 0, WALL, enemy.targetY, ROOM_WIDTH - WALL * 2, enemy.laserWidth);
      fireBossLaser(enemy, Math.PI, ROOM_WIDTH - WALL, enemy.targetY, ROOM_WIDTH - WALL * 2, enemy.laserWidth);
      resolveTargetedImpacts(enemy, [{ x: game.player.x, y: enemy.targetY, radius: 44 }], 1.1);
    } else if (mode === "echoLanes") {
      for (const direction of [Math.PI / 4, Math.PI * .75, Math.PI * 1.25, Math.PI * 1.75]) fireBossLaser(enemy, direction, enemy.x, enemy.y, ARENA_DIAGONAL, enemy.laserWidth);
      radialFireAtSpeed(enemy, 12, 175, enemy.phase);
    } else if (mode === "heartWall") {
      const lanes = 9;
      for (let lane = 0; lane < lanes; lane += 1) {
        const y = WALL + 48 + lane / (lanes - 1) * (ROOM_HEIGHT - WALL * 2 - 96);
        if (Math.abs(y - enemy.wallGapY) < 78) continue;
        const fromLeft = lane % 2 === 0;
        createBossBullet(enemy, fromLeft ? 0 : Math.PI, 190, { x: fromLeft ? WALL + 8 : ROOM_WIDTH - WALL - 8, y, radius: 7, life: 6, acceleration: .08 });
      }
    } else if (mode === "burrowChain") {
      resolveTargetedImpacts(enemy, enemy.telegraphTargets, 1.12, bossAttackThemes[enemy.type].color);
      const weakPoint = enemy.telegraphTargets.at(-1);
      if (weakPoint) { enemy.x = weakPoint.x; enemy.y = weakPoint.y; enemy.submerged = false; enemy.invulnerable = false; enemy.actionTimer = 1.6; }
    } else if (mode === "hoofStorm") {
      resolveTargetedImpacts(enemy, enemy.telegraphTargets, 1.22, bossAttackThemes[enemy.type].color);
      radialFireAtSpeed(enemy, 16, 145, enemy.phase);
    } else if (mode === "burrowHead") {
      enemy.x = clamp(enemy.targetX, WALL + enemy.radius, ROOM_WIDTH - WALL - enemy.radius);
      enemy.y = clamp(enemy.targetY, WALL + enemy.radius, ROOM_HEIGHT - WALL - enemy.radius);
      enemy.submerged = false;
      enemy.intangible = false;
      enemy.invulnerable = true;
      enemyFire(enemy, 7, .18);
      enemy.actionTimer = .75;
    } else if (mode === "burrowTail") {
      enemy.x = clamp(enemy.targetX, WALL + enemy.radius, ROOM_WIDTH - WALL - enemy.radius);
      enemy.y = clamp(enemy.targetY, WALL + enemy.radius, ROOM_HEIGHT - WALL - enemy.radius);
      enemy.submerged = false;
      enemy.intangible = false;
      enemy.invulnerable = false;
      enemy.actionTimer = 1.35;
      enemyFire(enemy, 3, .28);
      game.texts.push({ text: "尾部弱点暴露！", x: enemy.x, y: enemy.y - 58, life: 1.1, color: "#9ee7c1", size: 15 });
    }
    if (enemy.signatureName) {
      game.bossSignatureResolutions[enemy.type] = (game.bossSignatureResolutions[enemy.type] || 0) + 1;
      enemy.signatureName = "";
    }
    enemy.telegraphTargets = [];
    enemy.attackMode = null;
    enemy.intangible = false;
    return true;
  }

  function updateBossBehavior(enemy, angle, playerDistance, dt) {
    game.bossMechanics[enemy.type] = (game.bossMechanics[enemy.type] || 0) + 1;
    if (resolveBossTelegraph(enemy, dt)) return;
    const handlers = {
      bossCoil: updateCoilBoss,
      bossHopper: updateHopperBoss,
      bossDevourer: updateDevourerBoss,
      bossIdol: updateIdolBoss,
      bossPeep: updatePeepBoss,
      bossMatron: updateMatronBoss,
      bossHollow: updateHollowBoss,
      bossHeart: updateHeartBoss,
      bossBloat: updateBloatBoss,
      bossBurrow: updateBurrowBoss,
      bossInfernal: updateInfernalBoss
    };
    handlers[enemy.type](enemy, angle, playerDistance, dt);
    updateBossSignature(enemy, dt);
  }

  function updateBossSignature(enemy, dt) {
    if (enemy.bossStage < 2 || enemy.telegraph > 0 || enemy.attackMode) return;
    enemy.signatureCooldown -= dt;
    if (enemy.signatureCooldown > 0) return;
    const stageThree = enemy.bossStage === 3;
    const player = game.player;
    const targetsAroundPlayer = offsets => offsets.map(([x, y, radius]) => ({ x: clamp(player.x + x, WALL + 54, ROOM_WIDTH - WALL - 54), y: clamp(player.y + y, WALL + 54, ROOM_HEIGHT - WALL - 54), radius }));
    const signatures = {
      bossCoil: () => startBossTelegraph(enemy, "coilCross", stageThree ? .5 : .72, { radius: 105 }),
      bossHopper: () => startBossTelegraph(enemy, "skyfall", stageThree ? .58 : .78, { targets: targetsAroundPlayer(stageThree ? [[-86, -45, 54], [76, -18, 58], [-34, 72, 62], [35, 12, 66]] : [[-64, -28, 52], [60, 20, 56], [0, 64, 60]]) }),
      bossDevourer: () => startBossTelegraph(enemy, "suction", stageThree ? .72 : .92, { radius: stageThree ? 225 : 190 }),
      bossIdol: () => startBossTelegraph(enemy, "idolSpiral", stageThree ? .48 : .7, { radius: 130 }),
      bossPeep: () => startBossTelegraph(enemy, "eyeCross", stageThree ? .5 : .68, { radius: 118 }),
      bossMatron: () => startBossTelegraph(enemy, "handClamp", stageThree ? .6 : .82, { targetY: player.y, width: stageThree ? 64 : 50 }),
      bossHollow: () => startBossTelegraph(enemy, "echoLanes", stageThree ? .48 : .7, { width: stageThree ? 27 : 20 }),
      bossHeart: () => startBossTelegraph(enemy, "heartWall", stageThree ? .62 : .84, { gapY: player.y }),
      bossBloat: () => {
        const aim = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        startBossTelegraph(enemy, "laser", stageThree ? .58 : .78, { directions: [aim - .56, aim, aim + .56], width: stageThree ? 31 : 24 });
      },
      bossBurrow: () => startBossTelegraph(enemy, "burrowChain", stageThree ? .58 : .8, { targets: targetsAroundPlayer(stageThree ? [[-92, 0, 52], [-32, -54, 54], [38, 26, 58], [88, -12, 60]] : [[-62, -18, 50], [5, 38, 54], [65, -10, 56]]), invulnerable: true }),
      bossInfernal: () => startBossTelegraph(enemy, "hoofStorm", stageThree ? .58 : .82, { targets: targetsAroundPlayer(stageThree ? [[-92, -58, 56], [88, -52, 56], [-76, 58, 60], [78, 62, 60], [0, 0, 66]] : [[-72, -46, 54], [68, -38, 54], [0, 58, 60]]) })
    };
    const signatureNames = {
      bossCoil: "断节毒轮", bossHopper: "多重天坠", bossDevourer: "暴食吸积", bossIdol: "育巢螺旋", bossPeep: "双瞳十字",
      bossMatron: "母影夹击", bossHollow: "空骨回返", bossHeart: "狂搏血墙", bossBloat: "裂眼三光", bossBurrow: "连环掘袭", bossInfernal: "双蹄审判"
    };
    enemy.signatureName = signatureNames[enemy.type];
    game.bossSignatures[enemy.type] = (game.bossSignatures[enemy.type] || 0) + 1;
    signatures[enemy.type]();
    enemy.signatureCooldown = stageThree ? 3.15 : 4.45;
    const theme = bossAttackThemes[enemy.type];
    game.texts.push({ text: `${enemy.signatureName} · 注意预警`, x: ROOM_WIDTH / 2, y: 124, life: 1.15, color: theme.core, size: stageThree ? 18 : 16 });
    sound(stageThree ? 74 : 106, .24, "sawtooth", .024);
  }

  function turnCardinal(enemy) {
    if (enemy.moveX) { enemy.moveY = Math.random() < .5 ? -1 : 1; enemy.moveX = 0; }
    else { enemy.moveX = Math.random() < .5 ? -1 : 1; enemy.moveY = 0; }
  }

  function moveCardinal(enemy, dt, speedScale = 1) {
    const edge = WALL + enemy.radius + 8;
    if ((enemy.moveX < 0 && enemy.x <= edge) || (enemy.moveX > 0 && enemy.x >= ROOM_WIDTH - edge) || (enemy.moveY < 0 && enemy.y <= edge) || (enemy.moveY > 0 && enemy.y >= ROOM_HEIGHT - edge)) turnCardinal(enemy);
    enemy.x += enemy.moveX * enemy.speed * speedScale * dt;
    enemy.y += enemy.moveY * enemy.speed * speedScale * dt;
    enemy.angle = Math.atan2(enemy.moveY, enemy.moveX);
  }

  function updateCoilBoss(enemy, angle, playerDistance, dt) {
    moveCardinal(enemy, dt, 1 + enemy.bossStage * .08);
    enemy.hazardCooldown -= dt;
    if (enemy.hazardCooldown <= 0 && enemy.bossStage >= 2) {
      addBossHazard(enemy.x - enemy.moveX * 34, enemy.y - enemy.moveY * 34, 24, 5.5, "腐囊");
      enemy.hazardCooldown = enemy.bossStage === 3 ? .75 : 1.15;
    }
    if (enemy.cooldown <= 0) {
      if (enemy.bossStage === 3) radialFireAtSpeed(enemy, 8, 155, enemy.angle);
      else enemyFire(enemy, enemy.bossStage + 1, .14);
      if (Math.random() < .65) turnCardinal(enemy);
      enemy.cooldown = enemy.bossStage === 3 ? 1.15 : 1.7;
    }
  }

  function updateHopperBoss(enemy, angle, playerDistance, dt) {
    if (enemy.cooldown <= 0) {
      if (Math.random() < .68 || enemy.bossStage >= 2) startBossTelegraph(enemy, "jump", enemy.bossStage === 3 ? .42 : .65, { targetX: game.player.x, targetY: game.player.y, radius: 64 });
      else enemyFire(enemy, 7, .16);
      enemy.cooldown = enemy.bossStage === 3 ? 1.05 : 1.55;
    } else if (playerDistance > 210) {
      enemy.x += Math.cos(angle) * enemy.speed * .35 * dt;
      enemy.y += Math.sin(angle) * enemy.speed * .35 * dt;
    }
  }

  function updateDevourerBoss(enemy, angle, playerDistance, dt) {
    enemy.spawnCooldown -= dt;
    if (enemy.charge > 0) {
      enemy.x += Math.cos(enemy.chargeAngle) * enemy.speed * 5 * dt;
      enemy.y += Math.sin(enemy.chargeAngle) * enemy.speed * 5 * dt;
      enemy.charge -= dt;
    } else if (enemy.windup > 0) {
      enemy.windup -= dt;
      if (enemy.windup <= 0) enemy.charge = .72;
    } else {
      const alignedX = Math.abs(game.player.x - enemy.x) < 42;
      const alignedY = Math.abs(game.player.y - enemy.y) < 42;
      if (enemy.cooldown <= 0 && (alignedX || alignedY)) {
        enemy.chargeAngle = alignedX ? (game.player.y > enemy.y ? Math.PI / 2 : -Math.PI / 2) : (game.player.x > enemy.x ? 0 : Math.PI);
        enemy.windup = .58;
        enemy.cooldown = enemy.bossStage === 3 ? 1.2 : 1.8;
      } else moveCardinal(enemy, dt, .72);
    }
    if (enemy.bossStage >= 2 && enemy.spawnCooldown <= 0) {
      spawnOwnedEnemy("charger", enemy, -enemy.moveX * 52, -enemy.moveY * 52);
      enemy.spawnCooldown = enemy.bossStage === 3 ? 2.7 : 4;
    }
  }

  function updateIdolBoss(enemy, angle, playerDistance, dt) {
    enemy.x += (ROOM_WIDTH / 2 + 80 - enemy.x) * .18;
    enemy.y += (ROOM_HEIGHT * .23 - enemy.y) * .18;
    enemy.spawnCooldown -= dt;
    if (enemy.cooldown <= 0) {
      if (enemy.bossStage >= 2 && Math.random() < .42) {
        spawnOwnedEnemy(enemy.bossStage === 3 ? "cultist" : "bat", enemy, random(-55, 55), 52);
        if (enemy.bossStage === 3) spawnOwnedEnemy("leech", enemy, random(-70, 70), 64);
      } else enemyFire(enemy, enemy.bossStage === 3 ? 9 : 5, .14);
      enemy.cooldown = enemy.bossStage === 3 ? .75 : 1.2;
    }
  }

  function updatePeepBoss(enemy, angle, playerDistance, dt) {
    while (enemy.orbsSpawned < enemy.bossStage - 1) addWatchingEye(enemy, enemy.orbsSpawned ? Math.PI : 0);
    enemy.hazardCooldown -= dt;
    if (enemy.hazardCooldown <= 0) {
      addBossHazard(enemy.x, enemy.y, 38, 4.2, "泪池");
      enemy.hazardCooldown = 2.4;
    }
    if (enemy.cooldown <= 0) {
      if (Math.random() < .58) startBossTelegraph(enemy, "jump", .58, { targetX: game.player.x, targetY: game.player.y, radius: 58 });
      else radialFireAtSpeed(enemy, 8, 165, enemy.phase);
      enemy.cooldown = enemy.bossStage === 3 ? .95 : 1.45;
    }
  }

  function updateHollowBoss(enemy, angle, playerDistance, dt) {
    if (!enemy.moveY) enemy.moveY = Math.random() < .5 ? -1 : 1;
    const edge = WALL + enemy.radius;
    if (enemy.x <= edge || enemy.x >= ROOM_WIDTH - edge) enemy.moveX *= -1;
    if (enemy.y <= edge || enemy.y >= ROOM_HEIGHT - edge) enemy.moveY *= -1;
    enemy.x += enemy.moveX * enemy.speed * (1 + enemy.bossStage * .15) * dt;
    enemy.y += enemy.moveY * enemy.speed * (1 + enemy.bossStage * .15) * dt;
    enemy.angle = Math.atan2(enemy.moveY, enemy.moveX);
    if (enemy.cooldown <= 0) {
      radialFireAtSpeed(enemy, 4 + enemy.bossStage * 2, 145 + enemy.bossStage * 18, enemy.angle);
      enemy.cooldown = enemy.bossStage === 3 ? .9 : 1.45;
    }
  }

  function updateMatronBoss(enemy, angle, playerDistance, dt) {
    enemy.x += (ROOM_WIDTH / 2 - enemy.x) * dt * 2;
    enemy.y += (ROOM_HEIGHT / 2 - enemy.y) * dt * 2;
    enemy.spawnCooldown -= dt;
    if (enemy.spawnCooldown <= 0 && enemy.bossStage >= 2) {
      spawnOwnedEnemy(enemy.bossStage === 3 ? "charger" : "grunt", enemy, random(-90, 90), random(-65, 65));
      enemy.spawnCooldown = enemy.bossStage === 3 ? 2.2 : 3.4;
    }
    if (enemy.cooldown > 0) return;
    if (Math.random() < .65 || enemy.bossStage === 3) {
      startBossTelegraph(enemy, "stomp", enemy.bossStage === 3 ? .48 : .78, { targetX: game.player.x, targetY: game.player.y, radius: enemy.bossStage === 3 ? 74 : 62 });
    } else {
      const left = game.player.x < ROOM_WIDTH / 2;
      startBossTelegraph(enemy, "hand", .6, { originX: left ? WALL : ROOM_WIDTH - WALL, originY: game.player.y, directions: [left ? 0 : Math.PI], length: 230, width: 54 });
    }
    enemy.cooldown = enemy.bossStage === 3 ? .8 : 1.35;
  }

  function updateHeartBoss(enemy, angle, playerDistance, dt) {
    updateHeart(enemy, angle, dt);
    if (enemy.bossStage >= 2 && enemy.spawnCooldown < .25 && game.enemies.filter(candidate => candidate.summonedBy === enemy.id && !candidate.dead).length < 2) {
      spawnOwnedEnemy(enemy.bossStage === 3 ? "splitter" : "cultist", enemy, random(-70, 70), random(-50, 50));
    }
  }

  function updateBloatBoss(enemy, angle, playerDistance, dt) {
    while (enemy.orbsSpawned < 2) addWatchingEye(enemy, enemy.orbsSpawned * Math.PI);
    if (enemy.cooldown > 0) return;
    if (enemy.bossStage >= 2 && Math.random() < .58) {
      const directions = game.player.y > enemy.y ? [Math.PI / 2] : [0, Math.PI];
      startBossTelegraph(enemy, "laser", .62, { directions, width: enemy.bossStage === 3 ? 30 : 23 });
    } else {
      startBossTelegraph(enemy, "jump", .54, { targetX: game.player.x, targetY: game.player.y, radius: 62 });
    }
    enemy.cooldown = enemy.bossStage === 3 ? .82 : 1.25;
  }

  function updateBurrowBoss(enemy, angle, playerDistance, dt) {
    if (enemy.actionTimer > 0) {
      enemy.actionTimer -= dt;
      if (enemy.actionTimer <= 0) {
        enemy.submerged = true;
        enemy.invulnerable = true;
        enemy.intangible = true;
        enemy.cooldown = enemy.bossStage === 3 ? .45 : .8;
      }
      return;
    }
    if (enemy.cooldown > 0) return;
    enemy.submerged = true;
    enemy.invulnerable = true;
    const tail = Math.random() < (enemy.bossStage === 3 ? .64 : .5);
    startBossTelegraph(enemy, tail ? "burrowTail" : "burrowHead", tail ? .72 : .58, { targetX: game.player.x + random(-70, 70), targetY: game.player.y + random(-55, 55), radius: 56, invulnerable: true });
  }

  function updateInfernalBoss(enemy, angle, playerDistance, dt) {
    enemy.spawnCooldown -= dt;
    if (enemy.bossStage === 1) {
      if (enemy.spawnCooldown <= 0) {
        spawnOwnedEnemy("leech", enemy, -65, 35);
        spawnOwnedEnemy("leech", enemy, 65, 35);
        enemy.spawnCooldown = 3.2;
      }
      if (enemy.cooldown <= 0) { radialFireAtSpeed(enemy, 8, 165); enemy.cooldown = 1.15; }
      return;
    }
    if (enemy.bossStage === 2) {
      enemy.x += Math.sin(enemy.phase * .8) * enemy.speed * dt;
      enemy.y += (ROOM_HEIGHT * .23 - enemy.y) * dt * 2.5;
      if (enemy.cooldown <= 0) {
        if (Math.random() < .45) startBossTelegraph(enemy, "laser", .72, { directions: [Math.PI / 2 - .2, Math.PI / 2 + .2], width: 22 });
        else enemyFire(enemy, 9, .13);
        enemy.cooldown = .92;
      }
      return;
    }
    enemy.intangible = true;
    if (enemy.cooldown <= 0) {
      startBossTelegraph(enemy, "stomp", .46, { targetX: game.player.x, targetY: game.player.y, radius: 68 });
      enemy.cooldown = .7;
      if (enemy.spawnCooldown <= 0) {
        spawnOwnedEnemy("leech", enemy, random(-80, 80), 80);
        enemy.spawnCooldown = 2.8;
      }
    }
  }

  function updateHeart(enemy, angle, dt) {
    const stage = enemy.bossStage;
    enemy.spawnCooldown -= dt;
    enemy.waveCooldown -= dt;
    const targetX = ROOM_WIDTH / 2 + Math.cos(enemy.phase * .55) * 155;
    const targetY = ROOM_HEIGHT / 2 + Math.sin(enemy.phase * .8) * 105;
    enemy.x += (targetX - enemy.x) * dt * (stage === 3 ? 2.8 : 1.8);
    enemy.y += (targetY - enemy.y) * dt * (stage === 3 ? 2.8 : 1.8);
    if (enemy.cooldown <= 0) {
      if (stage >= 2) {
        radialFireAtSpeed(enemy, stage === 3 ? 20 : 16, stage === 3 ? 215 : 170);
        enemy.phase += .28;
      } else {
        enemyFire(enemy, 9, .13);
      }
      enemy.cooldown = stage === 3 ? .54 : stage === 2 ? .78 : 1.05;
    }
    if (stage >= 2 && enemy.waveCooldown <= 0) {
      spawnBossWave(enemy.x, enemy.y, stage === 3 ? 250 : 205, bossDamage(enemy));
      enemy.waveCooldown = stage === 3 ? 1.7 : 2.5;
      game.texts.push({ text: "心跳冲击 · 翻滚穿越", x: ROOM_WIDTH / 2, y: 126, life: 1.25, color: "#ef7897", size: 16 });
    }
    if (enemy.spawnCooldown <= 0) {
      const oldX = enemy.x;
      const oldY = enemy.y;
      enemy.x = random(WALL + 230, ROOM_WIDTH - WALL - 62);
      enemy.y = random(110, ROOM_HEIGHT - 110);
      burst(oldX, oldY, "#a56891", 18, 150);
      burst(enemy.x, enemy.y, "#e986a8", 18, 150);
      enemy.spawnCooldown = stage === 3 ? 2.4 : 4.2;
    }
  }

  function spawnBossWave(x, y, speed, damage = 1) {
    const life = ARENA_DIAGONAL / speed + .35;
    game.bossWaves.push({ x, y, radius: 18, maxRadius: ARENA_DIAGONAL, speed, damage, hit: false, life, maxLife: life, kind: "心跳冲击" });
    shockwave(x, y, "#df5877", 12);
  }

  function updateBossWaves(dt) {
    for (const wave of game.bossWaves) {
      wave.radius += wave.speed * dt;
      wave.life -= dt;
      const playerDistance = distance(wave, game.player);
      if (!wave.hit && Math.abs(playerDistance - wave.radius) < game.player.radius + 8) {
        wave.hit = true;
        damagePlayer(wave.damage || 1, wave);
      }
    }
    game.bossWaves = game.bossWaves.filter(wave => wave.life > 0 && wave.radius < wave.maxRadius);
  }

  function updateBossLasers(dt) {
    for (const laser of game.bossLasers) laser.life -= dt;
    game.bossLasers = game.bossLasers.filter(laser => laser.life > 0);
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
      if (!pickup.shopItem && !["chest", "opening"].includes(pickup.type) && pickupDistance < game.player.pickupRadius && pickupDistance > 6) {
        const pull = Math.min(420, 110 + (game.player.pickupRadius - pickupDistance) * 5);
        pickup.x += (game.player.x - pickup.x) / pickupDistance * pull * dt;
        pickup.y += (game.player.y - pickup.y) / pickupDistance * pull * dt;
      }
      if (distance(pickup, game.player) > 28) {
        if (pickup.choiceGroup === "treasure" && pickup === treasureHover) treasureHover = null;
        continue;
      }
      if (pickup.choiceGroup === "treasure") {
        treasureHover = pickup;
        continue;
      }
      if (pickup.type === "chest") {
        pickup.type = "opening";
        pickup.openTimer = .55;
        pickup.phase = 0;
        burst(pickup.x, pickup.y, "#9c6b3e", 8, 80);
        continue;
      }
      if (pickup.shopItem) attemptShopPurchase(pickup);
      else collectPickup(pickup);
    }
    game.pickups = game.pickups.filter(pickup => !pickup.dead);
  }

  function attemptShopPurchase(pickup) {
    if (!pickup || pickup.dead || !pickup.shopItem) return false;
    if (game.player.coins < pickup.price) {
      if (!pickup.warnCooldown || pickup.warnCooldown <= 0) {
        game.texts.push({ text: `金币不足 · 持有 ${game.player.coins} / 需要 ${pickup.price}`, x: pickup.homeX, y: pickup.homeY - 46, life: 1.2, color: "#ef7866", size: 15 });
        pickup.warnCooldown = 1.2;
        sound(92, .08, "square", .008);
      }
      return false;
    }
    game.player.coins -= pickup.price;
    game.shopPurchases += 1;
    recordDailyProgress("shop", 1);
    collectPickup(pickup);
    game.texts.push({ text: `购买成功 · 余 ${game.player.coins} 枚`, x: pickup.homeX, y: pickup.homeY - 46, life: 1.2, color: "#91dfaa", size: 15 });
    return true;
  }

  function collectPickup(pickup) {
    pickup.dead = true;
    if (pickup.type === "heart") game.player.hp = Math.min(game.player.maxHp, game.player.hp + 2);
    if (pickup.type === "coin") game.player.coins += 1;
    if (pickup.type === "crown") { game.player.coins += 5; game.player.hp = game.player.maxHp; }
    if (pickup.type === "item") {
      grantItem(pickup.item);
      if (pickup.choiceGroup) {
        game.pickups.forEach(candidate => { if (candidate.choiceGroup === pickup.choiceGroup && candidate !== pickup) candidate.dead = true; });
        if (game.rooms[game.room].kind === "treasure" && game.room < game.rooms.length - 1) openRouteChoice();
        updateRerollControl();
      }
    }
    burst(pickup.x, pickup.y, "#74d69b", 12, 120);
    sound(pickup.type === "item" ? 520 : 680, pickup.type === "item" ? .2 : .08, "sine", .018);
  }

  function openRouteChoice() {
    if (game.routeChoice || game.rooms[game.room].routeSelected) return;
    game.doorOpen = false;
    game.routeChoice = {
      kind: "build",
      options: [
        { id: "safe", name: "守烛小径", detail: "下一房间无战斗，恢复生命、护盾与商店启动金", color: "#79bd91", badge: "低风险 · 稳定续航" },
        { id: "risk", name: "双誓险路", detail: "强化诅咒精英，额外遗物与 4 枚弹壳币", color: "#dc715d", badge: "高风险 · 双倍遗物" }
      ]
    };
    game.texts.push({ text: "选择前路 · 1 / 2", x: ROOM_WIDTH / 2, y: 116, life: 2.2 });
  }

  function openDescentChoice() {
    if (game.routeChoice || game.rooms[game.room].routeSelected) return;
    game.doorOpen = false;
    game.routeChoice = {
      kind: "descent",
      title: "终局下坠路线",
      subtitle: "原作结构在此分为 Cathedral / Sheol，并分别通往 Chest / Dark Room",
      options: [
        { id: "cathedral", name: "哀歌圣堂", detail: "光弹密集、场地清晰，最终进入鎏金遗箱", color: "#83c9dd", badge: "圣堂 → 遗箱" },
        { id: "sheol", name: "燃罪魔窟", detail: "近身压迫、陷阱更多，最终进入无光深室", color: "#df6e52", badge: "魔窟 → 深室" }
      ]
    };
  }

  function applyEndingBranch(branch) {
    const light = branch === "cathedral";
    const stageNames = light ? ["哀歌圣堂", "鎏金遗箱"] : ["燃罪魔窟", "无光深室"];
    const bossNames = light ? ["圣髓潜兽", "鎏金审判"] : ["烬狱潜兽", "双蹄审判"];
    for (const room of game.rooms) {
      if (!room.branchDepth) continue;
      const index = room.branchDepth - 1;
      room.biome = stageNames[index];
      room.theme = light ? 4 : 5;
      if (room.kind === "boss") {
        room.name = bossNames[index];
        room.bossName = bossNames[index];
      } else if (room.kind === "treasure") room.name = `${stageNames[index]}宝库`;
      else if (room.kind === "shop") room.name = "终路商贩";
      else room.name = randomChoice(roomNames[room.theme]);
    }
    game.finalBranch = branch;
  }

  function chooseRoute(choice) {
    if (!game || !game.routeChoice) return false;
    const option = game.routeChoice.options.find(candidate => candidate.id === choice);
    const nextRoom = game.rooms[game.room + 1];
    if (!option || !nextRoom) return false;
    game.rooms[game.room].routeSelected = option.id;
    game.rooms[game.room].cleared = true;
    game.routeChoices += 1;
    if (game.routeChoice.kind === "descent") {
      applyEndingBranch(option.id);
      game.texts.push({ text: `终路已定 · ${option.badge}`, x: ROOM_WIDTH / 2, y: 132, life: 2.2, color: option.color });
    } else if (option.id === "safe") {
      nextRoom.kind = "sanctuary";
      nextRoom.name = "守烛圣所";
      nextRoom.enemies = [];
      nextRoom.modifier = null;
      game.texts.push({ text: "选择守烛小径 · 稳妥休整", x: ROOM_WIDTH / 2, y: 132, life: 1.8, color: option.color });
    } else {
      nextRoom.kind = "elite";
      nextRoom.name = "双誓刑场";
      nextRoom.modifier = "cursed";
      nextRoom.riskReward = 2;
      game.texts.push({ text: "选择双誓险路 · 高危高报酬", x: ROOM_WIDTH / 2, y: 132, life: 1.8, color: option.color });
      recordDailyProgress("risk", 1);
    }
    game.routeChoice = null;
    game.doorOpen = true;
    sound(["risk", "sheol"].includes(option.id) ? 115 : 390, .22, ["risk", "sheol"].includes(option.id) ? "sawtooth" : "sine", .02);
    return true;
  }

  function grantItem(item) {
    item.apply(game.player);
    game.itemsFound += 1;
    game.itemStacks[item.id] = (game.itemStacks[item.id] || 0) + 1;
    updateSynergies();
    game.texts.push({ text: `${item.icon} ${item.name} · 已自动生效 · ${item.detail}`, x: ROOM_WIDTH / 2, y: 122, life: 3.2, color: item.cursed ? "#ed7793" : "#ffe09a", size: 16 });
    if (guideOpen) renderGuide();
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

  function nearestEnemy(origin = game.player, excludedIds = null) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const enemy of game.enemies) {
      if (enemy.dead || enemy.intangible || (excludedIds && excludedIds.has(enemy.id))) continue;
      const currentDistance = distance(enemy, origin);
      if (currentDistance < nearestDistance) { nearest = enemy; nearestDistance = currentDistance; }
    }
    return nearest;
  }

  function finish(won) {
    if (!game.metaRecorded) {
      game.metaRecorded = true;
      metaProgress.runs += 1;
      if (won) metaProgress.wins += 1;
      metaProgress.bestKills = Math.max(metaProgress.bestKills, game.kills);
      settleRunSupplyReward(won);
      saveMetaProgress();
    }
    game.state = "ended";
    game.outcome = won ? "victory" : "defeat";
    gameShell.classList.remove("playing");
    touchUi.classList.remove("active");
    document.querySelector("#end-kicker").textContent = won ? "DUNGEON CLEARED" : "RUN OVER";
    document.querySelector("#end-title").textContent = won ? "地牢已净化" : "你倒在了门前";
    const seconds = Math.floor(game.elapsed % 60).toString().padStart(2, "0");
    const minutes = Math.floor(game.elapsed / 60);
    const sourceLabels = { repeater: "连弩", scatter: "霰火", wisp: "游魂", cleaver: "祭刃", seeker: "追魂", prism: "棱镜", orbit: "环刃", skill: "技能", effect: "连锁", "status:burn": "燃烧", "status:poison": "中毒", "status:bleed": "流血", "status:shock": "感电" };
    const topSource = Object.entries(game.damageBySource).sort((left, right) => right[1] - left[1])[0];
    const damageSummary = topSource ? `${sourceLabels[topSource[0]] || topSource[0]} ${Math.round(topSource[1])}` : "无";
    const deathSummary = won ? "完成净化" : game.lastDamageSource;
    const unlockSummary = game.unlocks.length ? `<span>新解锁 ${game.unlocks.join(" / ")}</span>` : "";
    const supplyReward = game.supplySettlement || calculateRunSupplyReward(won);
    const supplySummary = supplyReward.eligible ? `补给币 +${supplyReward.total}${game.supplyBonus ? ` · 首领首胜 +${game.supplyBonus}` : ""}` : "调试局不结算补给币";
    document.querySelector("#end-stats").innerHTML = `<span>${heroes[game.player.hero].name} · ${weaponNames[game.player.weapon]}</span><span>击败 ${game.kills}</span><span>Boss ${game.bossKills}/11</span><span>终路 ${game.finalBranch === "sheol" ? "魔窟" : game.finalBranch === "cathedral" ? "圣堂" : "未选择"}</span><span>遗物 ${game.itemsFound}</span><span>种子 ${game.seedsFound}</span><span>完美闪避 ${game.evades}</span><span>无伤房 ${game.perfectRooms}</span><span>总伤害 ${Math.round(game.damageDealt)}</span><span>主力输出 ${damageSummary}</span><span>承受伤害 ${game.damageTaken.toFixed(1)}</span><span>${won ? "结局" : "死因"} ${deathSummary}</span><span>存活 ${minutes}:${seconds}</span><span>关卡 ${game.room + 1}/${game.rooms.length}</span><span class="supply-earned">${supplySummary}</span>${unlockSummary}`;
    document.querySelector("#end-supply-progress").textContent = `${nextVoucherGoal()} · 当前持有 ◈ ${metaProgress.supplyCoins}`;
    endScreen.classList.add("visible");
  }

  function render() {
    context.clearRect(0, 0, width, height);
    context.save();
    const shakeX = random(-screenShake, screenShake);
    const shakeY = random(-screenShake, screenShake);
    context.translate(offsetX + shakeX, offsetY + shakeY);
    context.scale(scale, verticalScale);
    drawRoom();
    if (game) {
      drawBossArena();
      drawBossWaves();
      drawBossLasers();
      drawHazards();
      drawGuardianLinks();
      drawObstacles();
      drawPickups();
      drawBombs();
      drawThreatTelegraphs();
      drawBullets();
      drawSlashes();
      drawEnemies();
      drawFamiliars();
      drawPlayer();
      drawParticles();
      drawAtmosphere();
      drawHud();
      drawTexts();
      if (game.routeChoice) drawRouteChoice();
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
      { floor: "#373246", floorDark: "#252230", grout: "#574d6a", wall: "#1d1a27", trim: "#625779", stain: "#1c1625", glow: "#9d72b0" },
      { floor: "#293d46", floorDark: "#18272f", grout: "#416573", wall: "#142128", trim: "#527785", stain: "#13232b", glow: "#79c7db" },
      { floor: "#3d2828", floorDark: "#251719", grout: "#674038", wall: "#1e1215", trim: "#7c4939", stain: "#260f14", glow: "#df6848" }
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

  function drawBossArena() {
    if (game.arenaInset <= 0) return;
    const inset = WALL + game.arenaInset;
    context.fillStyle = "rgba(28, 7, 10, .52)";
    context.fillRect(WALL, WALL, ROOM_WIDTH - WALL * 2, game.arenaInset);
    context.fillRect(WALL, ROOM_HEIGHT - inset, ROOM_WIDTH - WALL * 2, game.arenaInset);
    context.fillRect(WALL, inset, game.arenaInset, ROOM_HEIGHT - inset * 2);
    context.fillRect(ROOM_WIDTH - inset, inset, game.arenaInset, ROOM_HEIGHT - inset * 2);
    context.strokeStyle = `rgba(239, 91, 62, ${.55 + Math.sin(game.elapsed * 8) * .18})`;
    context.lineWidth = 4;
    context.strokeRect(inset, inset, ROOM_WIDTH - inset * 2, ROOM_HEIGHT - inset * 2);
  }

  function drawBossWaves() {
    for (const wave of game.bossWaves) {
      const fade = clamp(wave.life / .6, 0, 1);
      context.strokeStyle = `rgba(239, 88, 119, ${.58 * fade})`;
      context.lineWidth = 10;
      context.shadowColor = "#b62857";
      context.shadowBlur = 14;
      context.beginPath(); context.arc(wave.x, wave.y, wave.radius, 0, TAU); context.stroke();
      context.strokeStyle = `rgba(255, 199, 187, ${.72 * fade})`;
      context.lineWidth = 2;
      context.beginPath(); context.arc(wave.x, wave.y, wave.radius, 0, TAU); context.stroke();
      context.shadowBlur = 0;
    }
  }

  function drawBossLasers() {
    for (const laser of game.bossLasers) {
      const alpha = clamp(laser.life / laser.maxLife, 0, 1);
      const endX = laser.x + Math.cos(laser.angle) * laser.length;
      const endY = laser.y + Math.sin(laser.angle) * laser.length;
      const laserColor = laser.color || (laser.stage === 3 ? "#ff397d" : laser.stage === 2 ? "#f06b5c" : "#f02e45");
      context.save();
      context.lineCap = "round";
      context.strokeStyle = `rgba(126, 16, 30, ${.68 * alpha})`;
      context.shadowColor = laserColor;
      context.shadowBlur = laser.stage === 3 ? 30 : 22;
      context.lineWidth = laser.width;
      context.beginPath(); context.moveTo(laser.x, laser.y); context.lineTo(endX, endY); context.stroke();
      context.strokeStyle = laser.coreColor || (laser.stage === 3 ? `rgba(255, 210, 229, ${.95 * alpha})` : `rgba(255, 190, 142, ${.9 * alpha})`);
      context.globalAlpha = .92 * alpha;
      context.lineWidth = Math.max(3, laser.width * .22);
      context.beginPath(); context.moveTo(laser.x, laser.y); context.lineTo(endX, endY); context.stroke();
      context.restore();
    }
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
    for (let index = 0; index < 11; index += 1) {
      const x = WALL + 46 + seeded(seed + index * 29) * (ROOM_WIDTH - WALL * 2 - 92);
      const y = WALL + 42 + seeded(seed + index * 31) * (ROOM_HEIGHT - WALL * 2 - 84);
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
    for (let index = 0; index < 9; index += 1) {
      const x = WALL + 190 + seeded(seed + index * 43) * (ROOM_WIDTH - WALL * 2 - 290);
      const y = WALL + 130 + seeded(seed + index * 47) * (ROOM_HEIGHT - WALL * 2 - 220);
      const angle = seeded(seed + index * 53) * TAU;
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      if (theme === 2 || theme === 5) drawAshProp(index, palette);
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
    context.beginPath(); context.ellipse(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 12, 285, 132, 0, 0, TAU); context.fill();
    context.globalAlpha = .32;
    context.strokeStyle = "#e3bc68";
    context.lineWidth = 3;
    context.beginPath(); context.ellipse(ROOM_WIDTH / 2, ROOM_HEIGHT / 2 + 12, 268, 116, 0, 0, TAU); context.stroke();
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

  function drawHeroBackpiece(player, hero) {
    context.save();
    context.strokeStyle = "#21181d";
    context.lineWidth = 4;
    if (player.hero === "breaker") {
      context.fillStyle = "#3d2b29";
      roundedRect(-24, -4, 17, 30, 6); context.fill(); context.stroke();
      context.fillStyle = "#b9583f";
      for (const y of [2, 11, 20]) { context.beginPath(); context.arc(-23, y, 4, 0, TAU); context.fill(); }
      context.fillStyle = "#755044";
      context.beginPath(); context.moveTo(-18, -4); context.lineTo(-28, -18); context.lineTo(-7, -12); context.closePath(); context.fill(); context.stroke();
    } else if (player.hero === "gambler") {
      context.fillStyle = "#463822";
      context.beginPath(); context.moveTo(-15, 10); context.lineTo(-25, 30); context.lineTo(-3, 21); context.lineTo(3, 31); context.lineTo(16, 11); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#d9ad52";
      context.beginPath(); context.arc(-18, 9, 8, 0, TAU); context.fill(); context.stroke();
      context.fillStyle = "#5a361f"; context.beginPath(); context.arc(-18, 9, 3, 0, TAU); context.fill();
    } else if (player.hero === "seer") {
      context.fillStyle = "#352847";
      context.beginPath(); context.moveTo(-14, -12); context.quadraticCurveTo(-31, 7, -21, 29); context.lineTo(0, 21); context.lineTo(19, 29); context.quadraticCurveTo(29, 6, 14, -13); context.closePath(); context.fill(); context.stroke();
      context.strokeStyle = "#9a7dcb"; context.lineWidth = 2;
      for (const side of [-1, 1]) { context.beginPath(); context.arc(side * 21, -4, 8, 0, TAU); context.stroke(); }
    } else {
      context.fillStyle = "#314d46";
      for (const side of [-1, 1]) {
        context.beginPath(); context.moveTo(side * 9, -6); context.lineTo(side * 29, -14); context.lineTo(side * 32, 9); context.lineTo(side * 15, 14); context.closePath(); context.fill(); context.stroke();
        context.strokeStyle = "#73977e"; context.lineWidth = 3; context.beginPath(); context.moveTo(side * 17, -8); context.lineTo(side * 25, 8); context.stroke();
      }
    }
    context.restore();
  }

  function drawHeroIdentity(player, hero) {
    context.save();
    context.strokeStyle = "#24191e";
    context.lineWidth = 3;
    if (player.hero === "breaker") {
      context.fillStyle = "#4b3430";
      context.beginPath(); context.moveTo(-15, -19); context.lineTo(10, -25); context.lineTo(19, -10); context.lineTo(13, 3); context.lineTo(-3, 0); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#e26c4c";
      context.fillRect(-11, -16, 18, 3);
      context.fillStyle = "#191318";
      for (const y of [-6, 0]) context.fillRect(4, y, 10, 2);
      context.strokeStyle = "#f19a54"; context.beginPath(); context.moveTo(-8, -24); context.quadraticCurveTo(-3, -36, 5, -38); context.stroke();
    } else if (player.hero === "gambler") {
      context.fillStyle = "#3c2d21";
      context.beginPath(); context.ellipse(0, -23, 25, 7, -.08, 0, TAU); context.fill(); context.stroke();
      context.fillStyle = "#7b5c2e";
      context.beginPath(); context.moveTo(-14, -24); context.lineTo(-9, -39); context.lineTo(10, -37); context.lineTo(15, -23); context.closePath(); context.fill(); context.stroke();
      context.strokeStyle = "#e6bd62"; context.lineWidth = 2; context.beginPath(); context.arc(10, -12, 8, 0, TAU); context.stroke();
      context.beginPath(); context.moveTo(17, -8); context.lineTo(22, 0); context.stroke();
      context.fillStyle = "#ffe994"; context.beginPath(); context.arc(10, -12, 2.5, 0, TAU); context.fill();
    } else if (player.hero === "seer") {
      context.fillStyle = "#3c2d52";
      context.beginPath(); context.moveTo(-18, -5); context.quadraticCurveTo(-22, -31, 0, -40); context.quadraticCurveTo(22, -30, 20, -5); context.lineTo(12, -18); context.lineTo(-10, -18); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#1c1524"; roundedRect(-12, -17, 26, 8, 3); context.fill();
      context.fillStyle = "#d8c0ff"; context.shadowColor = "#a476e5"; context.shadowBlur = 12;
      context.beginPath(); context.ellipse(1, -24, 6, 4, 0, 0, TAU); context.fill();
      context.fillStyle = "#472b68"; context.beginPath(); context.arc(2, -24, 2, 0, TAU); context.fill(); context.shadowBlur = 0;
    } else {
      context.fillStyle = "#263b37";
      context.beginPath(); context.arc(1, -11, 23, 0, TAU); context.fill(); context.stroke();
      context.strokeStyle = "#789b83"; context.lineWidth = 4;
      for (let bar = -2; bar <= 2; bar += 1) { context.beginPath(); context.moveTo(bar * 8, -31); context.lineTo(bar * 7, 5); context.stroke(); }
      context.beginPath(); context.arc(0, -14, 24, Math.PI, TAU); context.stroke();
      context.fillStyle = "#b8d0ae"; context.beginPath(); context.arc(8, -13, 4, 0, TAU); context.fill();
    }
    context.restore();
  }

  function drawHeroLowerBody(player, stride) {
    context.save();
    context.strokeStyle = "#20171c";
    context.lineWidth = 4;
    if (player.hero === "breaker") {
      context.fillStyle = "#302326";
      roundedRect(-27, -4, 16, 31, 5); context.fill(); context.stroke();
      context.fillStyle = "#b84f38";
      for (const y of [2, 11, 20]) { context.beginPath(); context.arc(-27, y, 4, 0, TAU); context.fill(); }
      drawLimb(-10, 12, -15 + stride, 24, 9, "#4d3231");
      drawLimb(6, 12, 10 - stride, 24, 9, "#4d3231");
      context.fillStyle = "#6b3834";
      context.beginPath(); context.moveTo(-19, -3); context.lineTo(13, -6); context.lineTo(18, 19); context.lineTo(4, 27); context.lineTo(-14, 22); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#a94a39";
      context.beginPath(); context.moveTo(-13, 1); context.lineTo(3, -1); context.lineTo(-1, 21); context.lineTo(-11, 18); context.closePath(); context.fill();
      drawBonePlate(12, 4, 16, 25, .12, false, "#79554a");
      context.fillStyle = "#d06a48"; context.fillRect(-12, 8, 23, 4);
    } else if (player.hero === "gambler") {
      drawLimb(-6, 11, -9 + stride, 25, 6, "#8b7147");
      drawLimb(6, 11, 9 - stride, 25, 6, "#8b7147");
      context.fillStyle = "#3d3023";
      context.beginPath(); context.moveTo(-15, -6); context.lineTo(15, -6); context.lineTo(19, 15); context.lineTo(8, 30); context.lineTo(0, 20); context.lineTo(-9, 30); context.lineTo(-18, 14); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#7b5c2d";
      context.beginPath(); context.moveTo(-7, -5); context.lineTo(6, -5); context.lineTo(9, 17); context.lineTo(0, 22); context.lineTo(-8, 15); context.closePath(); context.fill();
      context.strokeStyle = "#e0b85b"; context.lineWidth = 2; context.beginPath(); context.moveTo(-3, 0); context.lineTo(1, 18); context.stroke();
      context.fillStyle = "#d7a94e"; context.beginPath(); context.arc(-15, 10, 6, 0, TAU); context.fill(); context.stroke();
    } else if (player.hero === "seer") {
      const float = Math.sin(game.elapsed * 4) * 2;
      context.fillStyle = "#332643";
      context.beginPath(); context.moveTo(-17, -7); context.quadraticCurveTo(-26, 8, -20, 27 + float); context.lineTo(-7, 18); context.lineTo(0, 31 + float); context.lineTo(8, 18); context.lineTo(21, 27 + float); context.quadraticCurveTo(27, 7, 15, -8); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#5d4777";
      context.beginPath(); context.moveTo(-10, -4); context.quadraticCurveTo(-8, 12, 0, 23); context.quadraticCurveTo(9, 11, 10, -4); context.closePath(); context.fill();
      context.strokeStyle = "#a88cd6"; context.lineWidth = 2;
      for (const side of [-1, 1]) { context.beginPath(); context.arc(side * 17, 8, 7 + Math.sin(game.elapsed * 3 + side) * 1.5, 0, TAU); context.stroke(); }
      context.fillStyle = "#bba7e6"; context.globalAlpha = .5;
      for (let mote = 0; mote < 3; mote += 1) { const angle = game.elapsed * .8 + mote * TAU / 3; context.beginPath(); context.arc(Math.cos(angle) * 24, 7 + Math.sin(angle) * 17, 2.5, 0, TAU); context.fill(); }
      context.globalAlpha = 1;
    } else {
      drawLimb(-12, 10, -17 + stride, 26, 11, "#526f60");
      drawLimb(10, 10, 14 - stride, 26, 11, "#526f60");
      context.fillStyle = "#293e38";
      context.beginPath(); context.moveTo(-23, -6); context.lineTo(19, -7); context.lineTo(25, 18); context.lineTo(10, 29); context.lineTo(-13, 28); context.lineTo(-25, 15); context.closePath(); context.fill(); context.stroke();
      for (const side of [-1, 1]) drawBonePlate(side * 19, 1, 18, 25, side * .18, false, "#66806d");
      context.strokeStyle = "#8eb198"; context.lineWidth = 3;
      context.beginPath(); context.moveTo(-12, -4); context.lineTo(-9, 22); context.moveTo(0, -6); context.lineTo(1, 25); context.moveTo(12, -5); context.lineTo(10, 21); context.stroke();
    }
    context.restore();
  }

  function drawHeroUpperBody(player) {
    const skin = player.flash > 0 ? "#fff" : "#dcc6a3";
    context.save();
    if (player.hero === "breaker") {
      drawLimb(-8, 1, -20, 10, 8, "#a96b57");
      drawLimb(5, 1, 20, 1, 8, "#a96b57");
      drawLayeredEllipse(1, -11, 20, 17, -.12, skin, "#281b20", "#ffe3b5");
      context.fillStyle = "#3a2929"; context.strokeStyle = "#1c1519"; context.lineWidth = 4;
      context.beginPath(); context.moveTo(-17, -20); context.lineTo(7, -29); context.lineTo(21, -16); context.lineTo(15, 2); context.lineTo(-4, -1); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#d15c42"; roundedRect(-11, -18, 22, 4, 2); context.fill();
      context.fillStyle = "#151116"; for (const y of [-9, -2]) context.fillRect(5, y, 11, 2);
      drawRimmedEye(-5, -11, 4.5, 3.5, 1, 0, "#d66a42");
      context.strokeStyle = "#f29a54"; context.lineWidth = 3; context.beginPath(); context.moveTo(-9, -26); context.quadraticCurveTo(-3, -39, 6, -40); context.stroke();
    } else if (player.hero === "gambler") {
      drawLimb(-6, 1, -17, 9, 6, "#d1b98c");
      drawLimb(6, 0, 19, 1, 6, "#d1b98c");
      drawLayeredEllipse(1, -10, 16, 17, -.04, skin, "#281b20", "#ffe2b4");
      context.fillStyle = "#30231e"; context.beginPath(); context.ellipse(0, -24, 28, 7, -.08, 0, TAU); context.fill(); context.strokeStyle = "#1e1718"; context.lineWidth = 3; context.stroke();
      context.fillStyle = "#6f522b"; context.beginPath(); context.moveTo(-15, -25); context.lineTo(-9, -42); context.lineTo(11, -40); context.lineTo(17, -24); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#d8aa4f"; context.fillRect(-13, -29, 27, 4);
      context.fillStyle = "#3a2324"; context.beginPath(); context.moveTo(-12, -12); context.quadraticCurveTo(0, -18, 14, -10); context.lineTo(12, -3); context.quadraticCurveTo(0, -8, -13, -3); context.closePath(); context.fill();
      drawRimmedEye(7, -12, 4, 3, 1, 0, "#d4a44e");
      context.strokeStyle = "#e3bd65"; context.lineWidth = 2; context.beginPath(); context.arc(15, -11, 8, 0, TAU); context.moveTo(21, -6); context.lineTo(25, 2); context.stroke();
    } else if (player.hero === "seer") {
      drawLimb(-7, 2, -19, 10, 6, "#766292");
      drawLimb(7, 1, 20, 0, 6, "#766292");
      context.fillStyle = "#2c203b"; context.strokeStyle = "#211721"; context.lineWidth = 4;
      context.beginPath(); context.moveTo(-21, -3); context.quadraticCurveTo(-23, -31, 0, -43); context.quadraticCurveTo(24, -29, 21, -2); context.lineTo(12, -18); context.lineTo(-11, -18); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#17131c"; context.beginPath(); context.ellipse(1, -13, 13, 11, 0, 0, TAU); context.fill();
      drawRimmedEye(1, -13, 8, 5, 1, 0, "#8e69c8", "#d9cbeb");
      context.fillStyle = "#d9c6ff"; context.shadowColor = "#a36ff1"; context.shadowBlur = 14;
      context.beginPath(); context.ellipse(1, -29, 7, 4, 0, 0, TAU); context.fill(); context.shadowBlur = 0;
      context.strokeStyle = "#9c7dcc"; context.lineWidth = 2; context.beginPath(); context.arc(0, -11, 26, -.7, .7); context.stroke();
    } else {
      drawLimb(-12, 1, -24, 10, 11, "#66806d");
      drawLimb(9, 0, 23, 0, 11, "#66806d");
      context.fillStyle = "#263b37"; context.strokeStyle = "#1c2926"; context.lineWidth = 5;
      context.beginPath(); context.moveTo(-21, -25); context.lineTo(-16, 3); context.lineTo(17, 4); context.lineTo(23, -24); context.closePath(); context.fill(); context.stroke();
      context.strokeStyle = "#789b83"; context.lineWidth = 4;
      for (let bar = -2; bar <= 2; bar += 1) { context.beginPath(); context.moveTo(bar * 8, -29); context.lineTo(bar * 7, 3); context.stroke(); }
      context.beginPath(); context.arc(1, -23, 22, Math.PI, TAU); context.stroke();
      context.fillStyle = "#171817"; context.beginPath(); context.ellipse(2, -10, 12, 9, 0, 0, TAU); context.fill();
      drawRimmedEye(8, -12, 4.5, 3.5, 1, 0, "#79aa85", "#bcccad");
      drawBonePlate(-22, -2, 17, 24, -.2, false, "#6c8873");
    }
    context.restore();
  }

  function drawPlayer() {
    const player = game.player;
    const hero = heroes[player.hero];
    const bob = Math.sin(player.walk * 2) * 2 * player.moveBlend;
    const stride = Math.sin(player.walk) * 4 * player.moveBlend;
    const bodyAngle = player.moveBlend > .08 ? player.moveAngle : player.aimAngle;
    const rollRotation = player.roll > 0 ? player.rollSpin : 0;
    context.save();
    context.translate(player.x, player.y + bob);
    if (player.armor > 0) {
      context.strokeStyle = "#91d4e8";
      context.lineWidth = 4;
      context.globalAlpha = .55 + Math.sin(game.elapsed * 5) * .15;
      context.beginPath(); context.arc(0, -2, 29, 0, TAU); context.stroke();
      context.globalAlpha = 1;
    }
    if (player.invincible > 0 && Math.floor(player.invincible * 14) % 2 === 0) context.globalAlpha = .35;
    context.rotate(bodyAngle + rollRotation);
    context.scale(1.28 * (1 + player.squash * .14), 1.28 * (1 - player.squash * .11));
    context.fillStyle = "#100d11aa";
    context.beginPath(); context.ellipse(-3, 19, 24, 9, 0, 0, TAU); context.fill();
    drawHeroLowerBody(player, stride);
    context.save();
    context.rotate(player.roll > 0 ? 0 : angleDelta(player.aimAngle, bodyAngle));
    context.translate(-player.recoil, 0);
    drawHeroUpperBody(player);
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
    context.strokeStyle = "#21181a";
    context.lineWidth = 3;
    if (player.weapon === "cleaver") {
      context.fillStyle = "#b8b7ad";
      context.beginPath(); context.moveTo(18, -4); context.lineTo(49, -12); context.lineTo(42, 3); context.lineTo(18, 5); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#7e4838"; roundedRect(12, -3, 15, 7, 3); context.fill(); context.stroke();
    } else if (player.weapon === "wisp") {
      context.strokeStyle = "#826da8";
      context.lineWidth = 5;
      context.beginPath(); context.moveTo(15, 3); context.lineTo(34, -4); context.stroke();
      context.fillStyle = "#bba6e9";
      context.shadowColor = "#8e6dda";
      context.shadowBlur = 10;
      context.beginPath(); context.arc(38, -6, 6, 0, TAU); context.fill();
      context.shadowBlur = 0;
    } else if (player.weapon === "seeker") {
      context.strokeStyle = "#376f66";
      context.lineWidth = 4;
      context.beginPath(); context.moveTo(15, 3); context.lineTo(30, -1); context.stroke();
      context.fillStyle = "#5ba997";
      context.shadowColor = "#7ff6d5";
      context.shadowBlur = 12;
      for (let cell = 0; cell < 3; cell += 1) {
        context.beginPath(); context.arc(34 + cell * 6, (cell - 1) * 5, 6, 0, TAU); context.fill(); context.stroke();
      }
      context.fillStyle = "#d6fff1";
      context.beginPath(); context.arc(48, 0, 3, 0, TAU); context.fill();
      context.shadowBlur = 0;
    } else if (player.weapon === "prism") {
      context.strokeStyle = "#456d91";
      context.lineWidth = 4;
      context.beginPath(); context.moveTo(14, 4); context.lineTo(31, 0); context.stroke();
      context.fillStyle = "#8fdcff";
      context.shadowColor = "#9ceaff";
      context.shadowBlur = 15;
      context.beginPath(); context.moveTo(30, 0); context.lineTo(41, -11); context.lineTo(53, 0); context.lineTo(41, 11); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#f0fcff";
      context.beginPath(); context.moveTo(37, -4); context.lineTo(44, -7); context.lineTo(48, 0); context.closePath(); context.fill();
      context.shadowBlur = 0;
    } else if (player.weapon === "orbit") {
      context.strokeStyle = "#6f253f";
      context.lineWidth = 5;
      context.beginPath(); context.moveTo(14, 3); context.lineTo(31, 0); context.stroke();
      context.fillStyle = "#d95079";
      context.shadowColor = "#ff719d";
      context.shadowBlur = 12;
      context.beginPath(); context.arc(39, 0, 12, -.72, .72); context.arc(39, 0, 7, .72, -.72, true); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#ffd1dc";
      context.beginPath(); context.moveTo(49, -8); context.lineTo(58, 0); context.lineTo(49, 8); context.closePath(); context.fill();
      context.shadowBlur = 0;
    } else {
      context.fillStyle = player.weapon === "scatter" ? "#87503d" : "#6f5437";
      roundedRect(17, player.weapon === "scatter" ? -6 : -4, player.weapon === "scatter" ? 26 : 20, player.weapon === "scatter" ? 12 : 8, 3); context.fill(); context.stroke();
      context.fillStyle = "#e2b55d";
      context.fillRect(player.weapon === "scatter" ? 37 : 31, -2, player.weapon === "scatter" ? 11 : 8, 4);
    }
    if (player.muzzleFlash > 0) {
      const flash = 8 + player.muzzleFlash * 95;
      const muzzleColor = player.weapon === "seeker" ? "#baffea" : player.weapon === "prism" ? "#e5f8ff" : player.weapon === "orbit" ? "#ffd0dc" : "#fff1a6";
      context.fillStyle = muzzleColor;
      context.shadowColor = player.weapon === "seeker" ? "#52e5bc" : player.weapon === "prism" ? "#68ccff" : player.weapon === "orbit" ? "#ff4f82" : "#ff8a38";
      context.shadowBlur = 14;
      context.beginPath();
      context.moveTo(39, 0);
      context.lineTo(39 + flash, -5);
      context.lineTo(44 + flash * .55, 0);
      context.lineTo(39 + flash, 5);
      context.closePath();
      context.fill();
      context.shadowBlur = 0;
    }
    context.restore();
    context.restore();
  }

  function drawEnemyRoleSilhouette(enemy) {
    context.save();
    context.strokeStyle = "#21171c";
    context.lineWidth = 4;
    if (enemy.type === "grunt") {
      context.fillStyle = "#633137";
      context.beginPath(); context.moveTo(-16, -8); context.lineTo(-28, -22); context.lineTo(-22, 1); context.closePath(); context.fill(); context.stroke();
    } else if (enemy.type === "turret") {
      context.fillStyle = "#4e392d";
      for (let leg = 0; leg < 3; leg += 1) { const angle = leg / 3 * TAU; context.beginPath(); context.moveTo(Math.cos(angle) * 13, Math.sin(angle) * 13); context.lineTo(Math.cos(angle - .18) * 31, Math.sin(angle - .18) * 31); context.lineTo(Math.cos(angle + .18) * 31, Math.sin(angle + .18) * 31); context.closePath(); context.fill(); context.stroke(); }
    } else if (enemy.type === "charger") {
      context.fillStyle = "#50462d";
      context.beginPath(); context.moveTo(10, -13); context.lineTo(34, 0); context.lineTo(10, 13); context.closePath(); context.fill(); context.stroke();
    } else if (enemy.type === "splitter") {
      context.fillStyle = "#506b47";
      for (let pod = 0; pod < 3; pod += 1) { const angle = pod / 3 * TAU + enemy.phase * .1; context.beginPath(); context.arc(Math.cos(angle) * 20, Math.sin(angle) * 20, 9, 0, TAU); context.fill(); context.stroke(); }
    } else if (enemy.type === "cultist") {
      context.fillStyle = "#342443";
      context.beginPath(); context.moveTo(-17, 13); context.lineTo(-27, 31); context.lineTo(-3, 21); context.lineTo(5, 31); context.lineTo(18, 12); context.closePath(); context.fill(); context.stroke();
    } else if (enemy.type === "bomber") {
      context.fillStyle = "#35272a";
      context.beginPath(); context.arc(-18, 2, 15, 0, TAU); context.fill(); context.stroke();
      context.strokeStyle = "#d16b45"; context.beginPath(); context.moveTo(-23, -9); context.quadraticCurveTo(-34, -22, -22, -29); context.stroke();
    }
    context.restore();
  }

  function drawEnemies() {
    for (const enemy of game.enemies) {
      context.save();
      context.translate(enemy.x, enemy.y);
      context.rotate(enemy.angle);
      context.translate(-enemy.recoil, 0);
      context.scale(1 + enemy.squash * .12, 1 - enemy.squash * .1);
      if (enemy.elite) {
        context.strokeStyle = eliteAffixes[enemy.affix].color;
        context.lineWidth = 3;
        context.globalAlpha = .42 + Math.sin(game.elapsed * 5 + enemy.id) * .12;
        context.beginPath(); context.arc(0, 0, enemy.radius + 8, 0, TAU); context.stroke();
        context.globalAlpha = 1;
      }
      if (enemy.type === "splitter") {
        context.strokeStyle = "#73c48f";
        context.lineWidth = 2;
        context.globalAlpha = .26 + Math.sin(game.elapsed * 4 + enemy.id) * .08;
        context.beginPath(); context.arc(0, 0, enemy.radius + 13, 0, TAU); context.stroke();
        context.globalAlpha = 1;
      }
      if (enemy.shield > 0) {
        context.strokeStyle = "#84dff3";
        context.lineWidth = 4;
        context.globalAlpha = .48 + Math.sin(game.elapsed * 7 + enemy.id) * .16;
        context.beginPath(); context.arc(0, 0, enemy.radius + 11, -.35, TAU - .35); context.stroke();
        context.globalAlpha = 1;
      }
      context.fillStyle = "#100c10aa";
      context.beginPath(); context.ellipse(-2, enemy.radius * .9, enemy.radius * 1.25, enemy.radius * .48, 0, 0, TAU); context.fill();
      if (!isBoss(enemy)) context.scale(1.18, 1.18);
      if (enemy.type === "grunt") drawGrunt(enemy);
      else if (enemy.type === "turret") drawTurret(enemy);
      else if (enemy.type === "charger") drawCharger(enemy);
      else if (enemy.type === "bat") drawBat(enemy);
      else if (enemy.type === "splitter") drawSplitter(enemy);
      else if (enemy.type === "leech") drawLeech(enemy);
      else if (enemy.type === "cultist") drawCultist(enemy);
      else if (enemy.type === "bomber") drawBomber(enemy);
      else drawBoss(enemy);
      if (enemy.attackFlash > 0) {
        const flash = enemy.radius * .45 + enemy.attackFlash * 55;
        context.fillStyle = "#ffb15c";
        context.shadowColor = "#e94836";
        context.shadowBlur = 13;
        context.beginPath();
        context.moveTo(enemy.radius * .72, 0);
        context.lineTo(enemy.radius + flash, -5);
        context.lineTo(enemy.radius + flash * .65, 0);
        context.lineTo(enemy.radius + flash, 5);
        context.closePath();
        context.fill();
        context.shadowBlur = 0;
      }
      context.restore();
      if (enemy.elite) {
        const affix = eliteAffixes[enemy.affix];
        context.textAlign = "center";
        context.font = "900 10px system-ui";
        context.fillStyle = affix.color;
        context.strokeStyle = "#171116";
        context.lineWidth = 3;
        const label = `${affix.glyph} ${affix.name}`;
        context.strokeText(label, enemy.x, enemy.y - enemy.radius - 19);
        context.fillText(label, enemy.x, enemy.y - enemy.radius - 19);
        context.textAlign = "left";
      }
      const statusEntries = [
        ["burn", "♨", "#f18a4f"], ["freeze", "❄", "#8fe0ef"], ["poison", "●", "#8dcb68"],
        ["bleed", "▼", "#df5570"], ["shock", "ϟ", "#c9b6ff"]
      ].filter(entry => enemy.statuses[entry[0]] > 0);
      statusEntries.forEach((entry, index) => {
        const x = enemy.x + (index - (statusEntries.length - 1) / 2) * 13;
        context.fillStyle = "#171116cc";
        context.beginPath(); context.arc(x, enemy.y + enemy.radius + 12, 6, 0, TAU); context.fill();
        context.fillStyle = entry[2];
        context.font = "900 9px system-ui";
        context.textAlign = "center";
        context.fillText(entry[1], x, enemy.y + enemy.radius + 15);
      });
      context.textAlign = "left";
      if (!["grunt", "bat", "leech"].includes(enemy.type)) drawHealthBar(enemy);
    }
  }

  function drawGuardianLinks() {
    context.save();
    context.lineWidth = 2;
    context.setLineDash([6, 7]);
    for (const enemy of game.enemies) {
      if (enemy.dead || isBoss(enemy)) continue;
      const guardian = guardianFor(enemy);
      if (!guardian) continue;
      const pulse = .18 + Math.sin(game.elapsed * 5 + enemy.id) * .06;
      context.strokeStyle = guardian.affix === "warded" ? `rgba(112, 197, 221, ${pulse})` : `rgba(115, 196, 143, ${pulse})`;
      context.beginPath(); context.moveTo(guardian.x, guardian.y); context.lineTo(enemy.x, enemy.y); context.stroke();
    }
    context.setLineDash([]);
    context.restore();
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

  function drawHazards() {
    for (const hazard of game.hazards) {
      if (hazard.kind === "游荡眼球") {
        context.save();
        context.translate(hazard.x, hazard.y);
        context.rotate(Math.atan2(hazard.vy, hazard.vx));
        context.fillStyle = "#e6d7c0";
        context.strokeStyle = "#432530";
        context.lineWidth = 4;
        context.beginPath(); context.ellipse(0, 0, 16, 12, 0, 0, TAU); context.fill(); context.stroke();
        drawEye(2, 0, 8, 3, 0, true);
        context.strokeStyle = "#9b3f51";
        context.lineWidth = 3;
        context.beginPath(); context.moveTo(-14, 1); context.quadraticCurveTo(-23, 8, -30, -1); context.stroke();
        context.restore();
        continue;
      }
      const fade = clamp(hazard.life / Math.min(.8, hazard.maxLife), 0, 1);
      const pulse = Math.sin(hazard.phase) * 3;
      const gradient = context.createRadialGradient(hazard.x, hazard.y, 5, hazard.x, hazard.y, hazard.radius + pulse);
      gradient.addColorStop(0, `rgba(111, 37, 38, ${.42 * fade})`);
      gradient.addColorStop(.68, `rgba(94, 40, 34, ${.3 * fade})`);
      gradient.addColorStop(1, "rgba(67, 23, 28, 0)");
      context.fillStyle = gradient;
      context.beginPath(); context.arc(hazard.x, hazard.y, hazard.radius + pulse, 0, TAU); context.fill();
      context.strokeStyle = `rgba(229, 92, 60, ${.38 * fade})`;
      context.lineWidth = 2;
      context.beginPath(); context.arc(hazard.x, hazard.y, hazard.radius * .84 + pulse, 0, TAU); context.stroke();
      context.fillStyle = `rgba(53, 21, 23, ${.42 * fade})`;
      for (let index = 0; index < 5; index += 1) {
        const angle = hazard.phase * .2 + index / 5 * TAU;
        context.beginPath();
        context.arc(hazard.x + Math.cos(angle) * hazard.radius * .48, hazard.y + Math.sin(angle) * hazard.radius * .34, 4 + index % 2 * 2, 0, TAU);
        context.fill();
      }
    }
  }

  function drawGrunt(enemy) {
    const gait = Math.sin(enemy.phase * 6);
    drawLimb(-13, 6, -22, 16 + gait * 4, 7, "#873b42");
    drawLimb(-7, -7, -19, -16 - gait * 3, 6, "#873b42");
    context.strokeStyle = "#3a2028"; context.lineWidth = 5;
    context.beginPath(); context.moveTo(-22, 0); context.quadraticCurveTo(-31, -7, -37, 2); context.stroke();
    drawLayeredEllipse(-3, 0, 22, 17, .08, enemy.flash > 0 ? "#fff" : "#a8444c", "#321c23", "#f58f79");
    drawFleshTexture(19, enemy.id * 7, "#501e2a");
    context.fillStyle = "#5b252f"; context.beginPath(); context.moveTo(-17, -13); context.lineTo(-5, -24); context.lineTo(2, -14); context.closePath(); context.fill();
    drawBonePlate(-10, -3, 12, 20, -.35, true, "#bda37c");
    drawRimmedEye(5, -6, 6, 4, 2, 0, "#a9283f");
    drawMaw(6, 7, 9, 5, 4, 0, .75);
    context.fillStyle = "#22191d"; context.strokeStyle = "#151014"; context.lineWidth = 3;
    roundedRect(13, -6, 27, 12, 4); context.fill(); context.stroke();
    context.fillStyle = "#b58445"; context.beginPath(); context.moveTo(35, -4); context.lineTo(45, -2); context.lineTo(45, 3); context.lineTo(35, 5); context.closePath(); context.fill();
    context.strokeStyle = "#d57d4b"; context.lineWidth = 2; context.beginPath(); context.moveTo(17, -2); context.lineTo(34, -2); context.stroke();
  }

  function drawTurret(enemy) {
    const pulse = 1 + Math.sin(enemy.phase * 4) * .06;
    context.fillStyle = "#493329"; context.strokeStyle = "#24191b"; context.lineWidth = 4;
    for (let root = 0; root < 4; root += 1) {
      const angle = root / 4 * TAU + .35;
      context.beginPath(); context.moveTo(Math.cos(angle) * 12, Math.sin(angle) * 12); context.quadraticCurveTo(Math.cos(angle + .25) * 25, Math.sin(angle + .25) * 25, Math.cos(angle) * 35, Math.sin(angle) * 35); context.lineTo(Math.cos(angle + .18) * 28, Math.sin(angle + .18) * 28); context.closePath(); context.fill(); context.stroke();
    }
    context.save(); context.rotate(enemy.phase * .35);
    for (let plate = 0; plate < 5; plate += 1) { const angle = plate / 5 * TAU; drawBonePlate(Math.cos(angle) * 18, Math.sin(angle) * 18, 12, 19, angle, false, "#9a7148"); }
    context.restore();
    drawLayeredEllipse(0, 0, 17 * pulse, 16 / pulse, 0, enemy.flash > 0 ? "#fff" : "#6d4438", "#26191d", "#d18b62");
    drawRimmedEye(0, 0, 9, 8, 2, 0, "#c8903f", "#e8d7a4");
    context.fillStyle = "#20161a"; context.strokeStyle = "#161015"; context.lineWidth = 3;
    roundedRect(10, -8, 39, 16, 6); context.fill(); context.stroke();
    context.fillStyle = "#bd8a4b"; roundedRect(39, -5, 14, 10, 3); context.fill(); context.stroke();
    context.fillStyle = "#f2ce72"; context.beginPath(); context.arc(45, 0, 2.5, 0, TAU); context.fill();
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
    const stride = Math.sin(enemy.phase * 8) * (enemy.charge > 0 ? 6 : 2);
    for (const side of [-1, 1]) {
      drawLimb(-10, side * 9, -22 + stride, side * 20, 8, "#685839");
      drawBonePlate(-20, side * 20, 13, 10, side * .25, false, "#88754a");
    }
    drawLayeredEllipse(-2, 0, 27, 17, 0, enemy.flash > 0 ? "#fff" : enemy.charge > 0 ? "#c76b3f" : "#77663f", "#2c221d", "#c3a767");
    for (const side of [-1, 1]) drawBonePlate(-4, side * 13, 25, 11, side * .18, false, "#a08b5a");
    context.fillStyle = "#c7b278"; context.strokeStyle = "#34271f"; context.lineWidth = 4;
    context.beginPath(); context.moveTo(7, -15); context.quadraticCurveTo(28, -15, 43, 0); context.quadraticCurveTo(28, 15, 7, 15); context.lineTo(17, 0); context.closePath(); context.fill(); context.stroke();
    drawFang(28, -7, 25, 8, -Math.PI / 2 + .35, "#e5d49d");
    drawFang(28, 7, 25, 8, -Math.PI / 2 - .35, "#e5d49d");
    drawRimmedEye(12, 0, 6, 5, 2, 0, "#c44932", "#e2d2a8");
    context.strokeStyle = "#4b3d28"; context.lineWidth = 2; context.beginPath(); context.moveTo(-20, 0); context.lineTo(8, 0); context.stroke();
  }

  function drawBat(enemy) {
    const flap = Math.sin(enemy.phase * 7) * 9;
    context.fillStyle = enemy.flash > 0 ? "#fff" : "#62455f"; context.strokeStyle = "#251a28"; context.lineWidth = 4;
    for (const side of [-1, 1]) {
      context.beginPath(); context.moveTo(side * 3, -2); context.quadraticCurveTo(side * 17, -22 - flap, side * 39, -14 - flap * .35); context.lineTo(side * 31, -1); context.lineTo(side * 37, 10); context.lineTo(side * 21, 7); context.lineTo(side * 13, 18); context.quadraticCurveTo(side * 10, 7, side * 3, 4); context.closePath(); context.fill(); context.stroke();
      context.strokeStyle = "#a3799e"; context.lineWidth = 2;
      context.beginPath(); context.moveTo(side * 5, 0); context.lineTo(side * 31, -10 - flap * .3); context.moveTo(side * 12, 5); context.lineTo(side * 29, 6); context.stroke();
    }
    drawLayeredEllipse(0, 2, 13, 17, 0, enemy.flash > 0 ? "#fff" : "#805a72", "#261b28", "#b783a2");
    context.fillStyle = "#b89a6e"; context.strokeStyle = "#2e2325"; context.lineWidth = 2.5;
    for (const side of [-1, 1]) { context.beginPath(); context.moveTo(side * 8, -10); context.lineTo(side * 16, -25); context.lineTo(side * 2, -16); context.closePath(); context.fill(); context.stroke(); }
    drawRimmedEye(-5, -2, 4, 3, 1, 0, "#b43b4d"); drawRimmedEye(5, -2, 4, 3, 1, 0, "#b43b4d");
    drawMaw(0, 8, 6, 4, 3, 0, .9);
  }

  function drawSplitter(enemy) {
    const pulse = Math.sin(enemy.phase * 5) * 2;
    context.strokeStyle = "#2a2d20"; context.lineWidth = 4;
    for (let pod = 0; pod < 3; pod += 1) {
      const angle = pod / 3 * TAU + .4;
      const x = Math.cos(angle) * 14;
      const y = Math.sin(angle) * 12;
      drawLayeredEllipse(x, y, 13 + pulse * .3, 15 - pulse * .2, angle, enemy.flash > 0 ? "#fff" : pod === 1 ? "#6d8c58" : "#58734e", "#283021", "#b2cf82");
      context.fillStyle = "#b3d486"; context.globalAlpha = .42; context.beginPath(); context.arc(x - 3, y - 4, 4, 0, TAU); context.fill(); context.globalAlpha = 1;
    }
    context.fillStyle = "#34402c"; context.beginPath(); context.arc(0, 0, 10, 0, TAU); context.fill();
    drawMaw(2, 1, 8, 7, 5, 0, .8);
    for (let thorn = 0; thorn < 6; thorn += 1) { const angle = thorn / 6 * TAU; context.fillStyle = "#8eaa67"; context.beginPath(); context.moveTo(Math.cos(angle - .12) * 20, Math.sin(angle - .12) * 20); context.lineTo(Math.cos(angle) * 29, Math.sin(angle) * 29); context.lineTo(Math.cos(angle + .12) * 20, Math.sin(angle + .12) * 20); context.closePath(); context.fill(); }
  }

  function drawLeech(enemy) {
    const wiggle = Math.sin(enemy.phase * 7) * 5;
    for (let segment = 4; segment >= 0; segment -= 1) {
      const x = -17 + segment * 8;
      const y = Math.sin(enemy.phase * 7 + segment * .8) * 4;
      drawChitinSegment(x, y, 8 + segment * .45, 7, segment % 2 ? .18 : -.18, enemy.flash > 0 ? "#fff" : `rgb(${138 + segment * 7}, ${45 + segment * 3}, ${61 + segment * 4})`, "#d87b79");
    }
    context.fillStyle = "#29151c"; context.strokeStyle = "#421d29"; context.lineWidth = 3;
    context.beginPath(); context.ellipse(24, 0, 10, 9, 0, 0, TAU); context.fill(); context.stroke();
    for (let tooth = 0; tooth < 6; tooth += 1) { const angle = tooth / 6 * TAU; drawFang(24 + Math.cos(angle) * 6, Math.sin(angle) * 5, 6, 3.5, angle - Math.PI / 2); }
    context.fillStyle = "#b23c53"; context.beginPath(); context.arc(24, 0, 3, 0, TAU); context.fill();
    drawVein(-17, wiggle, -5, -8, 17, 0, "#e16d72", 2);
  }

  function drawCultist(enemy) {
    context.rotate(-enemy.angle);
    const sway = Math.sin(enemy.phase * 3) * 2;
    context.fillStyle = enemy.flash > 0 ? "#fff" : "#433250"; context.strokeStyle = "#221824"; context.lineWidth = 4;
    context.beginPath(); context.moveTo(0, -29); context.quadraticCurveTo(-25, -12, -20, 23); context.lineTo(-7, 18); context.lineTo(0, 29); context.lineTo(8, 18); context.lineTo(21, 23); context.quadraticCurveTo(25, -11, 0, -29); context.closePath(); context.fill(); context.stroke();
    context.fillStyle = "#17131b"; context.beginPath(); context.ellipse(0, -8, 13, 12, 0, 0, TAU); context.fill();
    drawRimmedEye(0, -8, 7, 5, 2, 0, "#8f65bc", "#d9c8e9");
    context.strokeStyle = "#b99bd3"; context.lineWidth = 2.5;
    context.beginPath(); context.arc(0, 11, 7, 0, TAU); context.moveTo(-6, 11); context.lineTo(6, 11); context.moveTo(0, 5); context.lineTo(0, 18); context.stroke();
    for (const side of [-1, 1]) {
      drawLimb(side * 10, 1, side * 24, 7 + sway * side, 5, "#745d87");
      context.fillStyle = "#b6a2c8"; context.beginPath(); context.arc(side * 26, 8 + sway * side, 4, 0, TAU); context.fill();
      context.strokeStyle = "#a77bd0"; context.globalAlpha = .5; context.beginPath(); context.arc(side * 27, 8 + sway * side, 8, 0, TAU); context.stroke(); context.globalAlpha = 1;
    }
  }

  function drawBomber(enemy) {
    context.rotate(-enemy.angle);
    const fusePulse = .5 + Math.sin(enemy.phase * 10) * .5;
    drawLimb(-10, 11, -17, 24, 8, "#74523e");
    drawLimb(8, 11, 14, 23, 8, "#74523e");
    context.fillStyle = "#2a2022"; context.strokeStyle = "#171215"; context.lineWidth = 4;
    context.beginPath(); context.arc(-16, -1, 18, 0, TAU); context.fill(); context.stroke();
    context.strokeStyle = "#b56845"; context.lineWidth = 3; context.beginPath(); context.arc(-16, -1, 12, 0, TAU); context.stroke();
    drawLayeredEllipse(3, 2, 23, 20, .05, enemy.flash > 0 ? "#fff" : "#76503e", "#291b1d", "#bd8261");
    drawBonePlate(1, -6, 19, 16, -.1, true, "#a48762");
    drawRimmedEye(10, -7, 5, 4, 2, 0, "#c84835", "#dfc99e");
    context.fillStyle = "#25161b"; context.beginPath(); context.ellipse(13, 8, 8, 6, 0, 0, TAU); context.fill();
    context.fillStyle = "#d8b059"; context.beginPath(); context.arc(-16, -1, 7, 0, TAU); context.fill();
    context.fillStyle = "#4a2b2d"; context.beginPath(); context.arc(-14, -1, 3, 0, TAU); context.fill();
    drawVein(-12, -15, -24, -25, -10, -35, "#d25b3f", 2.5);
    context.fillStyle = fusePulse > .45 ? "#fff0a1" : "#ef7046"; context.shadowColor = "#ff5b38"; context.shadowBlur = 10;
    context.beginPath(); context.arc(-10, -35, 4 + fusePulse * 2, 0, TAU); context.fill(); context.shadowBlur = 0;
  }

  function drawBossSpines(count, radius, length, fill, rotation = 0) {
    context.save();
    context.rotate(rotation);
    context.fillStyle = fill;
    context.strokeStyle = "#2a1c22";
    context.lineWidth = 2.5;
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * TAU;
      context.beginPath();
      context.moveTo(Math.cos(angle - .13) * radius, Math.sin(angle - .13) * radius);
      context.lineTo(Math.cos(angle) * (radius + length * (index % 2 ? .78 : 1)), Math.sin(angle) * (radius + length * (index % 2 ? .78 : 1)));
      context.lineTo(Math.cos(angle + .13) * radius, Math.sin(angle + .13) * radius);
      context.closePath(); context.fill(); context.stroke();
    }
    context.restore();
  }

  function drawCoilForm(enemy, stage) {
    const flesh = enemy.flash > 0 ? "#fff" : stage === 1 ? "#8c6846" : stage === 2 ? "#766348" : "#67564d";
    if (stage === 1) {
      for (let segment = 5; segment >= 1; segment -= 1) {
        const wave = Math.sin(enemy.phase * 4 + segment * .8) * 7;
        drawChitinSegment(-segment * 19, wave, 17 - segment * .6, 14 - segment * .45, wave * .01, flesh, "#b7945d");
      }
      drawLayeredEllipse(3, 0, 30, 24, 0, flesh, "#30231f", "#d4ab71");
      drawBonePlate(-5, -17, 20, 12, -.2, false, "#b99a68");
      drawRimmedEye(9, -8, 7, 5, 2, 0, "#879f3b");
      drawMaw(20, 7, 12, 8, 5, .04, .85);
      for (const side of [-1, 1]) drawFang(30, side * 7, 16, 6, -Math.PI / 2 + side * .42);
    } else if (stage === 2) {
      context.save(); context.globalAlpha = .26; context.strokeStyle = "#d7c28d"; context.lineWidth = 4;
      context.beginPath(); context.moveTo(-108, 18); context.bezierCurveTo(-61, -32, -23, 30, 12, -13); context.stroke();
      for (let ring = 0; ring < 6; ring += 1) { context.beginPath(); context.ellipse(-96 + ring * 19, Math.sin(enemy.phase * 4 + ring) * 12 + 12, 15, 11, 0, 0, TAU); context.stroke(); }
      context.restore();
      for (let segment = 6; segment >= 1; segment -= 1) {
        const wave = Math.sin(enemy.phase * 4.6 + segment * .72) * 12;
        drawChitinSegment(-segment * 20, wave, 18, 14, wave * .012, flesh, "#a7b466", segment % 2 === 0);
        if (segment % 2 === 0) drawBonePlate(-segment * 20, wave - 15, 11, 19, 0, true, "#b9ae7a");
      }
      drawLayeredEllipse(7, 0, 34, 27, 0, flesh, "#2d2420", "#bac77a");
      drawRimmedEye(9, -11, 8, 5, 2, 0, "#759f31");
      drawMaw(23, 7, 15, 10, 7, 0, 1);
      drawFang(26, -13, 22, 7, -Math.PI / 2 + .2); drawFang(26, 14, 22, 7, -Math.PI / 2 - .2);
    } else {
      for (let segment = 6; segment >= 2; segment -= 1) {
        const wave = Math.sin(enemy.phase * 6 + segment) * 14;
        drawChitinSegment(-segment * 18, wave, 17, 12, segment % 2 ? .28 : -.28, flesh, "#d1c18d", true);
        drawBonePlate(-segment * 18, wave - 14, 12, 21, segment % 2 ? -.2 : .2, true, "#c9bd91");
      }
      context.fillStyle = "#3c2529"; context.strokeStyle = "#23191d"; context.lineWidth = 5;
      context.beginPath(); context.moveTo(-24, -20); context.lineTo(2, -32); context.lineTo(29, -21); context.lineTo(17, 0); context.lineTo(29, 21); context.lineTo(1, 33); context.lineTo(-25, 19); context.lineTo(-10, 0); context.closePath(); context.fill(); context.stroke();
      for (const side of [-1, 0, 1]) {
        const y = side * 24;
        drawLayeredEllipse(28, y, 25, 17, side * .28, flesh, "#2b2020", "#d2c68d");
        drawRimmedEye(32, y - 5, 6, 4, 2, 0, "#7fa530");
        drawMaw(43, y + 5, 11, 6, 4, side * .18, 1);
      }
      drawBossSpines(8, 31, 15, "#c8bb8a", enemy.phase * .08);
    }
  }

  function drawHopperForm(enemy, stage) {
    const flesh = enemy.flash > 0 ? "#fff" : stage === 1 ? "#a25755" : stage === 2 ? "#95504e" : "#873f45";
    context.rotate(-enemy.angle);
    if (stage === 1) {
      for (const side of [-1, 1]) {
        drawLimb(side * 18, 12, side * 36, 31, 13, "#7d4547");
        drawLayeredEllipse(side * 39, 32, 17, 9, side * .12, flesh, "#321e24", "#df8373");
      }
      drawLayeredEllipse(0, 5, 39, 31, 0, flesh, "#382028", "#df7f72");
      drawLayeredEllipse(-15, -23, 16, 13, -.2, flesh, "#382028", "#e09a82");
      drawLayeredEllipse(16, -23, 16, 13, .2, flesh, "#382028", "#e09a82");
      drawRimmedEye(-15, -25, 7, 6, 0, 1, "#ca563d"); drawRimmedEye(16, -25, 7, 6, 0, 1, "#ca563d");
      drawMaw(0, 10, 22, 11, 8, 0, .65);
    } else if (stage === 2) {
      for (const side of [-1, 1]) {
        drawLimb(side * 16, 12, side * 30, 48, 13, "#783e43");
        drawLimb(side * 30, 48, side * 53, 56, 11, "#6c3a3d");
        drawBonePlate(side * 31, 42, 17, 22, side * .28, true, "#a77d63");
      }
      drawLayeredEllipse(0, -3, 33, 43, 0, flesh, "#351d25", "#db766d");
      context.fillStyle = "#5d2732"; context.beginPath(); context.ellipse(0, 14, 25, 18, 0, 0, TAU); context.fill();
      drawRimmedEye(-13, -22, 8, 6, 1, 1, "#df6e3f"); drawRimmedEye(14, -22, 8, 6, -1, 1, "#df6e3f");
      drawMaw(0, 10, 21, 16, 10, 0, 1.1);
      for (const side of [-1, 1]) drawVein(side * 7, -36, side * 20, -48, side * 17, -58, "#dd765f", 3);
    } else {
      for (const side of [-1, 1]) {
        drawLimb(side * 20, 9, side * 43, 48, 18, "#6e323b");
        drawLimb(side * 43, 48, side * 67, 57, 15, "#5b2b33");
        drawBonePlate(side * 45, 45, 24, 29, side * .35, true, "#b38b6d");
      }
      context.fillStyle = flesh; context.strokeStyle = "#351b24"; context.lineWidth = 6;
      context.beginPath(); context.moveTo(-43, -28); context.quadraticCurveTo(0, -58, 43, -28); context.lineTo(35, 28); context.lineTo(0, 48); context.lineTo(-36, 27); context.closePath(); context.fill(); context.stroke();
      context.strokeStyle = "#4f242e"; context.lineWidth = 4; context.beginPath(); context.moveTo(-31, -23); context.lineTo(-8, -4); context.lineTo(-19, 23); context.moveTo(31, -23); context.lineTo(9, -3); context.lineTo(21, 23); context.stroke();
      drawRimmedEye(-18, -21, 9, 6, 1, 1, "#ff7145"); drawRimmedEye(18, -21, 9, 6, -1, 1, "#ff7145");
      drawMaw(0, 14, 28, 18, 12, 0, 1.18);
      drawBossSpines(7, 42, 18, "#b68569", Math.PI / 2);
    }
  }

  function drawDevourerForm(enemy, stage) {
    const flesh = enemy.flash > 0 ? "#fff" : stage === 1 ? "#835044" : stage === 2 ? "#713b3b" : "#612b35";
    if (stage === 1) {
      for (let segment = 4; segment >= 1; segment -= 1) {
        const y = Math.sin(enemy.phase * 3.5 + segment) * 7;
        drawLayeredEllipse(-segment * 20, y, 19, 15, y * .015, flesh, "#301d1d", "#c17763");
        drawFang(-segment * 20, y - 13, 9, 5, Math.PI, "#cdbb88");
      }
      drawLayeredEllipse(4, 0, 34, 28, 0, flesh, "#321c20", "#d08a71");
      drawRimmedEye(-2, -11, 7, 5, 2, 1, "#9e4137");
      drawMaw(22, 3, 18, 20, 9, 0, 1);
    } else if (stage === 2) {
      for (const side of [-1, 1]) {
        drawVein(-20, side * 10, -52, side * 34, -76, side * 24, "#9e4e45", 8);
        drawLayeredEllipse(-69, side * 24, 18, 13, side * .2, flesh, "#301c20", "#b76b5d");
      }
      drawLayeredEllipse(-14, 0, 37, 34, 0, flesh, "#301a20", "#bd6b5b");
      context.fillStyle = "#4b232a"; context.beginPath(); context.arc(9, 0, 36, 0, TAU); context.fill();
      drawMaw(12, 0, 31, 31, 13, 0, 1);
      context.fillStyle = "#d79772"; context.globalAlpha = .45; context.beginPath(); context.arc(-23, -12, 10, 0, TAU); context.fill(); context.globalAlpha = 1;
      drawRimmedEye(-23, -13, 7, 5, 2, 0, "#be523b");
    } else {
      context.fillStyle = flesh; context.strokeStyle = "#2d1820"; context.lineWidth = 5;
      for (let petal = 0; petal < 4; petal += 1) {
        const angle = petal / 4 * TAU;
        context.save(); context.rotate(angle);
        context.beginPath(); context.moveTo(4, -9); context.quadraticCurveTo(52, -41, 62, 0); context.quadraticCurveTo(48, 38, 4, 9); context.closePath(); context.fill(); context.stroke();
        for (let tooth = 0; tooth < 5; tooth += 1) drawFang(13 + tooth * 9, -7, 12, 5, Math.PI / 2, "#e4d19e");
        context.restore();
      }
      context.fillStyle = "#21131a"; context.beginPath(); context.arc(0, 0, 25, 0, TAU); context.fill();
      context.fillStyle = "#dc5264"; context.shadowColor = "#ff6a7d"; context.shadowBlur = 16; context.beginPath(); context.arc(0, 0, 9 + Math.sin(enemy.phase * 5) * 2, 0, TAU); context.fill(); context.shadowBlur = 0;
      for (let eye = 0; eye < 4; eye += 1) { const angle = eye / 4 * TAU + Math.PI / 4; drawRimmedEye(Math.cos(angle) * 42, Math.sin(angle) * 42, 7, 5, Math.cos(angle) * 2, Math.sin(angle) * 2, "#c44f45"); }
    }
  }

  function drawIdolForm(enemy, stage) {
    context.rotate(-enemy.angle);
    if (stage === 1) {
      context.fillStyle = enemy.flash > 0 ? "#fff" : "#65584a"; context.strokeStyle = "#28221f"; context.lineWidth = 6;
      context.beginPath(); context.moveTo(-29, 38); context.lineTo(-37, -21); context.lineTo(-16, -47); context.lineTo(15, -47); context.lineTo(38, -20); context.lineTo(28, 38); context.closePath(); context.fill(); context.stroke();
      drawBonePlate(0, -28, 38, 24, 0, true, "#95836b");
      context.fillStyle = "#211a1a"; roundedRect(-22, -10, 44, 15, 6); context.fill();
      drawRimmedEye(0, -3, 13, 6, 0, 1, "#8f6847", "#d0c5a4");
      context.strokeStyle = "#a68e6c"; context.lineWidth = 3; context.beginPath(); context.moveTo(-18, 17); context.lineTo(0, 31); context.lineTo(19, 17); context.stroke();
    } else if (stage === 2) {
      context.fillStyle = "#554638"; context.strokeStyle = "#271f1d"; context.lineWidth = 6;
      context.beginPath(); context.moveTo(-45, 35); context.lineTo(-34, -21); context.lineTo(0, -49); context.lineTo(35, -20); context.lineTo(46, 35); context.closePath(); context.fill(); context.stroke();
      for (let egg = 0; egg < 6; egg += 1) {
        const angle = egg / 6 * TAU + .2;
        drawLayeredEllipse(Math.cos(angle) * 35, Math.sin(angle) * 30 + 4, 13, 17, angle, enemy.flash > 0 ? "#fff" : "#795b72", "#342331", "#c598c1");
        drawRimmedEye(Math.cos(angle) * 35, Math.sin(angle) * 30 + 4, 4, 3, 0, 0, "#8f63b1", "#dbcce3");
      }
      context.fillStyle = "#21191f"; context.beginPath(); context.arc(0, 1, 23, 0, TAU); context.fill();
      drawRimmedEye(0, 0, 14, 9, 0, 1, "#8b62b5", "#d9c9df");
      drawVein(0, 13, -5, 31, 0, 47, "#9a6c8e", 5);
    } else {
      context.fillStyle = enemy.flash > 0 ? "#fff" : "#6d4668"; context.strokeStyle = "#2b1d2b"; context.lineWidth = 5;
      for (let petal = 0; petal < 7; petal += 1) {
        const angle = petal / 7 * TAU - Math.PI / 2;
        context.save(); context.rotate(angle);
        context.beginPath(); context.moveTo(-10, 5); context.quadraticCurveTo(-19, -39, 0, -66); context.quadraticCurveTo(21, -39, 10, 5); context.closePath(); context.fill(); context.stroke();
        drawRimmedEye(0, -39, 6, 4, 0, -1, "#a978c9", "#e0d1e5");
        context.restore();
      }
      context.fillStyle = "#251726"; context.beginPath(); context.arc(0, 0, 30, 0, TAU); context.fill();
      drawRimmedEye(0, 0, 20, 13, 0, 1, "#a06ec4", "#e3d8e6");
      context.strokeStyle = "#d2a9e7"; context.globalAlpha = .55; context.lineWidth = 3; context.beginPath(); context.arc(0, 0, 39 + Math.sin(enemy.phase * 3) * 3, 0, TAU); context.stroke(); context.globalAlpha = 1;
    }
  }

  function drawPeepForm(enemy, stage) {
    const flesh = enemy.flash > 0 ? "#fff" : stage === 1 ? "#a86e52" : stage === 2 ? "#895247" : "#673843";
    context.rotate(-enemy.angle);
    if (stage === 1) {
      drawLayeredEllipse(0, 2, 39, 34, 0, flesh, "#3a2426", "#df9b75");
      for (const side of [-1, 1]) {
        drawLayeredEllipse(side * 25, -18, 16, 14, side * .18, "#7e4143", "#392129", "#d97f70");
        drawRimmedEye(side * 25, -19, 11, 8, side, 1, "#3e8da8", "#e7dfc9");
        drawVein(side * 22, -7, side * 27, 9, side * 20, 26, "#c05b5d", 3);
      }
      drawMaw(0, 16, 15, 8, 6, 0, .8);
      context.fillStyle = "#72c8da"; context.globalAlpha = .7;
      for (const side of [-1, 1]) { context.beginPath(); context.ellipse(side * 28, 3, 4, 9 + Math.sin(enemy.phase * 5 + side) * 2, side * .08, 0, TAU); context.fill(); }
      context.globalAlpha = 1;
    } else if (stage === 2) {
      context.fillStyle = flesh; context.strokeStyle = "#342027"; context.lineWidth = 6;
      context.beginPath(); context.moveTo(-40, -15); context.quadraticCurveTo(-31, -44, 0, -42); context.quadraticCurveTo(34, -44, 42, -13); context.lineTo(34, 34); context.lineTo(0, 48); context.lineTo(-35, 33); context.closePath(); context.fill(); context.stroke();
      for (const side of [-1, 1]) {
        context.fillStyle = "#24161d"; context.beginPath(); context.ellipse(side * 18, -11, 13, 12, 0, 0, TAU); context.fill();
        drawVein(side * 16, 0, side * 32, 22, side * 45, 34, "#bb5159", 4);
        context.fillStyle = "#65cde2"; context.globalAlpha = .7; context.beginPath(); context.ellipse(side * 45, 37, 6, 12, side * .15, 0, TAU); context.fill(); context.globalAlpha = 1;
      }
      drawMaw(0, 18, 18, 12, 7, 0, .9);
      drawBonePlate(0, -33, 30, 15, 0, true, "#b99e80");
    } else {
      context.fillStyle = "#422632"; context.strokeStyle = "#281a22"; context.lineWidth = 6;
      context.beginPath(); context.arc(0, 0, 35, 0, TAU); context.fill(); context.stroke();
      drawBossSpines(9, 34, 21, "#925363", enemy.phase * .12);
      context.fillStyle = "#17131b"; context.beginPath(); context.arc(0, 0, 21, 0, TAU); context.fill();
      drawRimmedEye(0, 0, 15, 12, 0, 1, "#45a9c7", "#dff5f1");
      for (let eye = 0; eye < 4; eye += 1) {
        const angle = enemy.phase * .55 + eye / 4 * TAU;
        const x = Math.cos(angle) * 61;
        const y = Math.sin(angle) * 46;
        drawVein(Math.cos(angle) * 31, Math.sin(angle) * 25, Math.cos(angle + .25) * 46, Math.sin(angle + .25) * 38, x, y, "#a94359", 3);
        drawRimmedEye(x, y, 12, 8, -Math.cos(angle) * 2, -Math.sin(angle) * 2, "#3a9fbd", "#e6eee0");
      }
    }
  }

  function drawMatronForm(enemy, stage) {
    context.rotate(-enemy.angle);
    const flesh = enemy.flash > 0 ? "#fff" : stage === 1 ? "#8e4052" : stage === 2 ? "#7a344a" : "#65243f";
    if (stage === 1) {
      context.fillStyle = "#37232a"; context.strokeStyle = "#1f161b"; context.lineWidth = 7;
      roundedRect(-43, -55, 86, 110, 17); context.fill(); context.stroke();
      context.strokeStyle = "#7c3a4a"; context.lineWidth = 8; roundedRect(-32, -43, 64, 87, 14); context.stroke();
      drawLayeredEllipse(0, 0, 28, 36, 0, flesh, "#351c28", "#ce6a7c");
      drawRimmedEye(0, -9, 14, 10, 0, 1, "#b83257", "#e2d4c5");
      drawMaw(0, 18, 15, 9, 6, 0, .8);
      context.fillStyle = "#b88d72"; for (let nail = -2; nail <= 2; nail += 1) { context.beginPath(); context.arc(nail * 15, -50, 3, 0, TAU); context.fill(); }
    } else if (stage === 2) {
      context.fillStyle = "#412533"; context.strokeStyle = "#21151c"; context.lineWidth = 6;
      context.beginPath(); context.moveTo(-38, -55); context.lineTo(37, -55); context.lineTo(48, 52); context.lineTo(0, 66); context.lineTo(-49, 52); context.closePath(); context.fill(); context.stroke();
      drawLayeredEllipse(0, -8, 31, 38, 0, flesh, "#351925", "#cf627b");
      drawRimmedEye(0, -20, 15, 11, 0, 1, "#c0345b", "#e4d2c4");
      drawMaw(0, 14, 17, 12, 7, 0, 1);
      for (const side of [-1, 1]) {
        drawLimb(side * 31, -6, side * 62, 12, 18, flesh);
        drawLayeredEllipse(side * 67, 14, 20, 27, side * .2, flesh, "#351925", "#d5657b");
        for (let finger = -2; finger <= 2; finger += 1) drawLimb(side * 73, 5 + finger * 6, side * (88 + Math.abs(finger) * 2), 5 + finger * 8, 4, "#a94b64");
      }
      drawVein(-20, 36, 0, 50, 20, 35, "#ba4965", 4);
    } else {
      context.fillStyle = "#321b29"; context.strokeStyle = "#1c1219"; context.lineWidth = 7;
      context.beginPath(); context.moveTo(-42, -64); context.lineTo(42, -64); context.lineTo(57, 45); context.lineTo(22, 65); context.lineTo(0, 54); context.lineTo(-23, 66); context.lineTo(-58, 44); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = flesh; context.beginPath(); context.ellipse(0, -11, 36, 43, 0, 0, TAU); context.fill(); context.stroke();
      drawRimmedEye(0, -24, 18, 12, 0, 1, "#da2e60", "#f0d8cb");
      drawMaw(0, 16, 21, 15, 9, 0, 1.08);
      const handPositions = [[-48, -22, -.3], [48, -22, .3], [-55, 35, .38], [55, 35, -.38]];
      for (const [x, y, rotation] of handPositions) {
        drawLimb(x * .55, y * .55, x, y, 17, flesh);
        drawLayeredEllipse(x, y, 22, 28, rotation, flesh, "#351723", "#df617d");
        for (let finger = -2; finger <= 2; finger += 1) drawLimb(x + Math.sign(x) * 7, y + finger * 5, x + Math.sign(x) * (25 + Math.abs(finger) * 3), y + finger * 8, 4, "#9d3c5b");
      }
      context.strokeStyle = "#ed6f92"; context.globalAlpha = .5; context.lineWidth = 3; context.beginPath(); context.arc(0, -8, 48 + Math.sin(enemy.phase * 4) * 3, 0, TAU); context.stroke(); context.globalAlpha = 1;
    }
  }

  function drawHollowForm(enemy, stage) {
    const bone = enemy.flash > 0 ? "#fff" : stage === 1 ? "#a99bbb" : stage === 2 ? "#9180a8" : "#75648e";
    if (stage === 1) {
      for (let segment = 6; segment >= 1; segment -= 1) {
        const y = Math.sin(enemy.phase * 5 + segment * .8) * 8;
        drawBonePlate(-segment * 18, y, 23, 18, y * .018, false, bone);
        context.fillStyle = "#4a3d59"; context.beginPath(); context.arc(-segment * 18, y, 5, 0, TAU); context.fill();
      }
      drawLayeredEllipse(5, 0, 31, 24, 0, "#5d4d6e", "#292132", "#a994bd");
      drawBonePlate(11, -5, 32, 29, 0, false, bone);
      drawRimmedEye(14, -8, 7, 5, 2, 0, "#8f72b6", "#e0d8d8");
      drawMaw(22, 7, 13, 8, 6, 0, .8);
    } else if (stage === 2) {
      const fragments = [[-94, 11], [-64, -8], [-28, 10], [16, -4]];
      fragments.forEach(([x, y], index) => {
        context.save(); context.globalAlpha = index % 2 ? .7 : 1;
        drawBonePlate(x, y + Math.sin(enemy.phase * 6 + index) * 5, 29 - index * 2, 21, index % 2 ? .3 : -.25, true, bone);
        context.restore();
      });
      for (let link = 0; link < fragments.length - 1; link += 1) drawVein(fragments[link][0] + 12, fragments[link][1], (fragments[link][0] + fragments[link + 1][0]) / 2, link % 2 ? 20 : -20, fragments[link + 1][0] - 12, fragments[link + 1][1], "#8069a1", 3);
      drawLayeredEllipse(34, 0, 29, 25, 0, "#554263", "#281f31", "#9c83ba");
      drawBonePlate(39, -5, 31, 31, 0, true, bone);
      drawRimmedEye(42, -8, 7, 5, 2, 0, "#9975c9");
      drawMaw(52, 8, 12, 8, 5, 0, 1);
    } else {
      context.save(); context.globalAlpha = .24;
      for (const offset of [-1, 1]) {
        for (let segment = 5; segment >= 0; segment -= 1) drawBonePlate(-segment * 20, offset * 25 + Math.sin(enemy.phase * 8 + segment) * 9, 24, 17, offset * .2, true, "#9c88be");
      }
      context.restore();
      for (let segment = 6; segment >= 1; segment -= 1) {
        const y = Math.sin(enemy.phase * 8 + segment * .9) * 13;
        drawBonePlate(-segment * 18, y, 26, 20, segment % 2 ? .34 : -.34, true, bone);
        drawFang(-segment * 18, y - 13, 11, 5, Math.PI, "#d8cdea");
      }
      drawLayeredEllipse(10, 0, 34, 27, 0, "#4e385e", "#251b2d", "#a480c5");
      drawBossSpines(7, 30, 18, "#aa91ce", enemy.phase * .15);
      drawRimmedEye(19, -8, 9, 6, 2, 0, "#b180dc", "#ede4ef");
      drawMaw(29, 9, 15, 10, 7, 0, 1.05);
    }
  }

  function drawHeartForm(enemy, stage) {
    context.rotate(-enemy.angle);
    const beat = 1 + Math.max(0, Math.sin(enemy.phase * (stage + 3))) * (stage === 3 ? .12 : .06);
    context.scale(beat, beat);
    if (stage === 1) {
      context.fillStyle = "#49323a"; context.strokeStyle = "#25191e"; context.lineWidth = 6;
      context.beginPath(); context.ellipse(0, 2, 42, 50, 0, 0, TAU); context.fill(); context.stroke();
      for (const side of [-1, 1]) {
        for (let rib = 0; rib < 4; rib += 1) {
          context.strokeStyle = "#b7a482"; context.lineWidth = 5;
          context.beginPath(); context.moveTo(side * 5, -31 + rib * 17); context.quadraticCurveTo(side * (31 + rib * 2), -29 + rib * 15, side * 34, -10 + rib * 15); context.stroke();
        }
      }
      context.fillStyle = "#8e354b"; context.beginPath(); context.arc(-12, -6, 19, Math.PI, 0); context.arc(12, -6, 19, Math.PI, 0); context.lineTo(0, 31); context.closePath(); context.fill();
      drawRimmedEye(0, -7, 8, 6, 0, 1, "#bb3150", "#dfc8bc");
    } else if (stage === 2) {
      for (const [x, y, cx, cy] of [[-13,-28,-36,-53],[13,-28,37,-52],[-21,8,-55,24],[21,8,55,25]]) drawVein(x, y, cx, cy, cx * 1.25, cy * 1.2, "#b94a61", 6);
      context.fillStyle = enemy.flash > 0 ? "#fff" : "#a83d55"; context.strokeStyle = "#371c28"; context.lineWidth = 6;
      context.beginPath(); context.arc(-20, -9, 26, Math.PI, 0); context.arc(20, -9, 26, Math.PI, 0); context.lineTo(0, 46); context.closePath(); context.fill(); context.stroke();
      drawFleshTexture(42, enemy.id * 41, "#5b2033");
      drawVein(0, -34, -5, 5, 8, 31, "#e07884", 3);
      drawRimmedEye(-12, -10, 7, 5, 0, 1, "#d23657"); drawRimmedEye(13, -9, 7, 5, 0, 1, "#d23657");
      drawMaw(0, 17, 12, 7, 5, 0, .75);
    } else {
      for (let vein = 0; vein < 8; vein += 1) { const angle = vein / 8 * TAU; drawVein(Math.cos(angle) * 18, Math.sin(angle) * 18, Math.cos(angle + .25) * 46, Math.sin(angle + .25) * 46, Math.cos(angle) * 72, Math.sin(angle) * 72, "#dc496a", 5); }
      for (let lobe = 0; lobe < 4; lobe += 1) {
        const angle = lobe / 4 * TAU + Math.PI / 4;
        context.save(); context.rotate(angle);
        drawLayeredEllipse(0, -33, 23, 36, 0, enemy.flash > 0 ? "#fff" : lobe % 2 ? "#a42f4f" : "#be3857", "#341923", "#ed7584");
        drawMaw(0, -42, 10, 7, 4, 0, .8);
        context.restore();
      }
      context.fillStyle = "#21131a"; context.strokeStyle = "#4a1d2d"; context.lineWidth = 5; context.beginPath(); context.arc(0, 0, 25, 0, TAU); context.fill(); context.stroke();
      context.fillStyle = "#ff557b"; context.shadowColor = "#ff315f"; context.shadowBlur = 22; context.beginPath(); context.arc(0, 0, 12 + Math.sin(enemy.phase * 8) * 3, 0, TAU); context.fill(); context.shadowBlur = 0;
    }
  }

  function drawBloatForm(enemy, stage) {
    const flesh = enemy.flash > 0 ? "#fff" : stage === 1 ? "#703849" : stage === 2 ? "#642c40" : "#542037";
    if (stage === 1) {
      for (const side of [-1, 1]) {
        drawLimb(side * 15, 16, side * 31, 31, 11, "#59303d");
        drawLimb(side * 20, -9, side * 38, -18, 9, "#59303d");
      }
      drawLayeredEllipse(0, 4, 41, 33, -.05, flesh, "#301925", "#b35b6a");
      context.fillStyle = "#3b1b29"; context.beginPath(); context.ellipse(-13, -8, 11, 8, 0, 0, TAU); context.ellipse(13, -8, 11, 8, 0, 0, TAU); context.fill();
      drawMaw(2, 16, 17, 10, 7, 0, .8);
      context.fillStyle = "#6ca6a8"; context.globalAlpha = .45;
      for (const bubble of [[-28,-18,5],[24,-24,4],[34,4,6]]) { context.beginPath(); context.arc(...bubble, 0, TAU); context.fill(); }
      context.globalAlpha = 1;
    } else if (stage === 2) {
      context.fillStyle = flesh; context.strokeStyle = "#2e1722"; context.lineWidth = 6;
      context.beginPath(); context.moveTo(-39, -29); context.quadraticCurveTo(0, -52, 39, -28); context.lineTo(34, 39); context.lineTo(0, 50); context.lineTo(-35, 38); context.closePath(); context.fill(); context.stroke();
      for (const side of [-1, 1]) {
        drawVein(side * 13, -8, side * 32, -30, side * 53, -26, "#ad4054", 5);
        drawLayeredEllipse(side * 56, -27, 18, 13, side * .18, "#7b374c", "#321822", "#d76272");
        drawRimmedEye(side * 58, -27, 12, 8, -side * 2, 1, "#ce3d44", "#e4d7c7");
      }
      context.fillStyle = "#27151e"; context.beginPath(); context.ellipse(0, -7, 18, 13, 0, 0, TAU); context.fill();
      drawMaw(0, 19, 20, 13, 9, 0, 1);
      drawScar(-20, 14, 24, -.75, "#3d1723"); drawScar(21, 8, 21, .65, "#3d1723");
    } else {
      context.fillStyle = flesh; context.strokeStyle = "#29141f"; context.lineWidth = 7;
      context.beginPath(); context.moveTo(-45, -27); context.lineTo(-31, -53); context.lineTo(0, -43); context.lineTo(31, -54); context.lineTo(46, -25); context.lineTo(38, 43); context.lineTo(0, 56); context.lineTo(-39, 42); context.closePath(); context.fill(); context.stroke();
      drawBossSpines(8, 43, 15, "#a7455d", enemy.phase * .08);
      const eyes = [[0,-24],[-29,1],[29,1]];
      eyes.forEach(([x, y], index) => {
        drawRimmedEye(x, y, index === 0 ? 15 : 13, index === 0 ? 10 : 9, 0, 1, "#ef4b3f", "#f0ddc2");
        context.strokeStyle = "#ff755d"; context.globalAlpha = .45; context.lineWidth = 3; context.beginPath(); context.moveTo(x + 8, y); context.lineTo(x + 73, y); context.stroke(); context.globalAlpha = 1;
      });
      drawMaw(0, 27, 23, 14, 10, 0, 1.05);
      for (const side of [-1, 1]) drawVein(side * 17, 9, side * 40, 27, side * 57, 43, "#bc3657", 5);
    }
  }

  function drawBurrowForm(enemy, stage) {
    if (enemy.submerged) {
      context.fillStyle = "#21191c"; context.beginPath(); context.ellipse(0, 10, 58, 21, 0, 0, TAU); context.fill();
      context.strokeStyle = stage === 3 ? "#b2f2bd" : "#78b795"; context.lineWidth = 4; context.setLineDash([8, 7]);
      context.beginPath(); context.ellipse(0, 4, 38 + Math.sin(enemy.phase * 6) * 5, 17, 0, 0, TAU); context.stroke(); context.setLineDash([]);
      for (let shard = 0; shard < stage + 2; shard += 1) drawBonePlate(-24 + shard * 16, -6 - (shard % 2) * 8, 12, 17, shard % 2 ? .3 : -.3, true, "#739783");
      return;
    }
    const shell = enemy.flash > 0 ? "#fff" : stage === 1 ? "#587568" : stage === 2 ? "#4c6d61" : "#38594f";
    if (stage === 1) {
      for (const side of [-1, 1]) for (let leg = 0; leg < 3; leg += 1) drawLimb(-15 + leg * 18, side * 11, -24 + leg * 18, side * (25 + leg * 3), 8, "#456055");
      drawLayeredEllipse(0, 0, 49, 27, 0, shell, "#24302c", "#8db59b");
      for (let plate = 0; plate < 4; plate += 1) drawBonePlate(-28 + plate * 18, -8, 23, 28, plate % 2 ? .12 : -.12, false, "#668878");
      context.fillStyle = "#2a3732"; context.strokeStyle = "#1c2824"; context.lineWidth = 4; context.beginPath(); context.moveTo(31, -18); context.lineTo(55, 0); context.lineTo(31, 18); context.closePath(); context.fill(); context.stroke();
      drawRimmedEye(35, -5, 7, 5, 2, 0, "#63ad84", "#d5dfbf");
      for (const side of [-1, 1]) drawFang(50, side * 8, 17, 6, -Math.PI / 2 + side * .35, "#d6cda1");
    } else if (stage === 2) {
      for (let segment = 4; segment >= 0; segment -= 1) drawChitinSegment(-54 + segment * 19, Math.sin(enemy.phase * 5 + segment) * 5, 20, 17, segment % 2 ? .15 : -.15, shell, "#83b293", true);
      drawLayeredEllipse(37, 0, 32, 24, 0, shell, "#22302a", "#91c2a0");
      drawBonePlate(40, -7, 34, 28, 0, true, "#72957e");
      drawRimmedEye(47, -7, 8, 5, 2, 0, "#6ab88d", "#e0e3c7");
      drawMaw(57, 8, 13, 8, 6, 0, .8);
      context.strokeStyle = "#8ff0bd"; context.lineWidth = 6; context.shadowColor = "#6fe0a7"; context.shadowBlur = 12;
      context.beginPath(); context.arc(-64, 0, 17 + Math.sin(enemy.phase * 6) * 2, 0, TAU); context.stroke(); context.shadowBlur = 0;
      drawBossSpines(6, 23, 15, "#7ba589", 0);
    } else {
      for (let segment = 7; segment >= 1; segment -= 1) {
        const y = Math.sin(enemy.phase * 7 + segment * .72) * 8;
        drawChitinSegment(-segment * 18, y, 20, 17, segment % 2 ? .22 : -.22, shell, "#9bc4a0", true);
        drawBonePlate(-segment * 18, y - 17, 14, 22, segment % 2 ? -.2 : .2, true, "#86aa90");
      }
      context.fillStyle = "#314b43"; context.strokeStyle = "#1f2d29"; context.lineWidth = 5;
      context.beginPath(); context.moveTo(-3, -27); context.lineTo(34, -34); context.lineTo(73, 0); context.lineTo(34, 34); context.lineTo(-4, 28); context.lineTo(18, 0); context.closePath(); context.fill(); context.stroke();
      for (let ridge = 0; ridge < 4; ridge += 1) drawBonePlate(22 + ridge * 12, 0, 18, 30 - ridge * 4, 0, true, "#82a88c");
      drawRimmedEye(12, -10, 8, 5, 2, 0, "#6fd39a", "#e0e9c7");
      for (const side of [-1, 1]) drawFang(65, side * 7, 24, 8, -Math.PI / 2 + side * .28, "#d9d3a7");
      context.strokeStyle = "#a8efb6"; context.lineWidth = 5; context.beginPath(); context.arc(-132, 0, 15, 0, TAU); context.stroke();
    }
  }

  function drawInfernalForm(enemy, stage) {
    context.rotate(-enemy.angle);
    const flesh = enemy.flash > 0 ? "#fff" : stage === 1 ? "#713b43" : stage === 2 ? "#612d3c" : "#4e2033";
    if (stage === 1) {
      context.fillStyle = "#342026"; context.strokeStyle = "#1f151a"; context.lineWidth = 6;
      context.beginPath(); context.moveTo(-43, 34); context.lineTo(-29, -13); context.lineTo(0, -40); context.lineTo(30, -13); context.lineTo(44, 34); context.closePath(); context.fill(); context.stroke();
      drawLayeredEllipse(0, -4, 32, 35, 0, flesh, "#301923", "#b65d60");
      for (const side of [-1, 1]) {
        context.fillStyle = "#7c4746"; context.beginPath(); context.moveTo(side * 17, -27); context.quadraticCurveTo(side * 48, -65, side * 55, -21); context.quadraticCurveTo(side * 33, -38, side * 22, -9); context.closePath(); context.fill(); context.stroke();
      }
      drawRimmedEye(-11, -9, 7, 5, 1, 1, "#dc8a37"); drawRimmedEye(11, -9, 7, 5, -1, 1, "#dc8a37");
      drawMaw(0, 16, 16, 10, 7, 0, .9);
      context.strokeStyle = "#d8a64a"; context.lineWidth = 3; context.beginPath(); context.moveTo(-18, 31); context.lineTo(0, 44); context.lineTo(18, 31); context.stroke();
    } else if (stage === 2) {
      context.save(); context.globalAlpha = .32; context.fillStyle = "#e4a43f"; context.shadowColor = "#f28f34"; context.shadowBlur = 18;
      context.beginPath(); context.arc(0, 0, 52 + Math.sin(enemy.phase * 4) * 5, 0, TAU); context.fill(); context.restore();
      for (const side of [-1, 1]) {
        context.fillStyle = "#4a2736"; context.strokeStyle = "#21151b"; context.lineWidth = 5;
        context.beginPath(); context.moveTo(side * 14, -8); context.quadraticCurveTo(side * 55, -63, side * 75, -15); context.lineTo(side * 47, -2); context.lineTo(side * 72, 25); context.quadraticCurveTo(side * 37, 28, side * 12, 9); context.closePath(); context.fill(); context.stroke();
      }
      drawLayeredEllipse(0, 0, 36, 43, 0, flesh, "#2d1721", "#b9515a");
      drawBossSpines(7, 34, 19, "#b77c45", -Math.PI / 2);
      drawRimmedEye(0, -13, 16, 10, 0, 1, "#eca53d", "#eee1c2");
      drawMaw(0, 18, 18, 12, 8, 0, 1);
      context.fillStyle = "#e8b64e"; context.beginPath(); context.arc(0, -47, 7, 0, TAU); context.fill();
    } else {
      for (const side of [-1, 1]) {
        drawLimb(side * 18, 18, side * 34, 57, 20, "#55283a");
        context.fillStyle = "#321b27"; context.strokeStyle = "#1d1319"; context.lineWidth = 5;
        context.beginPath(); context.moveTo(side * 26, 53); context.lineTo(side * 66, 73); context.lineTo(side * 47, 45); context.closePath(); context.fill(); context.stroke();
        context.beginPath(); context.moveTo(side * 16, -28); context.quadraticCurveTo(side * 60, -83, side * 83, -34); context.quadraticCurveTo(side * 49, -53, side * 29, -8); context.closePath(); context.fill(); context.stroke();
        drawFang(side * 75, -43, 24, 9, side > 0 ? .8 : -.8, "#d8ad5a");
      }
      context.fillStyle = flesh; context.strokeStyle = "#2b1620"; context.lineWidth = 7;
      context.beginPath(); context.moveTo(-38, -28); context.lineTo(-27, -50); context.lineTo(0, -38); context.lineTo(28, -51); context.lineTo(39, -27); context.lineTo(35, 33); context.lineTo(0, 49); context.lineTo(-36, 32); context.closePath(); context.fill(); context.stroke();
      drawBonePlate(0, -26, 36, 25, 0, true, "#9c6f4a");
      drawRimmedEye(-14, -10, 9, 6, 1, 1, "#f0a630"); drawRimmedEye(14, -10, 9, 6, -1, 1, "#f0a630");
      drawMaw(0, 19, 22, 14, 10, 0, 1.1);
      context.fillStyle = "#ffd35e"; context.shadowColor = "#ff8b35"; context.shadowBlur = 20;
      context.beginPath(); context.moveTo(0, -63); context.quadraticCurveTo(-12, -48, 0, -33); context.quadraticCurveTo(14, -48, 0, -63); context.fill(); context.shadowBlur = 0;
    }
  }

  function drawBossForm(enemy) {
    const stage = clamp(enemy.bossStage || 1, 1, 3);
    if (enemy.type === "bossCoil") drawCoilForm(enemy, stage);
    else if (enemy.type === "bossHopper") drawHopperForm(enemy, stage);
    else if (enemy.type === "bossDevourer") drawDevourerForm(enemy, stage);
    else if (enemy.type === "bossIdol") drawIdolForm(enemy, stage);
    else if (enemy.type === "bossPeep") drawPeepForm(enemy, stage);
    else if (enemy.type === "bossMatron") drawMatronForm(enemy, stage);
    else if (enemy.type === "bossHollow") drawHollowForm(enemy, stage);
    else if (enemy.type === "bossHeart") drawHeartForm(enemy, stage);
    else if (enemy.type === "bossBloat") drawBloatForm(enemy, stage);
    else if (enemy.type === "bossBurrow") drawBurrowForm(enemy, stage);
    else drawInfernalForm(enemy, stage);
  }

  function drawBossTransformation(enemy) {
    if (enemy.stageTransition <= 0) return;
    const duration = enemy.bossStage === 3 ? 1.9 : 1.55;
    const progress = 1 - clamp(enemy.stageTransition / duration, 0, 1);
    const theme = bossAttackThemes[enemy.type];
    context.save();
    context.rotate(-enemy.angle);
    context.globalAlpha = Math.sin(progress * Math.PI) * .75;
    context.strokeStyle = theme.core;
    context.shadowColor = theme.color;
    context.shadowBlur = 24;
    context.lineWidth = 4;
    context.beginPath(); context.arc(0, 0, 38 + progress * 46, 0, TAU); context.stroke();
    context.lineWidth = 2;
    context.beginPath(); context.arc(0, 0, 63 + progress * 74, -progress * TAU, TAU - progress * TAU); context.stroke();
    context.fillStyle = theme.color;
    const shardCount = enemy.bossStage === 3 ? 14 : 10;
    for (let index = 0; index < shardCount; index += 1) {
      const angle = index / shardCount * TAU + progress * .8;
      const distanceValue = 35 + progress * (enemy.bossStage === 3 ? 82 : 58);
      const size = 7 + index % 3 * 2;
      context.save();
      context.translate(Math.cos(angle) * distanceValue, Math.sin(angle) * distanceValue);
      context.rotate(angle + progress * 2.4);
      context.beginPath(); context.moveTo(size, 0); context.lineTo(-size * .65, -size * .45); context.lineTo(-size * .25, size * .72); context.closePath(); context.fill();
      context.restore();
    }
    context.restore();
  }

  function drawBoss(enemy) {
    context.save();
    context.rotate(-enemy.angle);
    drawBossStageAura(enemy);
    context.restore();
    context.save();
    const transitionPulse = enemy.stageTransition > 0 ? Math.sin(enemy.stageTransition * 18) * .07 : 0;
    const attackPulse = enemy.telegraph > 0 ? Math.sin(game.elapsed * 18) * .025 : 0;
    const stageScale = [1.34, 1.48, 1.62][enemy.bossStage - 1] + transitionPulse;
    context.scale(stageScale * (1 + attackPulse), stageScale * (1 - attackPulse));
    drawBossForm(enemy);
    drawBossTransformation(enemy);
    context.restore();
  }

  function drawBossStageAura(enemy) {
    if (enemy.bossStage < 2) return;
    const stageThree = enemy.bossStage === 3;
    const theme = bossAttackThemes[enemy.type];
    const color = theme.color;
    context.save();
    context.globalAlpha = .5 + Math.sin(game.elapsed * (stageThree ? 9 : 5) + enemy.id) * .15;
    context.strokeStyle = color;
    context.shadowColor = color;
    context.shadowBlur = stageThree ? 34 : 20;
    context.lineWidth = stageThree ? 6 : 4;
    context.setLineDash(stageThree ? [13, 7] : [5, 9]);
    context.beginPath();
    context.arc(0, 0, enemy.radius + 23 + Math.sin(game.elapsed * 4) * 5, -game.elapsed, TAU - game.elapsed);
    context.stroke();
    context.setLineDash([]);
    const runeCount = stageThree ? 8 : 5;
    for (let index = 0; index < runeCount; index += 1) {
      const angle = game.elapsed * (stageThree ? -.8 : .5) + index / runeCount * TAU;
      const radius = enemy.radius + (stageThree ? 38 : 30);
      context.fillStyle = color;
      context.beginPath();
      context.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, stageThree ? 4 : 3, 0, TAU);
      context.fill();
    }
    if (enemy.stageTransition > 0) {
      const pulse = enemy.radius + 48 + Math.sin(enemy.stageTransition * 16) * 12;
      context.globalAlpha = .22;
      context.fillStyle = color;
      context.beginPath(); context.arc(0, 0, pulse, 0, TAU); context.fill();
    }
    context.restore();
  }

  function drawBossPhaseIdentity(enemy) {
    if (enemy.bossStage < 2) return;
    const stageThree = enemy.bossStage === 3;
    const theme = bossAttackThemes[enemy.type];
    const pulse = 1 + Math.sin(game.elapsed * (stageThree ? 8 : 5) + enemy.id) * .08;
    context.save();
    context.scale(pulse, pulse);
    context.strokeStyle = theme.trail;
    context.fillStyle = theme.color;
    context.lineWidth = stageThree ? 4 : 3;
    context.shadowColor = theme.color;
    context.shadowBlur = stageThree ? 16 : 8;
    if (enemy.type === "bossCoil") {
      const sacs = stageThree ? 6 : 3;
      for (let index = 0; index < sacs; index += 1) {
        const angle = Math.PI * .7 + index / Math.max(1, sacs - 1) * Math.PI * .6;
        context.beginPath(); context.ellipse(Math.cos(angle) * (enemy.radius + 10), Math.sin(angle) * (enemy.radius + 5), stageThree ? 8 : 6, stageThree ? 12 : 9, angle, 0, TAU); context.fill(); context.stroke();
      }
    } else if (enemy.type === "bossHopper") {
      for (const side of [-1, 1]) {
        context.beginPath(); context.moveTo(side * 20, 19); context.lineTo(side * (stageThree ? 52 : 42), 34); context.lineTo(side * 29, 43); context.stroke();
        context.beginPath(); context.moveTo(side * 16, -20); context.lineTo(side * (stageThree ? 32 : 27), -42); context.lineTo(side * 6, -29); context.closePath(); context.fill(); context.stroke();
      }
    } else if (enemy.type === "bossDevourer") {
      for (const side of [-1, 1]) {
        context.beginPath(); context.moveTo(24, side * 9); context.lineTo(stageThree ? 66 : 55, side * 22); context.lineTo(38, side * 3); context.closePath(); context.fill(); context.stroke();
      }
      if (stageThree) for (let tooth = -2; tooth <= 2; tooth += 1) { context.beginPath(); context.moveTo(38, tooth * 8); context.lineTo(54, tooth * 6); context.lineTo(39, tooth * 8 + 5); context.closePath(); context.fill(); }
    } else if (enemy.type === "bossIdol") {
      const eggs = stageThree ? 7 : 4;
      for (let index = 0; index < eggs; index += 1) {
        const angle = game.elapsed * (stageThree ? 1.2 : .6) + index / eggs * TAU;
        const radius = enemy.radius + (stageThree ? 38 : 27);
        context.beginPath(); context.ellipse(Math.cos(angle) * radius, Math.sin(angle) * radius, 8, 11, angle, 0, TAU); context.fill(); context.stroke();
      }
    } else if (enemy.type === "bossPeep") {
      const eyes = stageThree ? 4 : 2;
      for (let index = 0; index < eyes; index += 1) {
        const angle = game.elapsed * (index % 2 ? -.9 : .9) + index / eyes * TAU;
        const radius = enemy.radius + 30;
        context.beginPath(); context.ellipse(Math.cos(angle) * radius, Math.sin(angle) * radius, 13, 9, angle, 0, TAU); context.fill(); context.stroke();
        context.fillStyle = theme.core; context.beginPath(); context.arc(Math.cos(angle) * radius + Math.cos(angle) * 3, Math.sin(angle) * radius + Math.sin(angle) * 3, 3, 0, TAU); context.fill(); context.fillStyle = theme.color;
      }
    } else if (enemy.type === "bossMatron") {
      for (const side of [-1, 1]) {
        context.beginPath(); context.ellipse(side * (stageThree ? 71 : 58), 5, stageThree ? 22 : 18, stageThree ? 31 : 25, side * .16, 0, TAU); context.fill(); context.stroke();
        for (let finger = -2; finger <= 2; finger += 1) { context.beginPath(); context.moveTo(side * (stageThree ? 75 : 61), finger * 7); context.lineTo(side * (stageThree ? 96 : 80), finger * 9); context.stroke(); }
      }
    } else if (enemy.type === "bossHollow") {
      context.globalAlpha = .42;
      for (let echo = 1; echo <= (stageThree ? 4 : 2); echo += 1) {
        context.beginPath(); context.ellipse(-echo * 31, Math.sin(game.elapsed * 6 + echo) * 13, 25 - echo * 2, 16 - echo, 0, 0, TAU); context.fill(); context.stroke();
      }
      context.globalAlpha = 1;
    } else if (enemy.type === "bossHeart") {
      const veins = stageThree ? 8 : 5;
      for (let index = 0; index < veins; index += 1) {
        const angle = index / veins * TAU;
        context.beginPath(); context.moveTo(Math.cos(angle) * 30, Math.sin(angle) * 30); context.bezierCurveTo(Math.cos(angle + .35) * 50, Math.sin(angle + .35) * 50, Math.cos(angle - .2) * 64, Math.sin(angle - .2) * 64, Math.cos(angle) * 78, Math.sin(angle) * 78); context.stroke();
      }
    } else if (enemy.type === "bossBloat") {
      for (const side of [-1, 1]) {
        context.beginPath(); context.ellipse(side * (stageThree ? 59 : 49), -18, 17, 12, side * .15, 0, TAU); context.fill(); context.stroke();
        context.fillStyle = theme.core; context.beginPath(); context.arc(side * (stageThree ? 62 : 52), -18, 5, 0, TAU); context.fill(); context.fillStyle = theme.color;
      }
    } else if (enemy.type === "bossBurrow") {
      const plates = stageThree ? 7 : 4;
      for (let index = 0; index < plates; index += 1) {
        const x = -enemy.radius - index * 15;
        context.beginPath(); context.moveTo(x - 10, 0); context.lineTo(x, -24 - index % 2 * 7); context.lineTo(x + 10, 0); context.closePath(); context.fill(); context.stroke();
      }
    } else if (enemy.type === "bossInfernal") {
      for (const side of [-1, 1]) {
        context.beginPath(); context.moveTo(side * 24, -24); context.quadraticCurveTo(side * (stageThree ? 72 : 58), -65, side * (stageThree ? 47 : 39), -4); context.quadraticCurveTo(side * 37, -25, side * 20, -12); context.fill(); context.stroke();
        if (stageThree) { context.beginPath(); context.moveTo(side * 25, 25); context.lineTo(side * 56, 49); context.lineTo(side * 18, 47); context.closePath(); context.fill(); context.stroke(); }
      }
    }
    context.restore();
  }

  function drawBossMutation(enemy) {
    if (enemy.bossStage < 2) return;
    const stageThree = enemy.bossStage === 3;
    const theme = bossAttackThemes[enemy.type];
    context.strokeStyle = theme.trail;
    context.fillStyle = theme.color;
    context.lineWidth = 3;
    const spikes = stageThree ? 7 : 4;
    for (let index = 0; index < spikes; index += 1) {
      const angle = Math.PI + index / Math.max(1, spikes - 1) * Math.PI;
      const inner = enemy.radius * .72;
      const outer = enemy.radius + (stageThree ? 20 + index % 2 * 7 : 12);
      context.beginPath();
      context.moveTo(Math.cos(angle - .12) * inner, Math.sin(angle - .12) * inner);
      context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      context.lineTo(Math.cos(angle + .12) * inner, Math.sin(angle + .12) * inner);
      context.closePath(); context.fill(); context.stroke();
    }
    if (stageThree) {
      context.strokeStyle = theme.core;
      context.globalAlpha = .75;
      context.lineWidth = 2;
      for (let index = 0; index < 3; index += 1) {
        context.beginPath();
        context.moveTo(-17 + index * 16, -18);
        context.lineTo(-8 + index * 12, 2);
        context.lineTo(-15 + index * 14, 19);
        context.stroke();
      }
      context.globalAlpha = 1;
    }
    context.save();
    const mutationColor = theme.color;
    context.fillStyle = mutationColor;
    context.strokeStyle = theme.trail;
    context.shadowColor = mutationColor;
    context.shadowBlur = stageThree ? 18 : 10;
    context.lineWidth = 3;
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(side * enemy.radius * .42, -enemy.radius * .55);
      context.lineTo(side * (enemy.radius + (stageThree ? 30 : 18)), -enemy.radius * .92);
      context.lineTo(side * enemy.radius * .8, -enemy.radius * .18);
      context.closePath(); context.fill(); context.stroke();
    }
    if (stageThree) {
      context.fillStyle = theme.core;
      context.beginPath(); context.ellipse(0, -enemy.radius * .48, 10, 6, 0, 0, TAU); context.fill();
      context.fillStyle = theme.trail;
      context.beginPath(); context.arc(0, -enemy.radius * .48, 3.5, 0, TAU); context.fill();
    }
    context.restore();
  }

  function drawCodexBoss(enemy) {
    const palettes = {
      bossCoil: ["#8e6546", "#3c2923"], bossHopper: ["#a15d57", "#44252b"], bossIdol: ["#74604f", "#32251f"],
      bossPeep: ["#b77b56", "#4a2d29"], bossMatron: ["#9b4659", "#3d1d2b"], bossHollow: ["#7b6c91", "#31283d"],
      bossBloat: ["#7f3c4d", "#351a27"], bossBurrow: ["#647f73", "#25342f"]
    };
    const [flesh, outline] = palettes[enemy.type] || ["#77515d", "#2d1c27"];
    if (enemy.type === "bossBurrow" && enemy.submerged) {
      context.rotate(-enemy.angle);
      context.fillStyle = "#261d20";
      context.beginPath(); context.ellipse(0, 12, 52, 20, 0, 0, TAU); context.fill();
      context.strokeStyle = "#85c2a1";
      context.lineWidth = 4;
      context.setLineDash([8, 7]);
      context.beginPath(); context.arc(0, 4, 33 + Math.sin(enemy.phase * 6) * 4, 0, TAU); context.stroke();
      context.setLineDash([]);
      return;
    }
    if (["bossCoil", "bossHollow", "bossBurrow"].includes(enemy.type)) {
      context.rotate(-enemy.angle);
      for (let segment = 4; segment >= 1; segment -= 1) {
        const wave = Math.sin(enemy.phase * 4 + segment) * 8;
        context.fillStyle = enemy.flash > 0 ? "#fff" : flesh;
        context.strokeStyle = outline;
        context.lineWidth = 4;
        context.beginPath(); context.ellipse(-segment * 22, wave, 20 - segment, 17 - segment * .7, 0, 0, TAU); context.fill(); context.stroke();
      }
      drawBlob(31, 13, enemy.id, enemy.flash > 0 ? "#fff" : flesh, outline, 5);
      drawEye(7, -8, 7, 2, 1, true);
      context.fillStyle = "#27181d";
      context.beginPath(); context.ellipse(17, 7, 13, 8, 0, 0, TAU); context.fill();
      if (enemy.type === "bossBurrow" && !enemy.invulnerable) {
        context.strokeStyle = "#8ff0bd";
        context.lineWidth = 5;
        context.beginPath(); context.arc(-88, 0, 14, 0, TAU); context.stroke();
      }
      return;
    }
    context.rotate(-enemy.angle);
    if (enemy.type === "bossIdol") {
      for (let limb = -1; limb <= 1; limb += 2) drawLimb(limb * 20, 8, limb * 45, 34, 10, flesh);
      drawBlob(41, 15, enemy.id, enemy.flash > 0 ? "#fff" : flesh, outline, 6);
      context.fillStyle = "#22191a";
      context.beginPath(); context.ellipse(6, 7, 22, 17, 0, 0, TAU); context.fill();
      for (let eye = -1; eye <= 1; eye += 1) drawEye(eye * 12, -7 + Math.abs(eye) * 4, 6, 1, 1, true);
      return;
    }
    if (enemy.type === "bossMatron") {
      context.strokeStyle = "#4a2330";
      context.lineWidth = 12;
      context.beginPath(); context.arc(0, 0, 45, 0, TAU); context.stroke();
      drawBlob(38, 14, enemy.id, enemy.flash > 0 ? "#fff" : flesh, outline, 6);
      drawEye(0, -5, 15, 0, 2, true);
      context.fillStyle = "#351822";
      context.beginPath(); context.ellipse(0, 21, 15, 7, 0, 0, TAU); context.fill();
      return;
    }
    const squat = enemy.type === "bossHopper" ? 1.15 : .96;
    context.scale(1, squat);
    drawLimb(-18, 17, -28, 33, 10, flesh);
    drawLimb(18, 17, 28, 33, 10, flesh);
    drawBlob(38, 14, enemy.id, enemy.flash > 0 ? "#fff" : flesh, outline, 6);
    drawFleshTexture(36, enemy.id * 23, outline);
    if (enemy.type === "bossBloat") {
      context.fillStyle = "#391923";
      context.beginPath(); context.ellipse(-13, -8, 10, 7, 0, 0, TAU); context.ellipse(13, -8, 10, 7, 0, 0, TAU); context.fill();
    } else {
      drawEye(-11, -8, 8, 1, 1, true);
      drawEye(12, -6, enemy.type === "bossPeep" ? 11 : 7, 1, 1, true);
    }
    context.fillStyle = "#321b23";
    context.beginPath(); context.ellipse(3, 15, enemy.type === "bossHopper" ? 18 : 12, 8, 0, 0, TAU); context.fill();
  }

  function drawInfernalBoss(enemy) {
    context.rotate(-enemy.angle);
    context.strokeStyle = "#342025";
    context.fillStyle = enemy.flash > 0 ? "#fff" : "#713c44";
    context.lineWidth = 6;
    context.beginPath(); context.moveTo(-20, -24); context.quadraticCurveTo(-44, -50, -50, -16); context.quadraticCurveTo(-36, -30, -25, -5); context.fill(); context.stroke();
    context.beginPath(); context.moveTo(20, -24); context.quadraticCurveTo(44, -50, 50, -16); context.quadraticCurveTo(36, -30, 25, -5); context.fill(); context.stroke();
    drawBlob(40, 14, enemy.id, enemy.flash > 0 ? "#fff" : "#7d4149", "#301b23", 6);
    drawFleshTexture(38, enemy.id * 53, "#441f28");
    drawEye(-12, -7, 8, 1, 1, true);
    drawEye(12, -7, 8, 1, 1, true);
    context.fillStyle = "#25151c";
    context.beginPath(); context.ellipse(0, 17, 15, 9, 0, 0, TAU); context.fill();
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
    const barWidth = boss ? 560 : 52;
    const barHeight = boss ? 9 : 6;
    const y = boss ? ROOM_HEIGHT - 27 : enemy.y - enemy.radius - 14;
    const x = boss ? ROOM_WIDTH / 2 - barWidth / 2 : enemy.x - barWidth / 2;
    context.fillStyle = "#161218";
    context.fillRect(x - 3, y - 3, barWidth + 6, barHeight + 6);
    context.fillStyle = boss ? enemy.bossStage === 3 ? "#f04f78" : enemy.bossStage === 2 ? "#62c9bc" : "#c04f61" : "#d99449";
    context.fillRect(x, y, barWidth * enemy.hp / enemy.maxHp, barHeight);
    if (boss) {
      context.fillStyle = "#171218";
      context.fillRect(x + barWidth / 3 - 2, y - 3, 4, barHeight + 6);
      context.fillRect(x + barWidth * 2 / 3 - 2, y - 3, 4, barHeight + 6);
      context.fillStyle = "#e9d4b0";
      context.font = "900 13px system-ui";
      context.textAlign = "center";
      const guard = enemy.invulnerable ? " · 甲壳封闭" : enemy.type === "bossBurrow" ? " · 尾部可伤" : "";
      const threat = bossStats(enemy);
      context.fillText(`${game.rooms[game.room].name} · 阶段 ${enemy.bossStage} ${bossStageNames[enemy.type][enemy.bossStage - 1]} · HP ${Math.ceil(enemy.hp)}/${enemy.maxHp} · 威胁 ×${threat.damage.toFixed(2)}${guard}`, ROOM_WIDTH / 2, y - 7);
      context.textAlign = "left";
    }
  }

  function drawSlashes() {
    for (const slash of game.slashes) {
      const progress = 1 - slash.life / slash.maxLife;
      const startAngle = slash.angle - slash.arc / 2 + progress * .22;
      const endAngle = slash.angle + slash.arc / 2 + progress * .22;
      const waveStart = slash.angle - slash.waveArc / 2 + progress * .16;
      const waveEnd = slash.angle + slash.waveArc / 2 + progress * .16;
      const redSlash = metaProgress.equippedCosmetics.cleaver === "redSlash";
      context.save();
      context.globalAlpha = clamp(slash.life / slash.maxLife, 0, 1);
      context.strokeStyle = slash.critical ? "#ffd86e" : redSlash ? "#ff4f56" : "#79c9d5";
      context.shadowColor = slash.critical ? "#f1a647" : redSlash ? "#c51f35" : "#5eb5ca";
      context.shadowBlur = slash.critical ? 22 : 14;
      context.lineWidth = 5 * (1 - progress * .5);
      context.beginPath(); context.arc(slash.x, slash.y, slash.waveRadius * (.76 + progress * .23), waveStart, waveEnd); context.stroke();
      context.globalAlpha *= .38;
      context.lineWidth = 13 * (1 - progress * .7);
      context.beginPath(); context.arc(slash.x, slash.y, slash.waveRadius * (.68 + progress * .26), waveStart, waveEnd); context.stroke();
      context.globalAlpha = clamp(slash.life / slash.maxLife, 0, 1);
      context.strokeStyle = slash.critical ? "#fff2a1" : "#d8d1bd";
      context.shadowColor = slash.critical ? "#f1a647" : "#9a806d";
      context.shadowBlur = slash.critical ? 18 : 9;
      context.lineWidth = 15 * (1 - progress * .45);
      context.lineCap = "round";
      const bladeRadius = slash.radius * (.58 + progress * .38);
      context.beginPath(); context.arc(slash.x, slash.y, bladeRadius, startAngle, endAngle); context.stroke();
      context.strokeStyle = "#fff7dc";
      context.lineWidth = 3;
      context.beginPath(); context.arc(slash.x, slash.y, bladeRadius + 7, startAngle, endAngle); context.stroke();
      context.fillStyle = slash.critical ? "#ffe985" : "#d9c7a1";
      context.shadowBlur = 5;
      for (let tooth = 0; tooth < 7; tooth += 1) {
        const toothAngle = startAngle + (endAngle - startAngle) * (tooth + .5) / 7;
        const inner = bladeRadius - 7;
        const outer = bladeRadius + 12;
        context.beginPath();
        context.moveTo(slash.x + Math.cos(toothAngle - .035) * inner, slash.y + Math.sin(toothAngle - .035) * inner);
        context.lineTo(slash.x + Math.cos(toothAngle) * outer, slash.y + Math.sin(toothAngle) * outer);
        context.lineTo(slash.x + Math.cos(toothAngle + .035) * inner, slash.y + Math.sin(toothAngle + .035) * inner);
        context.closePath();
        context.fill();
      }
      context.globalAlpha *= .45;
      context.strokeStyle = redSlash ? "#ff9b87" : "#b9f4ff";
      context.lineWidth = 2;
      context.beginPath(); context.arc(slash.x, slash.y, slash.guardRadius * (1 + progress * .12), 0, TAU); context.stroke();
      context.restore();
    }
  }

  function drawFamiliars() {
    const player = game.player;
    if (player.weapon !== "wisp" || player.familiars <= 0) return;
    for (let index = 0; index < player.familiars; index += 1) {
      const angle = player.familiarPhase + index / player.familiars * TAU;
      const x = player.x + Math.cos(angle) * 34;
      const y = player.y + Math.sin(angle) * 24;
      context.save();
      context.translate(x, y);
      context.shadowColor = "#a98be5";
      context.shadowBlur = 14;
      context.fillStyle = "#c9b2f2";
      context.beginPath(); context.arc(0, 0, 7, 0, TAU); context.fill();
      context.fillStyle = "#f3e6ff";
      context.beginPath(); context.arc(-2, -2, 2.5, 0, TAU); context.fill();
      context.strokeStyle = "#4b3b63";
      context.lineWidth = 2;
      context.beginPath(); context.arc(0, 0, 8, 0, TAU); context.stroke();
      context.restore();
    }
  }

  function drawThreatTelegraphs() {
    for (const enemy of game.enemies) {
      if (enemy.dead) continue;
      if ((enemy.type === "charger" || enemy.type === "bossDevourer") && enemy.windup > 0) {
        const strength = 1 - clamp(enemy.windup / .58, 0, 1);
        context.save();
        context.translate(enemy.x, enemy.y);
        context.rotate(enemy.chargeAngle);
        const warning = context.createLinearGradient(enemy.radius, 0, 520, 0);
        warning.addColorStop(0, `rgba(255, 183, 76, ${.24 + strength * .22})`);
        warning.addColorStop(1, "rgba(222, 53, 43, 0)");
        context.fillStyle = warning;
        context.beginPath();
        context.moveTo(enemy.radius, -8 - strength * 5);
        context.lineTo(520, -2);
        context.lineTo(520, 2);
        context.lineTo(enemy.radius, 8 + strength * 5);
        context.closePath();
        context.fill();
        context.strokeStyle = `rgba(255, 101, 67, ${.48 + strength * .45})`;
        context.lineWidth = 2 + strength * 2;
        context.setLineDash([10, 8]);
        context.beginPath(); context.moveTo(enemy.radius, 0); context.lineTo(490, 0); context.stroke();
        context.setLineDash([]);
        context.restore();
      }
      if (enemy.telegraph <= 0) continue;
      const pulse = .55 + Math.sin(game.elapsed * 20) * .22;
      const theme = bossAttackThemes[enemy.type] || bossAttackThemes.bossHeart;
      if (["jump", "stomp", "burrowHead", "burrowTail"].includes(enemy.attackMode)) {
        context.save();
        context.strokeStyle = enemy.attackMode === "burrowTail" ? `rgba(123, 232, 174, ${pulse})` : `rgba(255, 92, 67, ${pulse})`;
        context.fillStyle = enemy.attackMode === "burrowTail" ? "rgba(86, 185, 133, .12)" : "rgba(223, 58, 42, .13)";
        context.lineWidth = 4;
        context.setLineDash([11, 8]);
        context.beginPath(); context.arc(enemy.targetX, enemy.targetY, enemy.telegraphRadius, 0, TAU); context.fill(); context.stroke();
        context.setLineDash([]);
        context.beginPath(); context.moveTo(enemy.x, enemy.y); context.lineTo(enemy.targetX, enemy.targetY); context.stroke();
        context.restore();
      }
      if (["laser", "hand"].includes(enemy.attackMode)) {
        context.save();
        context.translate(enemy.laserOriginX, enemy.laserOriginY);
        context.strokeStyle = theme.color;
        context.globalAlpha = pulse;
        context.lineWidth = Math.max(5, enemy.laserWidth * .28);
        context.setLineDash([15, 10]);
        for (const direction of enemy.laserDirections) {
          context.beginPath(); context.moveTo(0, 0); context.lineTo(Math.cos(direction) * enemy.laserLength, Math.sin(direction) * enemy.laserLength); context.stroke();
        }
        context.setLineDash([]);
        context.restore();
      }
      if (["skyfall", "burrowChain", "hoofStorm"].includes(enemy.attackMode)) {
        context.save();
        context.strokeStyle = theme.core;
        context.fillStyle = theme.color;
        context.globalAlpha = pulse;
        context.lineWidth = 4;
        context.setLineDash([10, 8]);
        for (const [index, target] of enemy.telegraphTargets.entries()) {
          context.beginPath(); context.arc(target.x, target.y, target.radius || enemy.telegraphRadius, 0, TAU); context.fill(); context.stroke();
          context.setLineDash([]);
          context.font = "900 15px system-ui";
          context.textAlign = "center";
          context.fillStyle = theme.core;
          context.fillText(String(index + 1), target.x, target.y + 5);
          context.setLineDash([10, 8]);
          context.fillStyle = theme.color;
        }
        context.setLineDash([]);
        context.restore();
      }
      if (["coilCross", "suction", "idolSpiral", "eyeCross"].includes(enemy.attackMode)) {
        context.save();
        context.translate(enemy.x, enemy.y);
        context.strokeStyle = theme.color;
        context.fillStyle = theme.color;
        context.globalAlpha = pulse;
        context.lineWidth = enemy.attackMode === "suction" ? 7 : 4;
        context.setLineDash(enemy.attackMode === "suction" ? [18, 12] : [8, 8]);
        context.beginPath();
        context.arc(0, 0, enemy.telegraphRadius || 120, game.elapsed * (enemy.attackMode === "idolSpiral" ? 2 : -1), TAU + game.elapsed * (enemy.attackMode === "idolSpiral" ? 2 : -1));
        context.stroke();
        if (enemy.attackMode === "coilCross" || enemy.attackMode === "eyeCross") {
          context.setLineDash([]);
          for (let direction = 0; direction < 4; direction += 1) {
            const angle = direction * Math.PI / 2 + (enemy.attackMode === "eyeCross" ? enemy.phase : 0);
            context.beginPath(); context.moveTo(Math.cos(angle) * 28, Math.sin(angle) * 28); context.lineTo(Math.cos(angle) * 150, Math.sin(angle) * 150); context.stroke();
          }
        }
        context.restore();
      }
      if (["handClamp", "echoLanes"].includes(enemy.attackMode)) {
        context.save();
        context.strokeStyle = theme.color;
        context.globalAlpha = pulse;
        context.lineWidth = Math.max(7, enemy.laserWidth * .3);
        context.setLineDash([16, 11]);
        if (enemy.attackMode === "handClamp") {
          context.beginPath(); context.moveTo(WALL, enemy.targetY); context.lineTo(ROOM_WIDTH - WALL, enemy.targetY); context.stroke();
        } else {
          for (const direction of [Math.PI / 4, Math.PI * .75, Math.PI * 1.25, Math.PI * 1.75]) {
            context.beginPath(); context.moveTo(enemy.x, enemy.y); context.lineTo(enemy.x + Math.cos(direction) * ARENA_DIAGONAL, enemy.y + Math.sin(direction) * ARENA_DIAGONAL); context.stroke();
          }
        }
        context.setLineDash([]);
        context.restore();
      }
      if (enemy.attackMode === "heartWall") {
        context.save();
        context.globalAlpha = pulse;
        context.fillStyle = theme.color;
        context.strokeStyle = theme.core;
        context.lineWidth = 3;
        for (let lane = 0; lane < 9; lane += 1) {
          const y = WALL + 48 + lane / 8 * (ROOM_HEIGHT - WALL * 2 - 96);
          if (Math.abs(y - enemy.wallGapY) < 78) continue;
          context.fillRect(WALL, y - 5, ROOM_WIDTH - WALL * 2, 10);
        }
        context.strokeRect(WALL + 4, enemy.wallGapY - 72, ROOM_WIDTH - WALL * 2 - 8, 144);
        context.restore();
      }
      if (enemy.signatureName) {
        context.save();
        context.textAlign = "center";
        context.font = "900 12px system-ui";
        context.fillStyle = theme.core;
        context.strokeStyle = "#160f15";
        context.lineWidth = 4;
        context.strokeText(enemy.signatureName, enemy.x, enemy.y - enemy.radius - 34);
        context.fillText(enemy.signatureName, enemy.x, enemy.y - enemy.radius - 34);
        context.restore();
      }
    }
  }

  function drawBullets() {
    for (const bullet of game.bullets) {
      const defaultBulletColor = bullet.weapon === "seeker" ? "#87f5d6" : bullet.weapon === "prism" ? "#a5e7ff" : bullet.weapon === "orbit" ? "#ff719c" : bullet.weapon === "wisp" ? "#d7c4ff" : bullet.weapon === "scatter" ? "#ffc07a" : bullet.coin ? "#ffe079" : bullet.chain ? "#d6c4ff" : bullet.explosion ? "#ffc079" : bullet.critical ? "#fffbd1" : "#fff0a6";
      const bulletColor = metaProgress.equippedCosmetics.projectile === "redTrail" ? bullet.critical ? "#fff0a3" : "#ff6454" : defaultBulletColor;
      context.save();
      context.strokeStyle = bulletColor;
      context.shadowColor = bulletColor;
      context.shadowBlur = ["seeker", "prism", "orbit"].includes(bullet.weapon) ? 13 : 0;
      context.globalAlpha = bullet.critical ? .78 : ["seeker", "prism", "orbit"].includes(bullet.weapon) ? .68 : .48;
      context.lineWidth = bullet.radius * (bullet.critical ? 1.8 : bullet.weapon === "prism" ? 1.65 : 1.25);
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(bullet.previousX ?? bullet.x, bullet.previousY ?? bullet.y);
      context.lineTo(bullet.x - bullet.vx * (bullet.weapon === "prism" ? .035 : .018), bullet.y - bullet.vy * (bullet.weapon === "prism" ? .035 : .018));
      context.stroke();
      context.restore();
      context.save();
      context.translate(bullet.x, bullet.y);
      const bulletAngle = Math.atan2(bullet.vy, bullet.vx);
      context.rotate(bullet.weapon === "orbit" ? (bullet.age || 0) * 16 : bulletAngle);
      context.fillStyle = bulletColor;
      context.shadowColor = bulletColor; context.shadowBlur = bullet.critical ? 20 : ["seeker", "prism", "orbit"].includes(bullet.weapon) ? 16 : 10;
      context.strokeStyle = bullet.chain ? "#67528c" : "#906a38";
      context.lineWidth = 1.5;
      if (bullet.weapon === "seeker") {
        context.beginPath(); context.arc(0, 0, bullet.radius * 1.08, 0, TAU); context.fill();
        context.strokeStyle = "#d8fff4"; context.lineWidth = 2;
        context.beginPath(); context.moveTo(-bullet.radius, -bullet.radius * .45); context.quadraticCurveTo(-bullet.radius * 2.4, -bullet.radius * 1.7, -bullet.radius * 2.9, 0); context.quadraticCurveTo(-bullet.radius * 2, bullet.radius * 1.4, -bullet.radius, bullet.radius * .5); context.stroke();
        context.fillStyle = "#183f3b"; context.beginPath(); context.arc(bullet.radius * .35, -bullet.radius * .2, 1.4, 0, TAU); context.fill();
      } else if (bullet.weapon === "prism") {
        context.rotate(Math.PI / 4);
        context.fillRect(-bullet.radius, -bullet.radius, bullet.radius * 2, bullet.radius * 2);
        context.strokeStyle = "#ecfbff"; context.lineWidth = 2;
        context.strokeRect(-bullet.radius, -bullet.radius, bullet.radius * 2, bullet.radius * 2);
        context.fillStyle = "#fff"; context.globalAlpha = .75; context.fillRect(-bullet.radius * .45, -bullet.radius * .8, bullet.radius * .5, bullet.radius * .5);
      } else if (bullet.weapon === "orbit") {
        context.strokeStyle = "#ffd0dc"; context.lineWidth = 2;
        for (let blade = 0; blade < 2; blade += 1) {
          context.rotate(Math.PI);
          context.beginPath(); context.moveTo(0, 0); context.quadraticCurveTo(bullet.radius * 2.5, -bullet.radius * 1.4, bullet.radius * 3.2, 0); context.quadraticCurveTo(bullet.radius * 2.2, bullet.radius * .8, bullet.radius * .7, bullet.radius * .45); context.closePath(); context.fill(); context.stroke();
        }
        context.fillStyle = "#4a1c2e"; context.beginPath(); context.arc(0, 0, bullet.radius * .65, 0, TAU); context.fill();
      } else if (bullet.weapon === "wisp") {
        context.rotate((bullet.age || 0) * 5);
        context.fillStyle = "#ccb9ff";
        context.beginPath(); context.arc(0, 0, bullet.radius * 1.12, 0, TAU); context.fill();
        context.strokeStyle = "#f0e7ff"; context.lineWidth = 2;
        for (let arm = 0; arm < 3; arm += 1) { context.rotate(TAU / 3); context.beginPath(); context.moveTo(bullet.radius * .4, 0); context.quadraticCurveTo(bullet.radius * 1.8, -bullet.radius, bullet.radius * 2.5, 0); context.stroke(); }
        context.fillStyle = "#46365d"; context.beginPath(); context.arc(bullet.radius * .25, -bullet.radius * .18, 1.6, 0, TAU); context.fill();
      } else if (bullet.weapon === "scatter") {
        context.fillStyle = "#ff9b5c";
        context.beginPath(); context.moveTo(bullet.radius * 1.8, 0); context.lineTo(-bullet.radius * .9, -bullet.radius); context.lineTo(-bullet.radius * .35, 0); context.lineTo(-bullet.radius * .9, bullet.radius); context.closePath(); context.fill(); context.stroke();
        context.fillStyle = "#fff0b0"; context.beginPath(); context.arc(bullet.radius * .35, 0, bullet.radius * .35, 0, TAU); context.fill();
      } else {
        context.beginPath();
        context.moveTo(bullet.radius * 1.6, 0);
        context.quadraticCurveTo(-bullet.radius * .4, -bullet.radius * 1.2, -bullet.radius * 1.35, 0);
        context.quadraticCurveTo(-bullet.radius * .4, bullet.radius * 1.2, bullet.radius * 1.6, 0);
        context.fill(); context.stroke();
      }
      context.restore();
    }
    context.shadowBlur = 0;
    for (const bullet of game.enemyBullets) {
      const enemyBulletColor = bullet.color || (bullet.stage === 3 ? "#ff3f87" : bullet.stage === 2 ? "#f07c63" : "#f05a58");
      const coreColor = bullet.coreColor || (bullet.stage === 3 ? "#ffc1df" : "#ff9a91");
      context.strokeStyle = bullet.trailColor || enemyBulletColor;
      context.globalAlpha = .42;
      context.lineWidth = bullet.radius * (bullet.stage === 3 ? 1.65 : 1.3);
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(bullet.previousX ?? bullet.x, bullet.previousY ?? bullet.y);
      context.lineTo(bullet.x - bullet.vx * .022, bullet.y - bullet.vy * .022);
      context.stroke();
      context.save();
      context.globalAlpha = 1;
      context.translate(bullet.x, bullet.y);
      context.rotate(Math.atan2(bullet.vy, bullet.vx) + (bullet.style === "rune" || bullet.style === "shard" ? (bullet.age || 0) * 5 : 0));
      context.fillStyle = enemyBulletColor;
      context.strokeStyle = bullet.trailColor || "#632632";
      context.lineWidth = 1.5;
      context.shadowColor = enemyBulletColor;
      context.shadowBlur = bullet.stage === 3 ? 17 : 10;
      const radius = bullet.radius + 1;
      if (["thorn", "fang", "shard"].includes(bullet.style)) {
        context.beginPath(); context.moveTo(radius * 1.8, 0); context.lineTo(-radius, -radius * .8); context.lineTo(-radius * .55, 0); context.lineTo(-radius, radius * .8); context.closePath(); context.fill(); context.stroke();
      } else if (["drop", "tear", "flame"].includes(bullet.style)) {
        context.beginPath(); context.moveTo(radius * 1.65, 0); context.bezierCurveTo(radius * .2, -radius * 1.3, -radius, -radius * .8, -radius * .72, 0); context.bezierCurveTo(-radius, radius * .8, radius * .2, radius * 1.3, radius * 1.65, 0); context.fill(); context.stroke();
      } else if (bullet.style === "rune") {
        context.rotate(Math.PI / 4); context.fillRect(-radius, -radius, radius * 2, radius * 2); context.strokeRect(-radius, -radius, radius * 2, radius * 2);
      } else if (bullet.style === "bone") {
        context.fillRect(-radius * 1.15, -radius * .42, radius * 2.3, radius * .84);
        for (const side of [-1, 1]) { context.beginPath(); context.arc(side * radius, -radius * .48, radius * .48, 0, TAU); context.arc(side * radius, radius * .48, radius * .48, 0, TAU); context.fill(); }
      } else if (bullet.style === "heart") {
        context.beginPath(); context.moveTo(0, radius); context.bezierCurveTo(-radius * 1.5, 0, -radius, -radius, 0, -radius * .35); context.bezierCurveTo(radius, -radius, radius * 1.5, 0, 0, radius); context.fill(); context.stroke();
      } else if (bullet.style === "eye") {
        context.beginPath(); context.ellipse(0, 0, radius * 1.45, radius, 0, 0, TAU); context.fill(); context.stroke();
        context.fillStyle = "#3b1622"; context.beginPath(); context.arc(radius * .25, 0, radius * .38, 0, TAU); context.fill();
      } else if (bullet.style === "hand") {
        context.beginPath(); context.arc(0, 0, radius, 0, TAU); context.fill();
        for (let finger = -1; finger <= 1; finger += 1) context.fillRect(radius * .2, finger * radius * .48 - radius * .18, radius * 1.25, radius * .32);
      } else {
        context.beginPath(); context.arc(0, 0, radius, 0, TAU); context.fill();
      }
      context.fillStyle = coreColor;
      context.beginPath(); context.arc(-radius * .22, -radius * .26, Math.max(1.5, radius * .3), 0, TAU); context.fill();
      if (bullet.stage >= 2) {
        context.strokeStyle = coreColor;
        context.lineWidth = 1.5;
        context.beginPath(); context.arc(0, 0, bullet.radius + 4 + Math.sin(game.elapsed * 11) * 1.5, 0, TAU); context.stroke();
      }
      context.restore();
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
        const affordable = !pickup.shopItem || game.player.coins >= pickup.price;
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
        context.fillText(pickup.item.name, 0, 35);
        context.font = "800 10px system-ui";
        context.fillStyle = "#c7b9a4";
        context.fillText(pickup.item.detail, 0, 49);
        if (pickup.shopItem) {
          context.fillStyle = affordable ? "#91dfaa" : "#ef7866";
          context.fillText(`◉ ${pickup.price} · ${affordable ? "靠近 / 点击购买" : `持有 ${game.player.coins}`}`, 0, 62);
        } else if (pickup.choiceGroup === "treasure") {
          if (pickup === treasureHover) {
            context.fillStyle = "#f2c96d";
            context.fillText("按 E 拾取 · 按 Esc 取消", 0, 62);
          } else {
            context.fillStyle = "#8fc69f";
            context.fillText("靠近后按 E 拾取", 0, 62);
          }
        } else {
          context.fillStyle = "#8fc69f";
          context.fillText("触碰后自动生效", 0, 62);
        }
        if (pickup.choiceGroup === "treasure" && pickup === treasureHover) {
          context.strokeStyle = "#f2c96d";
          context.lineWidth = 2;
          context.globalAlpha = .6 + Math.sin(pickup.phase * 1.6) * .3;
          context.beginPath(); context.arc(0, -7, 34, 0, TAU); context.stroke();
          context.globalAlpha = 1;
        } else if (pickup.shopItem) {
          context.strokeStyle = affordable ? "#79c995" : "#a94d49";
          context.lineWidth = 2;
          context.globalAlpha = .5 + Math.sin(pickup.phase * 1.4) * .12;
          context.beginPath(); context.arc(0, -7, 30, 0, TAU); context.stroke();
          context.globalAlpha = 1;
        }
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
      } else if (particle.ghost) {
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.angle || 0);
        context.fillStyle = particle.color;
        context.globalAlpha *= .22;
        context.beginPath(); context.ellipse(0, 0, particle.size, particle.size * .72, 0, 0, TAU); context.fill();
        context.restore();
      } else if (particle.streak) {
        context.strokeStyle = particle.color;
        context.lineWidth = particle.size;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x - particle.vx * .055, particle.y - particle.vy * .055);
        context.stroke();
      } else if (particle.drop) {
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(Math.atan2(particle.vy, particle.vx));
        context.fillStyle = particle.color;
        context.beginPath(); context.ellipse(0, 0, particle.size * 1.7, particle.size, 0, 0, TAU); context.fill();
        context.restore();
      } else if (particle.star) {
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate((1 - particle.life / particle.maxLife) * 4 + (particle.angle || 0));
        context.fillStyle = particle.color;
        if (particle.glow) { context.shadowColor = particle.color; context.shadowBlur = 12; }
        context.beginPath();
        for (let point = 0; point < 8; point += 1) {
          const angle = point / 8 * TAU;
          const radius = point % 2 ? particle.size * .35 : particle.size;
          if (!point) context.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          else context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        context.closePath(); context.fill();
        context.restore();
      } else {
        context.fillStyle = particle.color;
        if (particle.glow) { context.shadowColor = particle.color; context.shadowBlur = 10; }
        context.beginPath(); context.arc(particle.x, particle.y, particle.size, 0, TAU); context.fill();
        context.shadowBlur = 0;
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
    context.fillText(`深度 ${room.depth}/11 · ${room.biome} ${room.floorLabel} · 房间 ${room.floorRoom}`, 70, 78);
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
    if (!hudOpen) {
      context.fillStyle = "#8f8273";
      context.font = "700 10px system-ui";
      context.fillText("按 Tab 查看属性", 70, 121);
    }
    drawMinimap();
    if (hudOpen) {
      drawStats();
      drawBuildTracks();
    }
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
    const currentDepth = game.rooms[game.room].depth;
    const floorRooms = game.rooms.filter(room => room.depth === currentDepth);
    const floorStart = game.rooms.findIndex(room => room.depth === currentDepth);
    const startX = ROOM_WIDTH - 60 - floorRooms.length * 30;
    const y = 86;
    for (let index = 0; index < floorRooms.length; index += 1) {
      const room = floorRooms[index];
      const globalIndex = floorStart + index;
      context.fillStyle = globalIndex < game.room ? "#6f875d" : globalIndex === game.room ? "#e8bd63" : room.kind === "boss" ? "#682f3e" : "#302b31";
      context.fillRect(startX + index * 30, y, 22, 16);
      if (room.kind === "treasure") {
        context.fillStyle = "#d8af55";
        context.fillRect(startX + index * 30 + 8, y + 4, 6, 7);
      }
      if (room.kind === "shop") {
        context.fillStyle = "#d58d48";
        context.beginPath(); context.arc(startX + index * 30 + 11, y + 8, 4, 0, TAU); context.fill();
      }
      if (index < floorRooms.length - 1) { context.fillStyle = "#675a4c"; context.fillRect(startX + index * 30 + 22, y + 6, 8, 4); }
    }
    const depthStart = ROOM_WIDTH - 60 - chapters.length * 16;
    for (let depth = 1; depth <= chapters.length; depth += 1) {
      context.fillStyle = depth < currentDepth ? "#6f875d" : depth === currentDepth ? "#e8bd63" : "#302b31";
      context.beginPath(); context.arc(depthStart + (depth - 1) * 16 + 5, y + 27, depth === currentDepth ? 5 : 3.5, 0, TAU); context.fill();
    }
  }

  function drawStats() {
    const player = game.player;
    drawHudPanel(55, 128, 242, 58);
    context.fillStyle = "#bfb39e";
    context.font = "700 11px system-ui";
    context.fillText(`攻击 ${player.damage.toFixed(1)}   射速 ${(1 / player.fireRate).toFixed(1)}/秒   移速 ${Math.round(player.speed)}`, 68, 151);
    context.fillText(`射程 ${Math.round(player.bulletLife * player.bulletSpeed)}   弹道 ${player.shots}   暴击 ${Math.round(player.critChance * 100)}%   穿透 ${player.pierce}`, 68, 171);
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
    const title = metaProgress.equippedCosmetics.title === "supplyTitle" ? "补给先锋 · " : "";
    context.fillText(`${title}${hero.name} · ${weaponNames[player.weapon]} Lv.${player.weaponLevel}`, x + 12, y + 16);
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
    let slot = 0;
    for (const item of items) {
      const count = game.itemStacks[item.id];
      if (!count) continue;
      const x = 58 + slot % 16 * 44;
      const y = ROOM_HEIGHT - 72 - Math.floor(slot / 16) * 38;
      drawHudPanel(x, y, 38, 32);
      drawItemGlyph(item, x + 15, y + 16, .55);
      context.fillStyle = "#f4ead0";
      context.font = "800 10px system-ui";
      context.fillText(`×${count}`, x + 25, y + 25);
      slot += 1;
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
    const occupied = [];
    for (const text of game.texts) {
      let drawY = text.y;
      for (let guard = 0; guard < 8 && occupied.some(entry => Math.abs(entry.x - text.x) < 230 && Math.abs(entry.y - drawY) < 22); guard += 1) drawY += 24;
      occupied.push({ x: text.x, y: drawY });
      context.globalAlpha = Math.min(1, text.life);
      context.font = `900 ${text.size || 22}px system-ui`;
      context.fillStyle = text.color || "#ffe09a";
      context.strokeStyle = "#1b1115";
      context.lineWidth = text.size ? 3 : 4;
      context.strokeText(text.text, text.x, drawY);
      context.fillText(text.text, text.x, drawY);
    }
    context.globalAlpha = 1;
    context.textAlign = "left";
  }

  function drawRouteChoice() {
    context.fillStyle = "rgba(10, 7, 11, .96)";
    context.fillRect(WALL, WALL, ROOM_WIDTH - WALL * 2, ROOM_HEIGHT - WALL * 2);
    context.textAlign = "center";
    context.fillStyle = "#f3dfb6";
    context.font = "900 30px system-ui";
    context.fillText(game.routeChoice.title || "前路需要代价", ROOM_WIDTH / 2, 176);
    context.fillStyle = "#aa9987";
    context.font = "700 13px system-ui";
    context.fillText(game.routeChoice.subtitle || "选择安全恢复，或接受强化精英以争取额外构筑", ROOM_WIDTH / 2, 206);
    game.routeChoice.options.forEach((option, index) => {
      const x = (ROOM_WIDTH - ROUTE_CARD_WIDTH * 2 - ROUTE_CARD_GAP) / 2 + index * (ROUTE_CARD_WIDTH + ROUTE_CARD_GAP);
      const y = ROUTE_CARD_Y;
      const widthValue = ROUTE_CARD_WIDTH;
      const heightValue = ROUTE_CARD_HEIGHT;
      const glow = context.createLinearGradient(x, y, x, y + heightValue);
      glow.addColorStop(0, `${option.color}4d`);
      glow.addColorStop(1, "rgba(24, 18, 22, .96)");
      context.fillStyle = glow;
      context.strokeStyle = option.color;
      context.lineWidth = 3;
      roundedRect(x, y, widthValue, heightValue, 12);
      context.fill(); context.stroke();
      context.fillStyle = option.color;
      context.font = "900 15px system-ui";
      context.fillText(`${index + 1}`, x + widthValue / 2, y + 30);
      context.fillStyle = "#f5e5c6";
      context.font = "900 23px system-ui";
      context.fillText(option.name, x + widthValue / 2, y + 82);
      context.fillStyle = "#c9b9a4";
      context.font = "700 13px system-ui";
      const details = option.detail.split("，");
      details.forEach((detail, line) => context.fillText(detail, x + widthValue / 2, y + 122 + line * 23));
      context.fillStyle = option.color;
      context.font = "800 12px system-ui";
      context.fillText(option.badge, x + widthValue / 2, y + 176);
    });
    context.textAlign = "left";
  }

  function frame(time) {
    const dt = Math.min((time - lastTime) / 1000 || 0, .033);
    lastTime = time;
    if (hitStop > 0) hitStop = Math.max(0, hitStop - dt);
    else if (!guideOpen && !workshopOpen && !benefitsOpen) update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function toRoom(clientX, clientY) {
    return { x: (clientX - offsetX) / scale, y: (clientY - offsetY) / verticalScale };
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  document.addEventListener("fullscreenchange", resize);
  const keyAliases = {
    w: "KeyW", a: "KeyA", s: "KeyS", d: "KeyD",
    ArrowUp: "ArrowUp", ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight",
    " ": "Space", Spacebar: "Space", q: "KeyQ", Q: "KeyQ", r: "KeyR", R: "KeyR"
  };

  function normalizedCode(event) {
    if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyR", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) return event.code;
    return keyAliases[event.key] || keyAliases[String(event.key).toLowerCase()] || event.code;
  }

  function handleKeyDown(event) {
    const code = normalizedCode(event);
    if (code === "Escape" && benefitsOpen) {
      event.preventDefault();
      setBenefitsOpen(false);
      return;
    }
    if (code === "Escape" && workshopOpen) {
      event.preventDefault();
      setWorkshopOpen(false);
      return;
    }
    if (code === "KeyE" && treasureHover) {
      event.preventDefault();
      collectPickup(treasureHover);
      treasureHover = null;
      return;
    }
    if (code === "Escape" && treasureHover) {
      event.preventDefault();
      treasureHover = null;
      return;
    }
    if (code === "Tab") {
      event.preventDefault();
      hudOpen = !hudOpen;
      return;
    }
    if (code === "KeyI" || code === "Escape") {
      event.preventDefault();
      setGuideOpen(code === "Escape" ? false : !guideOpen);
      return;
    }
    if (guideOpen || workshopOpen || benefitsOpen) return;
    if (game && game.routeChoice && ["Digit1", "Digit2"].includes(code)) {
      event.preventDefault();
      chooseRoute(game.routeChoice.options[code === "Digit1" ? 0 : 1].id);
      return;
    }
    if (code === "KeyR") {
      event.preventDefault();
      if (!event.repeat) rerollTreasure();
      return;
    }
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
    pointer.firePointerId = null;
    touchMove.x = 0;
    touchMove.y = 0;
    touchMove.pointerId = null;
    const knob = document.querySelector("#stick-knob");
    if (knob) knob.style.transform = "";
    const fire = document.querySelector("#fire-button");
    if (fire) fire.classList.remove("firing");
  }

  window.addEventListener("blur", resetInput);
  window.addEventListener("pagehide", resetInput);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetInput();
  });
  canvas.addEventListener("pointermove", event => {
    const point = toRoom(event.clientX, event.clientY);
    pointer.x = point.x; pointer.y = point.y; pointer.active = event.pointerType === "mouse";
  });
  canvas.addEventListener("pointerdown", event => {
    const point = toRoom(event.clientX, event.clientY);
    if (game && game.routeChoice && point.y >= ROUTE_CARD_Y && point.y <= ROUTE_CARD_Y + ROUTE_CARD_HEIGHT) {
      const firstX = (ROOM_WIDTH - ROUTE_CARD_WIDTH * 2 - ROUTE_CARD_GAP) / 2;
      const secondX = firstX + ROUTE_CARD_WIDTH + ROUTE_CARD_GAP;
      if (point.x >= firstX && point.x <= firstX + ROUTE_CARD_WIDTH) chooseRoute(game.routeChoice.options[0].id);
      if (point.x >= secondX && point.x <= secondX + ROUTE_CARD_WIDTH) chooseRoute(game.routeChoice.options[1].id);
      event.preventDefault();
      return;
    }
    if (game && game.state === "playing" && game.rooms[game.room].kind === "shop") {
      const offer = game.pickups.find(pickup => pickup.shopItem && !pickup.dead && Math.hypot(point.x - pickup.x, point.y - pickup.y) <= 52);
      if (offer) {
        attemptShopPurchase(offer);
        event.preventDefault();
        return;
      }
    }
    if (event.pointerType !== "mouse") return;
    canvas.focus({ preventScroll: true });
    if (event.button === 0) pointer.down = true;
    if (event.button === 2) pointer.moveDown = true;
  });
  canvas.addEventListener("contextmenu", event => event.preventDefault());
  window.addEventListener("pointerup", event => {
    if (event.pointerId === pointer.firePointerId) releaseFire(event);
    if (event.pointerType === "mouse") {
      if (event.button === 0) pointer.down = false;
      if (event.button === 2) pointer.moveDown = false;
    }
  });
  window.addEventListener("pointercancel", event => {
    if (event.pointerId === pointer.firePointerId) releaseFire(event);
    if (event.pointerId === touchMove.pointerId) resetStick(event);
  });

  const stickZone = document.querySelector("#stick-zone");
  const stickKnob = document.querySelector("#stick-knob");
  function updateStick(event) {
    if (touchMove.pointerId !== null && event.pointerId !== touchMove.pointerId) return;
    const bounds = stickZone.getBoundingClientRect();
    const dx = event.clientX - (bounds.left + bounds.width / 2);
    const dy = event.clientY - (bounds.top + bounds.height / 2);
    const length = Math.hypot(dx, dy) || 1;
    const limited = Math.min(length, 36);
    touchMove.x = dx / length * Math.min(length / 36, 1);
    touchMove.y = dy / length * Math.min(length / 36, 1);
    stickKnob.style.transform = `translate(${dx / length * limited}px, ${dy / length * limited}px)`;
  }
  function resetStick(event) {
    if (event && touchMove.pointerId !== null && event.pointerId !== touchMove.pointerId) return;
    touchMove.x = 0;
    touchMove.y = 0;
    touchMove.pointerId = null;
    stickKnob.style.transform = "";
  }
  stickZone.addEventListener("pointerdown", event => { event.preventDefault(); touchMove.pointerId = event.pointerId; stickZone.setPointerCapture(event.pointerId); updateStick(event); });
  stickZone.addEventListener("pointermove", event => { if (stickZone.hasPointerCapture(event.pointerId)) updateStick(event); });
  stickZone.addEventListener("pointerup", resetStick);
  stickZone.addEventListener("pointercancel", resetStick);
  stickZone.addEventListener("lostpointercapture", resetStick);
  const fireButton = document.querySelector("#fire-button");
  function releaseFire(event) {
    if (event && pointer.firePointerId !== null && event.pointerId !== pointer.firePointerId) return;
    const pointerId = pointer.firePointerId;
    pointer.down = false;
    pointer.firePointerId = null;
    if (pointerId !== null) {
      try {
        if (fireButton.hasPointerCapture(pointerId)) fireButton.releasePointerCapture(pointerId);
      } catch {}
    }
    fireButton.classList.remove("firing");
  }
  fireButton.addEventListener("pointerdown", event => {
    event.preventDefault();
    if (pointer.firePointerId !== null) releaseFire();
    pointer.firePointerId = event.pointerId;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
    pointer.down = true;
    pointer.active = false;
    fireButton.classList.add("firing");
  });
  fireButton.addEventListener("pointerup", releaseFire);
  fireButton.addEventListener("pointercancel", releaseFire);
  fireButton.addEventListener("lostpointercapture", releaseFire);
  fireButton.addEventListener("pointerleave", event => { if (event.pointerType !== "mouse") releaseFire(event); });
  fireButton.addEventListener("contextmenu", event => event.preventDefault());
  document.querySelector("#dash-button").addEventListener("pointerdown", event => { event.preventDefault(); roll(); });
  document.querySelector("#skill-button").addEventListener("pointerdown", event => { event.preventDefault(); activateSkill(); });
  document.querySelectorAll(".hero-card").forEach(button => button.addEventListener("click", () => {
    selectedHero = button.dataset.hero;
    document.querySelectorAll(".hero-card").forEach(card => card.classList.remove("selected"));
    button.classList.add("selected");
  }));
  document.querySelectorAll(".weapon-card").forEach(button => button.addEventListener("click", () => {
    if (!isWeaponUnlocked(button.dataset.weapon)) return;
    selectedWeapon = button.dataset.weapon;
    document.querySelectorAll(".weapon-card").forEach(card => card.classList.remove("selected"));
    button.classList.add("selected");
  }));
  document.querySelector("#start-button").addEventListener("click", () => { requestLandscapeMode(); newGame(); });
  document.querySelector("#restart-button").addEventListener("click", () => { requestLandscapeMode(); newGame(); });
  fullscreenButton.addEventListener("click", requestLandscapeMode);
  document.querySelector("#guide-button").addEventListener("click", () => setGuideOpen(!guideOpen));
  document.querySelector("#guide-close").addEventListener("click", () => setGuideOpen(false));
  document.querySelector("#workshop-button").addEventListener("click", () => setWorkshopOpen(!workshopOpen));
  document.querySelector("#workshop-close").addEventListener("click", () => setWorkshopOpen(false));
  document.querySelector("#benefits-button").addEventListener("click", () => setBenefitsOpen(!benefitsOpen));
  document.querySelector("#benefits-close").addEventListener("click", () => setBenefitsOpen(false));
  document.querySelector("#end-benefits-button").addEventListener("click", () => setBenefitsOpen(true));
  rerollButton.addEventListener("click", rerollTreasure);
  benefitsPanel.addEventListener("click", event => {
    const tab = event.target.closest("[data-benefits-tab]");
    if (tab) {
      benefitsTab = tab.dataset.benefitsTab;
      benefitsMessage = "";
      renderBenefits();
      return;
    }
    const purchase = event.target.closest("[data-benefit-buy]");
    if (purchase) {
      purchaseBenefit(purchase.dataset.benefitBuy);
      return;
    }
    const equip = event.target.closest("[data-benefit-equip]");
    if (equip) {
      equipBenefit(equip.dataset.benefitEquip);
      return;
    }
    const mission = event.target.closest("[data-mission-claim]");
    if (mission) claimDailyMission(mission.dataset.missionClaim);
  });
  farmPlots.addEventListener("click", event => {
    const plot = event.target.closest("[data-plot]");
    if (plot) interactFarmPlot(Number(plot.dataset.plot));
  });
  forgeRecipes.addEventListener("click", event => {
    const recipe = event.target.closest("[data-craft]");
    if (recipe) craftWeapon(recipe.dataset.craft);
  });

  function benefitsState() {
    ensureDailyMissions();
    return {
      open: benefitsOpen,
      tab: benefitsTab,
      balance: metaProgress.supplyCoins,
      productCount: Object.keys(benefitProducts).length,
      vouchers: metaProgress.vouchers.map(voucher => ({ ...voucher })),
      boosterInventory: { ...metaProgress.boosterInventory },
      selectedBooster: metaProgress.selectedBooster,
      ownedCosmetics: [...metaProgress.ownedCosmetics],
      equippedCosmetics: { ...metaProgress.equippedCosmetics },
      daily: {
        ...metaProgress.daily,
        taskIds: [...metaProgress.daily.taskIds],
        progress: { ...metaProgress.daily.progress },
        claimed: [...metaProgress.daily.claimed]
      },
      missions: Object.fromEntries(Object.entries(dailyMissionCatalog).map(([id, mission]) => [id, { ...mission }])),
      products: Object.fromEntries(Object.entries(benefitProducts).map(([id, product]) => [id, { ...product }]))
    };
  }

  window.__game = {
    start: newGame,
    getState() {
      if (!game) return { state: "menu", benefitsOpen, benefits: benefitsState() };
      return {
        state: game.state,
        guideOpen,
        workshopOpen,
        benefitsOpen,
        benefits: benefitsState(),
        viewport: {
          width, height, scaleX: scale, scaleY: verticalScale, offsetX, offsetY,
          roomWidth: ROOM_WIDTH, roomHeight: ROOM_HEIGHT,
          roomDisplayWidth: ROOM_WIDTH * scale, roomDisplayHeight: ROOM_HEIGHT * verticalScale,
          gridColumns: Math.floor((ROOM_WIDTH - WALL * 2) / 64), gridRows: Math.floor((ROOM_HEIGHT - WALL * 2) / 54),
          landscape: width > height
        },
        outcome: game.outcome || null,
        room: game.room,
        roomCount: game.rooms.length,
        roomType: game.rooms[game.room].kind,
        roomModifier: game.rooms[game.room].modifier || null,
        chapter: game.rooms[game.room].chapter + 1,
        depth: game.rooms[game.room].depth,
        biome: game.rooms[game.room].biome,
        finalBranch: game.finalBranch,
        bossMechanics: { ...game.bossMechanics },
        bossSignatures: { ...game.bossSignatures },
        bossSignatureResolutions: { ...game.bossSignatureResolutions },
        visualVersion: 3,
        bossFormCatalog: Object.fromEntries(Object.entries(bossFormCatalog).map(([id, forms]) => [id, [...forms]])),
        bossCatalog: Object.fromEntries(Object.entries(bossProfiles).map(([id, profile]) => [id, { hp: profile.hp, stages: [...profile.stages], forms: [...bossFormCatalog[id]], projectile: bossAttackThemes[id].shape, attackTheme: bossAttackThemes[id].name }])),
        floorRoom: game.rooms[game.room].floorRoom,
        roomKinds: game.rooms.map(room => room.kind),
        routeChoice: game.routeChoice ? game.routeChoice.options.map(option => option.id) : null,
        routeChoices: game.routeChoices,
        chosenRoutes: game.rooms.map(room => room.routeSelected || null),
        plannedEnemyTypes: game.rooms.flatMap(room => room.enemies),
        enemyTypes: game.enemies.map(enemy => enemy.type),
        enemyHealth: game.enemies.map(enemy => enemy.hp),
        enemies: game.enemies.map(enemy => ({ x: enemy.x, y: enemy.y, hp: enemy.hp, maxHp: enemy.maxHp, radius: enemy.radius, type: enemy.type, elite: enemy.elite, affix: enemy.affix, shield: enemy.shield, summonedBy: enemy.summonedBy || null, bossStage: enemy.bossStage, bossForm: isBoss(enemy) ? bossFormCatalog[enemy.type][clamp(enemy.bossStage - 1, 0, 2)] : null, stageTransition: enemy.stageTransition, bossStats: isBoss(enemy) ? { ...bossStats(enemy) } : null, attackMode: enemy.attackMode, signatureName: enemy.signatureName, telegraph: enemy.telegraph, telegraphTargets: enemy.telegraphTargets?.length || 0, invulnerable: enemy.invulnerable, statuses: { ...enemy.statuses } })),
        doorOpen: game.doorOpen,
        pickupTypes: game.pickups.map(pickup => pickup.type),
        shopOffers: game.pickups.filter(pickup => pickup.shopItem && !pickup.dead).map(pickup => ({
          x: pickup.x, y: pickup.y, homeX: pickup.homeX, homeY: pickup.homeY,
          price: pickup.price, affordable: game.player.coins >= pickup.price, item: pickup.item.id
        })),
        shopPurchases: game.shopPurchases,
        hp: game.player.hp,
        maxHp: game.player.maxHp,
        player: {
          x: game.player.x, y: game.player.y,
          vx: game.player.vx, vy: game.player.vy,
          speed: Math.hypot(game.player.vx, game.player.vy),
          moveAngle: game.player.moveAngle, aimAngle: game.player.aimAngle,
          rolling: game.player.roll > 0, shotSequence: game.player.shotSequence
        },
        enemyCount: game.enemies.length,
        playerBullets: game.bullets.length,
        playerProjectiles: game.bullets.map(bullet => ({ weapon: bullet.weapon || "skill", homing: bullet.homing || 0, targetId: bullet.targetId || null, bounces: bullet.bounces || 0, boomerang: Boolean(bullet.boomerang), returning: Boolean(bullet.returning) })),
        enemyBullets: game.enemyBullets.length,
        enemyProjectiles: game.enemyBullets.map(bullet => ({ style: bullet.style || "orb", bossType: bullet.bossType || null, kind: bullet.kind, curve: bullet.curve || 0, acceleration: bullet.acceleration || 0 })),
        kills: game.kills,
        bossKills: game.bossKills,
        hero: game.player.hero,
        combo: game.combo,
        perfectRooms: game.perfectRooms,
        destroyedProps: game.destroyedProps,
        synergies: { ...game.synergies },
        obstacles: game.obstacles.filter(obstacle => !obstacle.dead).length,
        bombs: game.bombs.length,
        hazards: game.hazards.length,
        slashes: game.slashes.length,
        cleaverSlashes: game.slashes.map(slash => ({
          radius: slash.radius, waveRadius: slash.waveRadius, guardRadius: slash.guardRadius,
          arc: slash.arc, waveArc: slash.waveArc, life: slash.life, maxLife: slash.maxLife,
          damage: slash.damage, waveDamage: slash.waveDamage, blocked: slash.blocked
        })),
        bossWaves: game.bossWaves.length,
        bossLasers: game.bossLasers.length,
        arenaInset: game.arenaInset,
        bossStage: game.enemies.find(enemy => isBoss(enemy))?.bossStage || 0,
        bossThreat: game.enemies.find(enemy => isBoss(enemy)) ? { ...bossStats(game.enemies.find(enemy => isBoss(enemy))) } : null,
        eliteAffixes: { ...game.affixesSeen },
        summonedEnemies: game.enemies.filter(enemy => enemy.summonedBy).length,
        coins: game.player.coins,
        seedsFound: game.seedsFound,
        evades: game.evades,
        activeBooster: game.activeBooster,
        treasureRerolls: game.treasureRerolls,
        supplyReward: game.supplySettlement ? { ...game.supplySettlement } : null,
        debugAssisted: game.debugAssisted,
        skillCooldown: game.player.skillCooldown,
        input: { firing: pointer.down, firePointerId: pointer.firePointerId, stickPointerId: touchMove.pointerId },
        feedback: {
          particles: game.particles.length,
          damageTexts: game.texts.filter(text => text.size).length,
          hitStop,
          screenShake
        },
        itemsFound: game.itemsFound,
        itemCatalogSize: items.length,
        meta: { ...metaProgress, materials: { ...metaProgress.materials }, plots: metaProgress.plots.map(plot => plot ? { ...plot, yield: { ...plot.yield } } : null), blueprints: [...metaProgress.blueprints], craftedWeapons: [...metaProgress.craftedWeapons] },
        runStats: {
          damageDealt: game.damageDealt,
          damageTaken: game.damageTaken,
          damageBySource: { ...game.damageBySource },
          lastDamageSource: game.lastDamageSource
        },
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
          armor: game.player.armor,
          weapon: game.player.weapon,
          weaponLevel: game.player.weaponLevel,
          familiars: game.player.familiars,
          statusChances: {
            burn: game.player.burnChance, freeze: game.player.freezeChance, poison: game.player.poisonChance,
            bleed: game.player.bleedChance, shock: game.player.shockChance
          }
        }
      };
    },
    clearRoom() {
      if (!game || game.state !== "playing") return;
      game.debugAssisted = true;
      game.suppressSpawns = true;
      game.enemies.slice().forEach(killEnemy);
      game.suppressSpawns = false;
    },
    collectPickups() {
      if (!game || game.state !== "playing") return;
      game.pickups.forEach(pickup => {
        if (pickup.choiceGroup === "treasure") collectPickup(pickup);
        else { pickup.x = game.player.x; pickup.y = game.player.y; }
      });
    },
    setPlayerPosition(x, y) {
      if (!game || game.state !== "playing") return;
      game.player.x = clamp(x, WALL + game.player.radius, ROOM_WIDTH - WALL - game.player.radius);
      game.player.y = clamp(y, WALL + game.player.radius, ROOM_HEIGHT - WALL - game.player.radius);
      game.player.vx = 0;
      game.player.vy = 0;
    },
    exitRoom() {
      if (!game || game.state !== "playing") return;
      if (game.routeChoice) chooseRoute(game.routeChoice.options.find(option => option.id === "risk")?.id || game.routeChoice.options[0].id);
      if (!game.doorOpen) return;
      game.player.x = ROOM_WIDTH - WALL - game.player.radius;
    },
    chooseRoute,
    goToRoom(index) {
      if (!game || game.state !== "playing" || !Number.isInteger(index) || index < 0 || index >= game.rooms.length) return;
      game.debugAssisted = true;
      enterRoom(index);
    },
    giveItem(id) {
      const item = items.find(candidate => candidate.id === id);
      if (game && item) {
        game.debugAssisted = true;
        grantItem(item);
      }
    },
    inflictStatus(type, duration = 3) {
      const enemy = game && game.enemies.find(candidate => !candidate.dead);
      if (!enemy || !Object.hasOwn(enemy.statuses, type)) return;
      enemy.statuses[type] = duration;
      if (type === "bleed") enemy.bleedStacks = Math.max(1, enemy.bleedStacks || 0);
    },
    setBossHealthRatio(ratio) {
      const boss = game && game.enemies.find(enemy => isBoss(enemy));
      if (!boss) return;
      game.debugAssisted = true;
      boss.hp = Math.max(1, boss.maxHp * clamp(ratio, .01, 1));
    },
    damageBoss(amount, skill = false) {
      const boss = game && game.enemies.find(enemy => isBoss(enemy));
      if (!boss) return;
      game.debugAssisted = true;
      damageEnemy(boss, Math.max(0, amount), { x: game.player.x, y: game.player.y, skill });
    },
    triggerBossSignature() {
      const boss = game && game.enemies.find(enemy => isBoss(enemy));
      if (!boss || boss.bossStage < 2) return false;
      boss.telegraph = 0;
      boss.attackMode = null;
      boss.signatureCooldown = 0;
      updateBossSignature(boss, .016);
      return boss.signatureName;
    },
    hurt(amount = 1) {
      if (!game || game.state !== "playing") return;
      game.player.invincible = 0;
      damagePlayer(amount);
    },
    setPlayerInvincible(seconds = 30) {
      if (!game || game.state !== "playing") return false;
      game.debugAssisted = true;
      game.player.invincible = Math.max(game.player.invincible, Math.max(0, seconds));
      return true;
    },
    selectHero(id) {
      if (heroes[id]) selectedHero = id;
    },
    selectWeapon(id) {
      if (weaponNames[id]) selectedWeapon = id;
    },
    showcaseHero(id) {
      if (!heroes[id]) return false;
      selectedHero = id;
      newGame();
      game.debugAssisted = true;
      game.enemies.length = 0;
      game.enemyBullets.length = 0;
      game.bullets.length = 0;
      game.pickups.length = 0;
      game.obstacles.length = 0;
      game.particles.length = 0;
      game.texts.length = 0;
      game.player.x = ROOM_WIDTH * .5;
      game.player.y = ROOM_HEIGHT * .52;
      game.player.angle = 0;
      game.player.aimAngle = 0;
      game.player.moveAngle = 0;
      game.transition = 0;
      game.doorOpen = false;
      return true;
    },
    showcaseEnemy(type, stage = 1) {
      const regularTypes = ["grunt", "turret", "charger", "bat", "splitter", "leech", "cultist", "bomber"];
      if (!game || (!regularTypes.includes(type) && !bossProfiles[type])) return false;
      game.debugAssisted = true;
      game.enemies.length = 0;
      game.enemyBullets.length = 0;
      game.bullets.length = 0;
      game.bombs.length = 0;
      game.hazards.length = 0;
      game.bossWaves.length = 0;
      game.bossLasers.length = 0;
      game.obstacles.length = 0;
      game.particles.length = 0;
      game.texts.length = 0;
      spawnEnemy(type);
      const enemy = game.enemies[0];
      enemy.x = ROOM_WIDTH * .64;
      enemy.y = ROOM_HEIGHT * .52;
      enemy.angle = Math.PI;
      enemy.speed = 0;
      enemy.cooldown = 999;
      enemy.signatureCooldown = 999;
      if (bossProfiles[type]) {
        enemy.bossStage = clamp(Math.round(stage), 1, 3);
        enemy.hp = enemy.maxHp * ([1, .6, .3][enemy.bossStage - 1]);
        enemy.stageTransition = 0;
        enemy.submerged = false;
        enemy.invulnerable = false;
      }
      game.player.x = ROOM_WIDTH * .24;
      game.player.y = ROOM_HEIGHT * .52;
      game.player.vx = 0;
      game.player.vy = 0;
      game.transition = 0;
      game.doorOpen = false;
      return true;
    },
    equipWeapon(id) {
      if (!game || !weaponNames[id]) return false;
      game.player.weapon = id;
      game.player.weaponLevel = 1;
      return true;
    },
    fire(angle = 0) {
      if (!game || game.state !== "playing") return false;
      game.player.cooldown = 0;
      firePlayer(angle);
      return true;
    },
    spawnEnemyBullet(x, y, vx = 0, vy = 0) {
      if (!game || game.state !== "playing") return false;
      game.enemyBullets.push({
        x, y, previousX: x, previousY: y, vx, vy,
        radius: 5, life: 4, damage: 1, stage: 0, ownerId: 0, kind: "测试弹幕"
      });
      return true;
    },
    toggleWorkshop(open) {
      setWorkshopOpen(open === undefined ? !workshopOpen : open);
    },
    toggleBenefits(open, tab) {
      setBenefitsOpen(open === undefined ? !benefitsOpen : open, tab);
    },
    addSupplyCoins(amount = 1) {
      metaProgress.supplyCoins += Math.max(0, Math.floor(amount));
      saveMetaProgress();
      return metaProgress.supplyCoins;
    },
    purchaseBenefit,
    equipBenefit,
    claimDailyMission,
    progressDailyMission(id, amount = 1) {
      ensureDailyMissions();
      const mission = dailyMissionCatalog[id];
      if (!mission || !metaProgress.daily.taskIds.includes(id)) return false;
      metaProgress.daily.progress[id] = Math.min(mission.target, (metaProgress.daily.progress[id] || 0) + Math.max(0, amount));
      saveMetaProgress();
      return true;
    },
    rerollTreasure,
    addSeeds(amount = 1) {
      metaProgress.seeds += Math.max(0, Math.floor(amount));
      saveMetaProgress();
    },
    unlockBlueprint(id) {
      if (!weaponRecipes[id]) return false;
      if (!metaProgress.blueprints.includes(id)) metaProgress.blueprints.push(id);
      saveMetaProgress();
      return true;
    },
    addMaterials(materials = {}) {
      for (const material of Object.keys(materialNames)) metaProgress.materials[material] += Math.max(0, Math.floor(materials[material] || 0));
      saveMetaProgress();
    },
    plantSeed(index) {
      return plantSeed(index);
    },
    matureCrops() {
      for (const plot of metaProgress.plots) if (plot) plot.readyAt = 0;
      saveMetaProgress();
    },
    harvestPlot(index, force = false) {
      return harvestPlot(index, force);
    },
    craftWeapon(id) {
      return craftWeapon(id);
    },
    resetInput,
    useSkill() {
      activateSkill();
    },
    toggleGuide(open) {
      setGuideOpen(open === undefined ? !guideOpen : open);
    }
  };

  resize();
  if (ensureDailyMissions()) saveMetaProgress();
  else updateMetaUi();
  if (window.location && window.location.search.includes("autostart=1")) newGame();
  requestAnimationFrame(frame);
})();
