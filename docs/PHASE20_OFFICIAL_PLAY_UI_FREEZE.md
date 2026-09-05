# Phase 20 — Official Play UI / Beta 1 Foundation Freeze

本文档为 Reaction Field Phase 20「正式对局界面与 Beta 1 产品基础」的权威产品与工程契约冻结。

除本文明确覆盖或修正的边界外，已合并的规则与架构冻结继续有效，包括但不限于 `docs/MVP0_RULE_FREEZE.md`、`docs/PHASE8_CHARACTER_RULE_FREEZE.md`、`docs/PHASE9_DEBUG_UI_RULE_FREEZE.md`、`docs/PHASE10_REACTION_EVENT_RULE_FREEZE.md`、`docs/PHASE13_NEW_PLAYER_GUIDANCE_FREEZE.md`、`docs/PHASE15_FIRST_GAME_CONVERSION_FREEZE.md`、`docs/PHASE16_BILINGUAL_GAME_LOG_FREEZE.md`、`docs/PHASE17_BRAND_IDENTITY_FREEZE.md`、`docs/PHASE18_DYNAMIC_DIY_FOUNDATION_FREEZE.md` 与 `docs/PHASE19_NATBA_FOUNDATION_FREEZE.md`。

Phase 20 **不改写** MVP0-P10 规则、卡池、技能数值、DIY 配方或 NATBA 算法。它冻结的是正式玩法表面、可见性、开局产品、调试入口、布局、成品视觉、交互教学与体积门禁修订权。

---

## 0. 发布身份与基线 `[KNOWN CURRENT STATE]`

- 仓库：`9947447-alt/reaction-field`
- Canonical trunk：`main`
- 本次 Freeze 修正起草基线：`88ce5636cbe3b0209de583770745fde5147bb9ab`（Phase 20C 私密视角 + 公开最近行动合并后）
- 公开试玩身份：Reaction Field Alpha 6，`0.16.0-alpha.2`，规则 `MVP0-P10`
- 已落地：20A 桌面壳、20B 默认人机、20C Human Play View 与公开最近行动
- 当前性质：**内部试玩 / Alpha**。缺少成品插画与独立正式页的建造不得称 Beta
- 目标产品身份：**Beta 1**（技术版本号由 20G 收口时锚定，本 Freeze 不预先写死版本号）

---

## 1. 目的与 Beta 1 成功标准 `[FROZEN]`

Phase 20 把公开试玩从「Debug Alpha 模拟器」升级为「可交付给玩家的正式本地对局」。

**没有成品视觉（插画 / 卡背 / 卡框 / 角色标 / 桌面材质）就不是 Beta 1，仍是内部试玩。** CSS 卡框只能支撑内部迭代，不能当作发布标准。

Beta 1 必须同时满足：

1. 存在两条路径：**正式产品页** 与 **调试实验室**。正式页零调试暴露。
2. 正式页是可交付的卡牌桌：插画齐、手牌可按「点选 + 出牌」操作。
3. 默认开局是 **人机**；「本地双人」是显式选项。
4. 人机使用 **人类私密视角**；双人同屏仍公开双方手牌。已打出 / 响应 / 状态处理 / DIY 结果的牌是公开信息。
5. 390×844 竖屏与横屏双栏都能完成一局。
6. 首局教学是 **交互式脚本局**，不是 Debug Alpha 的折叠说明。
7. 规则版本仍为 `MVP0-P10`。

---

## 2. 可见性合同 `[FROZEN]`

### 2.1 产品决策

| 模式 | 人类玩家可见 | 禁止 |
| :--- | :--- | :--- |
| **人机（Solo vs NATBA）** | 自身手牌正面；对手手牌 **背面 + 张数**；双方角色 / HP / 状态 / 技能使用记号 / 场面基准 / 弃牌堆 / 牌堆余张 / 正式日志 / **已公开的最近行动牌面** | 对手**未打出**手牌 `definitionId` 与实例内容；牌堆未来顺序 |
| **本地双人** | 双方手牌正面同屏可见 | 不在 Phase 20 做两台设备 / 座位遮挡私密 |

NATBA Policy 继续只能消费 `AIObservation`。人机模式下，**正式 UI 也不得**把对手私有未打出手牌渲染给人类。

### 2.2 泄露边界

人机正式路径禁止从以下渠道露出对手**当前未打出**手牌内容或牌堆顺序：

- 手牌区、选中态、DIY 候选、普通出牌 / 响应 / 状态处理列表
- 卡牌 debug 行、折叠 JSON、Log ID、`rulesText` 原始块（正式页不得出现）
- 配置页预览、教学若演示对手私有手牌

正式日志与「最近行动」可公开展示已发生的出牌 / 响应 / 状态 / DIY 结果。测试不得只断言 DOM 无 `definitionId`；必须断言看不到对手私有牌的本地化名称、规则文本与操作按钮。

### 2.3 视图投影

- Engine 仍持有完整 `GameState`。
- 人机正式 UI 必须经 **Human Play View** 投影后再渲染。
- 双人模式可继续使用公开视图。
- `VisibilityMode = "public-debug"` 仅属于调试实验室。

---

## 3. 开局与会话产品 `[FROZEN]`

- 刷新进入正式配置页时，默认：`player_1 = human`，`player_2 = ai`，策略默认 NATBA-1.x。
- 必须提供显式「本地双人」选项。
- 默认阵容仍为实验室老师 vs 化工厂 CEO。
- NATBA-0 / NATBA-1 仅可在调试实验室注入。正式页不展示策略切换器，不展示每座位控制方下拉。
- 正式标题按实际模式显示；禁止把注入的 NATBA-0 写死成 NATBA-1。

---

## 4. 正式页与调试实验室 `[FROZEN]`

必须两条入口，禁止再把调试控件摸进正式对局页。

- **正式产品页**（生产 `dist` 默认入口，建议 `/`）：配置、对局桌、结束、About、交互教学、fatal。禁止出现 Log ID、JSON、夹具标记、每座位控制方、未折叠的调试属性表。
- **调试实验室**（建议 `/debug`）：可保留夹具、Log ID、JSON、控制方注入、公开视图、旧 Debug Alpha 面板。
- 生产隔离检查：正式入口产物无 fixture / private marker。
- Fixture E2E 走调试页；production E2E 走正式页。

---

## 5. 布局与可玩表面 `[FROZEN]`

正式对局页至少包含：

- 双方区：角色、HP、状态、手牌
- 场面基准与最近公开行动
- 当前操作（备课 / 主行动 / 响应 / 状态 / 反击 / DIY Context）
- 正式日志（无调试 JSON）

交互目标：

- 己方手牌 **横排点选**，再点「出牌 / 响应 / 处理 / DIY」。
- 人机对手手牌 **背面横排 + 张数**。
- 不要求斗地主式飞牌动画；要求的是同一套点选语义，不是调试表格。

布局合同：

- **390×844 竖屏**：单列，无横溢。
- **横屏双栏**：双方区与操作区同屏。

---

## 6. 成品视觉与 Imagine `[FROZEN]`

视觉是 Beta 1 主线，不是顺手插图。

- 卡背、卡框、角色小标、HP/状态图标、桌面材质、模式图标由用户用 Grok Imagine 制作并提供。
- 仓库只做接入与压缩，不批量自动生成插画。
- 资产放 `public/` 或 `public/brand/**`，遵守 `docs/REACTION_FIELD_BRAND_ASSETS.md`。
- 禁止新 UI 组件库 / 图标字体库。
- **缺图：** 可用 CSS 底线推进 20D / 桌面结构；**不得打 Beta 1 标签、不得改 README 身份为 Beta。**

---

## 7. 交互式首局教学 `[FROZEN]`

本节覆盖 `docs/PHASE13_NEW_PLAYER_GUIDANCE_FREEZE.md` 与 `docs/PHASE15_FIRST_GAME_CONVERSION_FREEZE.md` 中「引导纯展示、不 dispatch」的 Beta 1 口径。Phase 13/15 仍是历史 Debug Alpha 引导的历史冻结。

- 旧 Debug Alpha 折叠说明不得当作 Beta 1 教学。
- Beta 1 教学是 **受控脚本对局**：玩家按步骤点当前高亮的合法操作。
- 引导可以 `dispatch` 既有 `GameAction`，**必须** 经 `engineReducer` 结算。禁止教学层直接改 HP、手牌、牌堆或胜负。
- 默认脚本：人机、老师 vs CEO、私密视角。步骤至少覆盖：看手牌 → 点选出牌 → 看到 AI 公开打出的牌 → 响应或过。
- 可跳过；跳过后进入普通正式对局。刷新重置。
- 人机教学不得展示对手私有未打出手牌。
- 不复制规则裁定。合法性仍由 Engine 裁决。

---

## 8. 体积门禁修订授权 `[FROZEN]`

Phase 20 正式 UI 可为落地修订体积门禁（覆盖 Phase 16 §21 在本阶段范围内）。

当前脚本基线（`[KNOWN CURRENT STATE]`）：

- `javascriptGzip`：120000（20C 已从 108000 上调）
- `cssGzip`：10 × 1024
- `total`：500 × 1024

修订规则：

1. 允许为正式 UI、双入口、交互教学与静态资产再次上调 JS / CSS / total。
2. 每次上调必须在实现 PR 中改脚本并写明新数字与原因。
3. 禁止大型 i18n 库、日志双份存中英文、削测试换门禁。
4. Imagine 图走 `total`；过大先压缩 / 减张，再上调 total。

---

## 9. 实施路线 `[FROZEN]`

```
Phase 20 Freeze（含本次 Beta 1 产品杠修正）
    ↓
20-Vis  资产清单 + Imagine 出图（用户出图，仓库接入）
    ↓
20D     正式页 / 调试实验室双入口
    ↓
20-Table 正式桌面点选手牌（横排）
    ↓
20-Tut  交互式首局教学
    ↓
20G     Beta 1 收口（仅当插画与正式页均已齐）
```

20A–20C 已合并，不再重做。资产可与 20D / 20-Table 并行，但 **20G 被插画堵塞**。

禁止单 PR 同时做调试拆移 + 全套插画 + 教学重写。

---

## 10. 工程与测试合同 `[FROZEN]`

- 全部对局操作仍只 dispatch 既有 `GameAction`，经 `engineReducer` 结算。
- 不新增 UI 状态库。
- 双语保留。
- 正式页 E2E 不得依赖调试 DOM。
- 人机隶属检查必须断言本地化牌面文案缺席，不是只断言没有 raw id。
- NATBA-2、自对弈调权、金属玩法不在 Phase 20。

---

## 11. 非目标 `[NON-GOAL]`

- 改规则、卡池、技能数值、新 DIY 配方
- NATBA-2 浅层搜索与新一轮调权
- 双人私密视角（两台设备 / 座位遮挡）
- 存档、联机、账号、回放、遥测
- 响应 DIY、沉淀、方程式牌、金属卡
- Tauri / Electron / PWA / service worker
- 用 CSS 底线冒充 Beta 1

---

## 12. 裁决层级

1. 本文档中已 `[FROZEN]` 的 Phase 20 产品合同
2. 其它已合并 Freeze（规则以 MVP0-P10 / Phase 8–18 为准；Beta 1 教学以本文 §7 为准）
3. 仓库已实现且未被本文覆盖的正确行为

若对话意图与本文冲突：先改 Freeze 再改代码。
