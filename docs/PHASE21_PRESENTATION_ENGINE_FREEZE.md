# Phase 21 — Presentation Engine Freeze (Beta 2 Phase 1)

本文档为 Reaction Field Phase 21「`/play` 牌桌呈现引擎」的权威产品与工程契约冻结（Beta 2 Phase 1）。

除本文明确覆盖或修正的边界外，已合并的规则与架构冻结继续有效，包括但不限于 `docs/MVP0_RULE_FREEZE.md`、`docs/PHASE8_CHARACTER_RULE_FREEZE.md`、`docs/PHASE9_DEBUG_UI_RULE_FREEZE.md`、`docs/PHASE10_REACTION_EVENT_RULE_FREEZE.md`、`docs/PHASE13_NEW_PLAYER_GUIDANCE_FREEZE.md`、`docs/PHASE20_OFFICIAL_PLAY_UI_FREEZE.md` 与 Phase 20 所引用的其余 Freeze。

Phase 21 **不改写** MVP0-P10 规则、68 张普通实体卡池、技能数值、DIY 配方或 NATBA 算法。它冻结的是 `/play` 横屏牌桌 **呈现层** 的技术选型、职责边界、路由加载范围与体积修订授权；**不包含** Beta 2 规则包（金属卡池、氧化还原、水解、新离子、爱好者反击等），亦 **不** 引入 NATBA-2。

**文件状态：Frozen（Beta 2 Phase 1 实施合同）**

**实施门禁**：**本文合入 `main` 后，方可按本文 §7 切片顺序开启 Phase 21 实现 PR；第一刀实现不得先于本文合入。** 本文 **不** 宣称 Beta 2 整体完成，亦 **不** 宣称呈现引擎已落地。

---

## 0. 定位与背景 `[FROZEN]`

### 0.1 Beta 1 基线 `[KNOWN CURRENT STATE]`

- 仓库：`9947447-alt/reaction-field`
- **当前公开发布**：Beta 1，技术版本 `0.20.0-beta.1`，标签 `web-playtest-v0.20.0-beta.1`，规则版本 `MVP0-P10`
- Phase 20 已落地三路由：`/` 大厅、`/play` 备战 + 横屏桌子、`/debug` 调试实验室
- 正式牌桌（`DeskTable`）当前以 **DOM** 绘制 Phase 20 定义的牌桌 **四件套**（对手手牌区、中央公开场面、己方手牌横排点选、1～3 个主交互大按钮），并保留 `DeskActionBar`、正式日志抽屉、教学 `CoachBanner` 与 `isAllowedTutorialGameAction` 总闸
- 现网 JS gzip 约 **119002 / 120000**（脚本基线见 Phase 20 §8）；**几乎没有** 为第三方 2D 游戏引擎预留的余量

呈现引擎与飞牌大特效 **不在** Beta 1 交付范围；产品决策已改挂 **Beta 2 Phase 1**。Beta 1 事实以 `docs/PHASE20_OFFICIAL_PLAY_UI_FREEZE.md` 为准，本文只授权 Beta 2 Phase 1 的呈现层搬迁。

### 0.2 Phase 21 目标

在 **不改变** Engine Authority、Human Play View 可见性合同与 Phase 20 产品结构的前提下，用 **原生 Canvas 2D** 替换 `/play` 牌桌 DOM 表面（`desk-table__surface` 所承载的四件套绘制），保留按钮、日志、教学横幅等 **DOM** 壳层；手势与点选仍映射为既有 `GameAction`，经现有 `engineReducer` 裁决。

---

## 1. 核心架构原则 `[FROZEN]`

### 原则 1：Engine Authority 绝对保持，规则留在 TS

- 化学反应判定、状态机、合法动作、`AIObservation` 视窗、NATBA 策略与 `engineReducer` 结算 **严格保留** 在 `src/game/engine`（TypeScript）。
- 呈现层只消费经投影后的只读视图（如 `HumanPlayView` / 正式桌已有投影），负责绘制、动效与反馈。
- 呈现层 **禁止** 副状态机或本地规则裁决；用户手势 **只能** 映射为标准 `GameAction` 派发给 Engine。
- **Immutability**：Canvas 模块不得直接 mutate `GameState`；状态变更只经 reducer 产出新状态后再投影重绘。

### 原则 2：呈现引擎只服务 `/play` 牌桌视口

- 呈现引擎作用域 **仅限** `/play` 横屏牌桌主视口内、Phase 20 四件套所占据的 **`desk-table__surface`** 绘制面。
- `/` 新大厅保持轻量 Web 客户端，**不得** 加载 Phase 21 Canvas 呈现模块（含动态 import 链）。
- `/debug` 调试实验室整页不改，**不得** 加载 Phase 21 Canvas 呈现模块；继续保持 DOM 与全量调试能力。

### 原则 3：后端锁定原生 Canvas 2D，禁止第三方游戏引擎

- 本 Freeze **锁定** 浏览器 **原生 Canvas 2D API** 作为唯一牌桌 raster 后端。
- **禁止** 引入或依赖 Pixi.js、Phaser、Three.js 或同类 WebGL / 游戏引擎包来绘制牌桌四件套。
- 本文 **不写** 渲染循环伪代码或具体帧调度实现；选型与 API 用法留给实现 PR，但不得违背本原则。
- 不预设 WebGL 牌桌路径；若未来需评估其他后端，须 **新 Freeze** 修订，不得在本合同下悄悄替换。

### 原则 4：与 Beta 2 规则演进正交解耦

- Phase 21 是 **纯表现层** 演进，不与 Beta 2 规则包（金属卡池、氧化还原、水解、新离子、爱好者反击等）绑定实施。
- 在单独的 Beta 2 **规则** Freeze 签署前，底层化学规则与数据继续严格冻结于 **MVP0-P10**。
- Phase 21 实现 PR **不得** 夹带金属卡、新离子或规则 reducer 行为变更。

---

## 2. 呈现层职责与 DOM 分界 `[FROZEN]`

### 2.1 Canvas 替换范围

| 留在 DOM（Phase 20 契约保持） | 迁入 Canvas 2D（Phase 21） |
| :--- | :--- |
| `DeskActionBar`、1～3 个主交互大按钮 | 四件套 **视觉与 hit-test**：① 对手手牌区、② 中央公开场面、③ 己方手牌点选、④ 与四件套一体的桌面材质/布局（不含大按钮条） |
| 正式日志抽屉、`GameSummary`、成功反应提示等 | 四件套内卡牌、牌背、选中升起等 **绘制** |
| 教学 `CoachBanner`、跳过/完成教学控件 | — |
| 双方角色 / HP / 状态徽章（Phase 20：紧凑伴随上下区，不挤占四件套主视觉） | 可选：徽章仍 DOM；若实现 PR 将徽章画入 Canvas，须在 PR 说明且不改变可见性合同 |

**产品决策（Frozen）**：Canvas 2D **只替换** `desk-table__surface` 内的四件套绘制；**不** 把 ActionBar、日志、教学横幅整体搬进 Canvas。

### 2.2 模块加载

- Canvas 呈现模块须 **`import()` 动态加载**，且路由/组件边界保证 **`/` 与 `/debug` 的 JS 主包不因该 chunk 被动增大**（见 §5）。
- `/play` 仅在进入需要四件套的横屏桌子阶段加载该 chunk；备战 UI 若与桌子分包，备战路径同样 **不得** 强依赖 Canvas chunk，除非实现 PR 证明体积与路由隔离仍满足 §5。

---

## 3. 输入与教学总闸 `[FROZEN]`

### 3.1 只派发既有 GameAction

- Canvas 内 **不得** 判定出牌合法性、DIY 组合、响应窗口或胜负；只做 hit-test → `cardInstanceId` / 目标 id → **已有** `GameAction` 类型。
- 数据流保持 Phase 20 / MVP 0 单向链：`投影视图 → 绘制 → 手势 → dispatch(GameAction) → engineReducer → 新 GameState → 重绘`。
- 人机模式仍须遵守 Human Play View：**不得** 在 Canvas 中绘制或交互暴露对手私有未打出手牌内容。

### 3.2 交互式教学

- 教学局仍使用 `isAllowedTutorialGameAction`（或 Phase 20 等价总闸）在 **dispatch 之前** 拦截非法步骤；Canvas 路径 **不得** 绕过该总闸。
- 教学脚本、步骤推导与 Engine 裁决边界以 Phase 20 §7 为准；Phase 21 只改变四件套 **绘制与指针命中** 实现。

---

## 4. 非目标 `[FROZEN]`

以下 **不是** Phase 21 第一刀验收条件；可在后续切片追加，但 **不得** 作为签署本 Freeze 的前置，亦 **不得** 在第一刀 PR 中夹带规则或 NATBA 变更：

- 飞牌、抛物线、粒子、全屏特效、复杂 timeline 演出
- 基于 WebGL 的后处理、着色器牌桌、3D 牌面
- 大厅 banner 动效引擎化、`/debug` 可视化重写
- Beta 2 规则内容、NATBA-2、金属 / 氧化还原 / 水解 / 新离子
- 修改 `javascriptGzip` / `cssGzip` / `total` **数字本身**（数字变更只发生在实现 PR，见 §6）

**允许**：后续切片在四件套 Canvas 上增加 **运动与过渡**（例如选中升起动画、出牌位移），只要仍遵守 §3 且不加规则逻辑。

---

## 5. 体积门禁修订授权 `[FROZEN]`

Phase 21 可为 Canvas chunk 落地 **申请** 修订体积门禁（延续 Phase 20 §8 修订规则 spirit；**覆盖范围仅限 Phase 21 呈现层**）。

**当前脚本基线（不在本文改数字）**：`javascriptGzip` **120000** 等以 Phase 20 §8 与仓库脚本为准；现网约 **119002**，余量极小。

修订规则：

1. **禁止** 在本 Freeze PR 或纯文档 PR 中修改 `package.json` / 体积脚本数字。
2. 实现 PR 在 **测得** Canvas 呈现 chunk 对构建产物的影响后，方可按 Phase 20 §8 流程上调 `javascriptGzip`（及必要时 `total`），并在 PR 描述中写明 **测得 gzip、chunk 名、原因**。
3. **大厅包不得被 Canvas 拖大**：`/` 路由的 entry / 同步依赖链 **不得** 因 Phase 21 增加可测的 JS gzip；验收须包含「仅访问 `/` 不加载 canvas chunk」的构建或 E2E 级证据（具体断言方式由实现 PR 选择，但须可复现）。
4. **禁止** 用 Pixi / Phaser / Three 等引擎「换体积」；禁止削测试换门禁。

---

## 6. 实施路线 `[FROZEN]`

**顺序：Phase 21 Freeze（本文）→ 21-Surface → 21-Input → 21-Motion（可选）。禁止单 PR 完成全部呈现引擎与非目标特效。**

```
Phase 21 Freeze（本文：Canvas 2D 锁定、路由范围、GameAction 边界、体积授权）
    ↓
21-Surface（动态 import；仅 desk-table__surface 四件套 Canvas 绘制；DOM 壳与 ActionBar/日志/教学不变；parity 对照 Phase 20 DOM 可见性）
    ↓
21-Input（Canvas hit-test → cardInstanceId → 既有 GameAction；教学 isAllowedTutorialGameAction 仍在 dispatch 前）
    ↓
21-Motion（可选切片：升起/出牌过渡等；非第一刀验收）
```

每刀实现 PR 必须：

- 引用本 Freeze 与对应切片名
- 不夹带 MVP0-P10 规则或 Beta 2 规则包改动
- 满足 §2 路由隔离与 §6 体积规则

---

## 7. 验收摘要（合同级，非第一刀自动化清单）

签署本 Freeze 后，Phase 21 系列实现视为 **方向正确** 当且仅当持续满足：

1. 牌桌 raster **仅** 原生 Canvas 2D；仓库 **无** Pixi / Phaser / Three 游戏引擎依赖用于 `/play` 四件套。
2. **`/`、`/debug` 不加载** Phase 21 canvas 呈现模块。
3. **无 Canvas 内规则裁决**；仅 `GameAction` + reducer。
4. 规则版本仍为 **MVP0-P10**；无金属卡等新内容。
5. 第一刀（21-Surface + 必要 21-Input）**不要求** 飞牌大特效；DOM 功能 parity（按钮、日志、教学总闸）不回归。

---

## 8. 文档关系

- Beta 1 产品与 DOM 牌桌：`docs/PHASE20_OFFICIAL_PLAY_UI_FREEZE.md`（已发布事实不变）
- 规则：`MVP0-P10` 与各 Phase 8–10 Freeze
- 本文：**Beta 2 Phase 1** 呈现引擎实施合同；**不是** Beta 2 规则 Freeze
