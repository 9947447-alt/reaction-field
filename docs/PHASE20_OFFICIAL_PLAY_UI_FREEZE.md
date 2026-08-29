# Phase 20 — Official Play UI / Beta 1 Foundation Freeze

本文档为 Reaction Field Phase 20「正式对局界面与 Beta 1 产品基础」的权威产品与工程契约冻结。

除本文明确覆盖或修正的边界外，已合并的规则与架构冻结继续有效，包括但不限于 `docs/MVP0_RULE_FREEZE.md`、`docs/PHASE8_CHARACTER_RULE_FREEZE.md`、`docs/PHASE9_DEBUG_UI_RULE_FREEZE.md`、`docs/PHASE10_REACTION_EVENT_RULE_FREEZE.md`、`docs/PHASE13_NEW_PLAYER_GUIDANCE_FREEZE.md`、`docs/PHASE15_FIRST_GAME_CONVERSION_FREEZE.md`、`docs/PHASE16_BILINGUAL_GAME_LOG_FREEZE.md`、`docs/PHASE17_BRAND_IDENTITY_FREEZE.md`、`docs/PHASE18_DYNAMIC_DIY_FOUNDATION_FREEZE.md` 与 `docs/PHASE19_NATBA_FOUNDATION_FREEZE.md`。

Phase 20 **不改写** MVP0-P10 规则、卡池、技能数值、DIY 配方或 NATBA 算法。它冻结的是正式玩法表面、可见性、开局产品、调试入口、布局、资产与体积门禁修订权。

---

## 0. 发布身份与基线 `[KNOWN CURRENT STATE]`

- 仓库：`9947447-alt/reaction-field`
- Canonical trunk：`main`
- 冻结起草基线：`19a1212ed61cd3b9ee9abb7031ebcbc87fe8ae4b`（Phase 18E.1 合并后；若 trunk 继续前进，以实现 PR 的实际 `origin/main` 为准）
- 公开试玩身份：Reaction Field Alpha 6，`0.16.0-alpha.2`，规则 `MVP0-P10`
- 当前 UI 性质：Phase 9 Debug Alpha 可玩闭环 + Phase 19F/19G 人机接入 + Phase 18E Selection-First DIY
- 目标产品身份：**Beta 1 正式对局界面**（技术版本号由 20G 收口时单独锚定，本 Freeze 不预先写死版本号）

---

## 1. 目的与 Beta 1 成功标准 `[FROZEN]`

Phase 20 把公开试玩从「Debug Alpha 模拟器」升级为「可独立玩的正式本地对局」。

Beta 1 必须同时满足：

1. 正式对局页看起来是卡牌桌，不是调试控制台。
2. 默认开局是 **人机**；「本地双人」是显式选项。
3. 人机使用 **人类私密视角**；双人同屏仍公开双方手牌。
4. 调试工具不住在正式对局页。
5. 390×844 竖屏与横屏双栏都能完成一局。
6. 首局教学按正式 UI + 默认人机 + 私密视角重写。
7. 规则版本仍为 `MVP0-P10`。

---

## 2. 可见性合同 `[FROZEN]`

### 2.1 产品决策

| 模式 | 人类玩家可见 | 禁止 |
| :--- | :--- | :--- |
| **人机（Solo vs NATBA）** | 自身手牌正面；对手手牌 **背面 + 张数**；双方角色 / HP / 状态 / 技能使用记号 / 场面基准 / 弃牌堆 / 牌堆余张 / 正式日志 | 对手手牌 `definitionId` 与实例内容；牌堆未来顺序 |
| **本地双人** | 保持 Phase 9 公开调试可见性：双方手牌正面同屏可见 | 不在 Phase 20 做两台设备 / 座位遮挡私密 |

NATBA Policy 继续只能消费 `AIObservation`。人机模式下，**正式 UI 也不得**把对手私有手牌内容渲染给人类。

### 2.2 泄露边界

人机正式路径禁止从以下渠道露出对手手牌内容或牌堆顺序：

- 手牌区、选中态、DIY 候选、普通出牌 / 响应 / 状态处理列表
- 卡牌 debug 行、折叠 JSON、Log ID、`rulesText` 原始块
- 配置页预览、首局示例若演示对手手牌

正式渲染日志仍可公开展示已发生的事件（出牌、反应、状态）；这不等于展示对手**当前**手牌。

### 2.3 视图投影

- Engine 仍持有完整 `GameState`。
- 人机正式 UI 必须经 **Human Play View** 投影后再渲染；禁止页面直读对手 `player.hand` 的 definition。
- 双人模式可继续使用现有公开视图。
- `VisibilityMode = "public-debug"` 仅属于调试实验室，不得作为人机正式默认。

---

## 3. 开局与会话产品 `[FROZEN]`

- 刷新进入配置页时，默认：`player_1 = human`，`player_2 = ai`，策略默认 NATBA-1.x。
- 必须提供显式「本地双人」选项：双方 `human`，可见性走 §2 双人行。
- 默认阵容仍为实验室老师 vs 化工厂 CEO。
- NATBA-0 / NATBA-1 仅可在调试实验室注入，正式开局不展示策略切换器。
- 正式标题与状态文案按实际模式显示（人机 / 双人）；禁止把注入的 NATBA-0 写死成 NATBA-1。

---

## 4. 正式界面与调试实验室 `[FROZEN]`

- 正式路由（生产 `dist` 默认入口）只服务玩家对局：配置、对局桌、结束、About/教学、fatal。
- **调试实验室** 是独立页面（路由或明确 debug 入口），可保留夹具、Log ID、JSON、控制方注入、公开视图。
- 生产隔离检查必须继续保证正式 `dist` 无 fixture / private marker。
- Fixture E2E 走调试实验室；production E2E 走正式页。

---

## 5. 布局与可玩表面 `[FROZEN]`

正式对局页至少包含：

- 双方区：角色、HP、状态、手牌
- 场面基准
- 当前操作（备课 / 主行动 / 响应 / 状态 / 反击 / DIY Context）
- 正式日志

布局合同：

- **390×844 竖屏**：单列文档流，无横向溢出。
- **横屏双栏**：至少能同时看到双方区与操作区；不得只放大竖屏页。
- 不强制斗地主式手牌上浮动画。
- 手牌以卡面展现，不是调试表格。

视觉真值由 Grok Imagine 设计出图，由用户提供入库。缺图时允许 CSS 卡框底线落地，不得阻塞 20A–20D。

---

## 6. 资产与 Imagine `[FROZEN]`

- 图标、卡背、卡框、角色小标由用户用 Grok Imagine 制作并提供。
- 仓库只做接入与压缩，不在本阶段自动生成批量插画。
- 静态资产放 `public/`（或既有 `public/brand/**` 约定），遵守 `docs/REACTION_FIELD_BRAND_ASSETS.md`。
- 禁止为资产引入新的 UI 组件库或图标字体库。

---

## 7. 教学 `[FROZEN]`

- Phase 13 / 15 的旧 Debug Alpha 引导不得原样当作 Beta 1 教学。
- 20F 必须按「默认人机 + 私密视角 + 正式桌面」重写首局教学。
- 教学仍是纯展示：不 dispatch `GameAction`，不复制规则裁定。
- 可折叠 / 跳过 / 恢复；刷新重置。
- 人机教学不得展示对手私有手牌内容。

---

## 8. 体积门禁修订授权 `[FROZEN]`

用户已批准：Phase 20 正式 UI 可为落地修订体积门禁。这是对 `docs/PHASE16_BILINGUAL_GAME_LOG_FREEZE.md` §21「不得提高现有门禁」在 **Phase 20 正式界面范围内** 的明确授权覆写。

当前脚本基线（`[KNOWN CURRENT STATE]`）：

- `javascriptGzip`：108000
- `cssGzip`：10 × 1024
- `total`：500 × 1024

修订规则：

1. 允许为正式 UI、双布局、教学与静态资产上调 `scripts/check-size.mjs` 中的 JS / CSS / total 门禁。
2. 每次上调必须在对应实现 PR 中同时改脚本并在 PR 说明新门禁数值与原因；禁止静默只为让 CI 变绿而改。
3. 仍禁止为了超门限引入大型 i18n 库、在 `GameState.log` 里双份保存中英文案、或削减必要测试。
4. Imagine 静态图走 `total`（原始文件体积），不进 JS gzip；图过大优先压缩 / 减少张数，再考虑上调 total。
5. 本 Freeze 不预先写死新门禁数字；数字由实测后的实现 PR 落地。

---

## 9. 实施路线 `[FROZEN]`

```
Phase 20 Freeze   本文档
    ↓
20A 正式桌面壳（竖屏 + 横屏双栏；手牌可仍公开）
    ↓
20B 开局产品（默认人机 + 本地双人选项）
    ↓
20C 人机私密视角
    ↓
20D 调试实验室拆移
    ↓
20F 正式教学重写
    ↓
20G Beta 1 收口（版本 / About / 门禁落地 / Pages）
```

**20E Imagine 资产接入** 可与 20A–20F 并行，不堵塞私密视角。

每个实现阶段独立 PR。禁止单 PR 同时做私密视角 + 教学重写 + 调试拆移 + 全套插画。

---

## 10. 工程与测试合同 `[FROZEN]`

- 全部对局操作仍只 dispatch 既有 `GameAction`，经 `engineReducer` 结算。
- 不新增 UI 状态库。
- 双语保留。
- 20B / 20C / 20D 必须同步 E2E与产品文案契约；允许删除仅属于 Debug Alpha 的旧断言。
- 20C 必须有「人机隶属检查」测试：正式视图不出现对手手牌 definition。
- NATBA-2、自对弈调权、金属玩法不在 Phase 20。

---

## 11. 非目标 `[NON-GOAL]`

- 改规则、卡池、技能数值、新 DIY 配方
- NATBA-2 浅层搜索与新一轮调权
- 双人私密视角（两台设备 / 座位遮挡）
- 存档、联机、账号、回放、遥测
- 响应 DIY、沉淀、方程式牌、金属卡
- Tauri / Electron / PWA / service worker

---

## 12. 裁决层级

1. 本文档中已 `[FROZEN]` 的 Phase 20 产品合同
2. 其它已合并 Freeze（规则以 MVP0-P10 / Phase 8–18 为准）
3. 仓库已实现且未被本文覆盖的正确行为

若对话意图与本文冲突：先改 Freeze 再改代码。
