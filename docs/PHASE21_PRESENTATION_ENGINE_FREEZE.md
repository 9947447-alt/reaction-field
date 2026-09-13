# Phase 21 — Presentation Engine Freeze (Draft)

本文档为 Reaction Field Phase 21「呈现引擎架构原则与职责边界」的前瞻冻结草稿。

**当前状态**：草稿 / 原则路标（Draft Roadmap）。本文档只写原则，不写实现，不构成 Phase 20 的实施范围。

**实施门禁**：**未完成大厅和横屏桌子前，不开 Phase 21 实现 PR。**

---

## 0. 定位与背景

Reaction Field 在 Phase 20 完成了横屏卡牌客户端的三路由拆分（`/` 大厅、`/play` 备战+牌桌、`/debug` 调试实验室）与横屏牌桌语义。

Phase 21 探索在保留正式产品结构的基础上，为 `/play` 对局视口引入独立的呈现/渲染引擎（如 Canvas / WebGL / 轻量 2D 引擎），提供更细腻的卡牌动画、拖拽操作与视听反馈。

---

## 1. 核心架构原则 `[FROZEN PRINCIPLES]`

### 原则 1：Engine Authority 绝对保持，规则留在 TS
- 所有的化学反应判定、状态机流转、合法动作计算、NATBA 启发式策略决策、`AIObservation` 视窗以及 `engineReducer` 结算严格保留在 TypeScript 引擎（`src/game/engine`）。
- 呈现引擎仅作为纯视图层（View Layer）运行，消费经投影后的只读视图状态（如 `HumanPlayView`），只负责画面绘制、视觉动效与视听反馈。
- 呈现引擎严禁实现任何副状态机或本地规则裁决；用户手势与点击必须映射为标准 `GameAction` 派发给 TypeScript Engine 裁决。

### 原则 2：呈现引擎只画 `/play`
- 呈现引擎的作用域严格限制在 `/play`（正式备战与横屏牌桌）对局主视口。
- `/` 新大厅保持标准轻量 Web 客户端形态，不引入重型渲染引擎。
- `/debug` 调试实验室整页不改，继续保持现有标准 DOM 与全量调试检查能力。

### 原则 3：只写原则，不写实现
- 本文档不预设具体的第三方引擎依赖（不锁定 Pixi.js / Phaser / 原生 Canvas），不引入具体 API 实现代码或渲染循环伪代码。
- 不修改仓库依赖与构建体系；具体的呈现引擎技术选型与性能评估，必须在 Phase 20 全部大厅与横屏桌子完成验收后，单独发起评估与决策。

### 原则 4：与 Beta 2 规则演进正交解耦
- Phase 21 是纯表现层/呈现层的架构演进，不与 Beta 2（金属卡池、爱好者反击、氧化还原、水解、新离子等）规则变更绑定。
- 在单独的 Beta 2 规则 Freeze 签署前，底层化学规则与数据继续严格冻结于 `MVP0-P10`。
