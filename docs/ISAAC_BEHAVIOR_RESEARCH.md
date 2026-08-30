# 章节与首领行为调研

调研日期：2026-08-30

本项目只借鉴公开资料中描述的关卡结构和战斗行为，不复制原作名称、数值、美术、音频或文本。游戏内首领均使用原创中文名称、原创 Canvas 造型、重新设计的前摇提示与平衡参数。

## 原作下坠结构核验

社区 Wiki 的 `Chapter` 页面把路线划分为章节，而不是把 Basement、Cellar 等替代层串成连续十二层：

1. Chapter 1：Basement / Cellar / Burning Basement，包含 I、II 两层。
2. Chapter 2：Caves / Catacombs / Flooded Caves，包含 I、II 两层。
3. Chapter 3：Depths / Necropolis / Dank Depths，包含 I、II 两层。
4. Chapter 4：Womb / Utero / Scarred Womb，包含 I、II 两层。
5. Chapter 4.5：Blue Womb，可选支线。
6. Chapter 5：Cathedral 或 Sheol，二选一分支。
7. Chapter 6：The Chest 或 Dark Room，承接上一层的分支。

本地 H5 版将其压缩为 11 个可玩深度：前四章各两层、一个固定开放的裂隙试炼层、两层结局分支；每个深度包含战斗、宝库、精英、商店和 Boss 房，保证路线正确且单局长度可控。

来源：[Chapters](https://bindingofisaacrebirth.wiki.gg/wiki/Chapter)、[Bosses](https://bindingofisaacrebirth.wiki.gg/wiki/Bosses)

## 11 种行为原型

| Wiki 行为页 | 核验到的核心行为 | 本项目改编 |
| --- | --- | --- |
| [Larry Jr.](https://bindingofisaacrebirth.wiki.gg/wiki/Larry_Jr.) | 四方向移动，碰墙或障碍转向，移动中留下障碍物，分节身体可拆分 | 轴向蛇行、转弯预警、腐囊路径阻挡 |
| [Monstro](https://bindingofisaacrebirth.wiki.gg/wiki/Monstro) | 朝玩家跳跃、扇形喷射、离场后砸向玩家并在落点散射 | 影子落点、长短跳与落地环形弹幕 |
| [Chub](https://bindingofisaacrebirth.wiki.gg/wiki/Chub) | 随机四向移动，与玩家轴线对齐时冲锋，并召唤冲锋单位 | 轴线高亮、可预判冲锋和幼体召唤 |
| [Gurdy](https://bindingofisaacrebirth.wiki.gg/wiki/Gurdy) | 固定在房间上方，扇形射击并召唤不同小怪 | 固定炮台、交替扇射与双侧召唤 |
| [Peep](https://bindingofisaacrebirth.wiki.gg/wiki/Peep) | 制造伤害地面、跳跃落地环射，生命阈值脱落眼球并反弹移动 | 跳跃压场、腐池、阶段性反弹眼球 |
| [The Hollow](https://bindingofisaacrebirth.wiki.gg/wiki/The_Hollow) | 分节身体沿对角线飞行并在墙面反弹，可分裂 | 对角反弹、阶段加速、受击后分裂弹幕 |
| [The Bloat](https://bindingofisaacrebirth.wiki.gg/wiki/The_Bloat) | 起始即有脱落眼球，跳跃、伤害地面、侧向或下方光束 | 反弹眼球、跳跃腐池、有明显前摇的三向光束 |
| [Scolex](https://bindingofisaacrebirth.wiki.gg/wiki/Scolex) | 潜地后跃出，头部喷射，主要在尾部暴露时可受伤 | 潜地无敌、头部弹幕、尾部弱点窗口 |
| [Mom](https://bindingofisaacrebirth.wiki.gg/wiki/Mom) | 从房间边门伸手、召唤，并用逐渐扩大的阴影预警踩踏 | 四门攻击、目标阴影、踩踏清障碍与召唤 |
| [Mom's Heart](https://bindingofisaacrebirth.wiki.gg/wiki/Mom%27s_Heart) | 多阶段节拍弹幕、撤离/召唤循环、残血旋转光束 | 节拍环射、心跳冲击波、阶段加速与召唤 |
| [Satan](https://bindingofisaacrebirth.wiki.gg/wiki/Satan) | 三阶段：前置召唤、上方本体扇射/光束、双脚连续踩踏 | 三阶段终局考核：召唤、扇射光束、交替落脚 |

## 实现原则

- 复制的是“玩家要观察和应对什么”，不是逐帧脚本或原作数值。
- 所有高伤攻击增加统一的橙红色前摇，避免原作中部分近乎瞬发的不可读行为。
- 每个 Boss 保留三阶段结构，使现有战斗反馈、翻滚与构筑系统继续生效。
- 原作专有角色、怪物和场景名称不会出现在游戏成品中。
