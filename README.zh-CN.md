[English](./README.md) | 简体中文

# 反应域

**反应域（REACTION FIELD）** 是一款基于化学反应主题的开源策略卡牌游戏，基于 React、TypeScript 与 Vite 构建，当前以公开 **Web Playtest Alpha** 分发。

当前已公开发布技术版本为 `0.20.0-alpha.1`，发布标签为 `web-playtest-v0.20.0-alpha.1`，规则版本严格保持 `MVP0-P10`，不增加任何额外游戏规则。**这不是 Beta 1**。这是一个基于 React、TypeScript、Vite、Vitest 与 Playwright 的公开试玩版本，不是正式发行版。历史公开标签 `web-playtest-v0.16.0-alpha.2`（Reaction Field Alpha 6）等仍作为不可变历史标签保留。

## 核心规则书 — 扩展桌面规则参考

- [核心规则书（OneDrive）](https://1drv.ms/w/c/c8f765bca077d05c/IQCSnB79Sf12Qr23WokLeoXFASUzet25LWZcJu6Lyr1pwZ0)

外部《核心规则书》仅作为扩展桌面规则参考，不是当前 Web Playtest 的规则权威。当前网页试玩以仓库内适用的规则冻结文件、已实现行为和游戏内反馈为准。本次发布未重新独立验证所链接的 OneDrive 在线内容。

## 公开试玩地址与版本事实

- 公开试玩入口：[https://9947447-alt.github.io/reaction-field/](https://9947447-alt.github.io/reaction-field/)
- 当前公开发布频道：**Web Playtest Alpha**（非 Beta 1）
- 当前已发布技术版本：`0.20.0-alpha.1`
- 当前已公开发布标签：`web-playtest-v0.20.0-alpha.1`
- peeled SHA：`8db1e95a3454085f57f5c5ca470b102ac19115c1`
- 规则版本：`MVP0-P10`
- GitHub 标签发布：[web-playtest-v0.20.0-alpha.1](https://github.com/9947447-alt/reaction-field/releases/tag/web-playtest-v0.20.0-alpha.1)
- 官方仓库：[https://github.com/9947447-alt/reaction-field](https://github.com/9947447-alt/reaction-field)

当前已公开发布事实为：频道 Web Playtest Alpha，技术版本 `0.20.0-alpha.1`，规则版本 `MVP0-P10`，标签 `web-playtest-v0.20.0-alpha.1`。公开试玩入口是 `https://9947447-alt.github.io/reaction-field/`。**这不是 Beta 1**（当前尚无成品卡牌插画、专属音频与最终大厅包装，仍处于 Alpha 阶段）。历史标签 `web-playtest-v0.16.0-alpha.2` 与 `web-playtest-v0.13.0-alpha.2`（`57550f70856d5d5e27ac3fcb0fa508cd698d3be6`）保持不可变。

## 页面路由与产品架构

现网版本提供三条职责互斥、可独立访问与测试的路由路径：

- `/` **大厅（Lobby）**：产品主入口。提供模式选择（人机单人对战 / 本地双人对战）、新手交互式脚本教学入口以及“关于与帮助”。
- `/play` **横屏牌桌（Play Desk）**：承载战前阵容/模式确认与正式横屏牌桌。针对横屏主视口深度优化（移动端竖屏状态下自动显示「请横持」提示遮罩），采用点选与操作收敛的沉浸式牌桌交互。
- `/debug` **调试实验室（Debug Laboratory）**：开发者与规则复核实验室。保持历史全量公开信息展示（双方全明牌手牌、全量调试面板与规则流转状态）。

## 对战模式与手牌可见性

现行版本严格区分人机私密手牌与本地双人同屏公开手牌：

- **人机模式（Solo vs AI，默认推荐）**：与基于启发式策略的 NATBA AI 对战。
  - **人类私密视角**：人类玩家手牌正面可见；AI 对手未打出的手牌严格显示为**牌背与张数**，防止透视。
  - **公开信息**：双方角色、生命值（HP）、状态标记、技能使用记录、当前场面基准牌（`tableReference`）、弃牌堆、剩余牌堆张数、正式双语游戏日志以及**已公开的最近一次行动牌面**均为公共可见信息。
  - **信息泄露边界**：AI 策略仅消费经过受限投影的 `AIObservation`；正式牌桌 UI 严禁以任何方式将对手未打出的手牌 definitionId 或牌堆未来顺序暴露给人类玩家。
- **本地双人模式（Local Two-Player）**：
  - 供两位玩家在同一台设备上轮流操作。
  - 双方手牌仍保持**同屏正面公开**，沿用线下桌面游戏面对面切磋的公开验牌习惯。
- **新手引导与交互式教学**：
  - 可直接从大厅进入**交互式脚本教学局**（`?tutorial=1`）。
  - 通过手把手的可操作真实对局脚本，引导新手逐步完成出牌、元素化合反应、技能施放和周期推进，快速掌握游戏核心玩法。

## 核心玩法与规则范围（MVP0-P10）

- **卡池规模**：普通实体卡池严格冻结为 **68 张**；`event_lab_fire`（实验台起火）初始普通 `CardInstance` 数量为 0，不进入普通摸牌堆。
- **角色阵容**：支持 7 位已正式发布的角色及 49 种有序双人阵容，支持镜像角色对抗。默认预选角色为**实验室老师**与**化工厂 CEO**。
  - 实验室老师技能：**补课**（`extra_lesson`）
  - 化工厂 CEO 技能：**紧急调货**（`emergency_supply`）
- **核心对局循环**：备课阶段补牌、主行动阶段关联出牌（`tableReference`）或主动 DIY、角色技能发动、对手响应窗口判定、周期更替、回合初状态处理（持续伤害与灭火）、牌堆重洗、淘汰判定与胜负裁决。
- **结构化化学反应**：完整支持三类结构化成功反应事件：
  - 酸碱中和（`acid_base_neutralization`）
  - 酸与碳酸盐（`acid_carbonate_co2`）
  - SO2 碱性吸收（`so2_alkaline_absorption`）
  - 反应成功时触发约 2000ms 的非模态高亮提示；虚拟 H2O / CO2 仅作为反应效果结算，不生成物理实体卡牌实例。
- **安全与会话边界**：fatal 会话边界在初始化、重开或引擎操作发生未处理异常时立即停止损坏对局，移除旧 `GameState`，仅允许安全新建恢复或返回大厅。

## 国际化试玩与双语游戏日志

- **双语展示层**：原生支持简体中文与 English，根据浏览器偏好自动建议，并支持页面内实时切换（保留在当前页面生命周期中）。
- **结构化游戏日志**：正式日志基于单一权威载荷与强类型事件流驱动，出牌、响应、反应、DIY、状态结算均支持精准本地化呈现。
- **专有名词对应**：英文模式下碱性伤害展示为 `alkaline`，内部规则标识保持 `base`。
- **生产构建验证**：核心 UI 与关键路径具备正式 E2E 覆盖，生产 JavaScript bundle 在 Node 24 下具有充裕余量通过冻结的体积门限。

## 反馈 / Feedback

- 反馈表单入口：[Feedback / 反馈（在新标签页中打开 Microsoft Forms）](https://forms.cloud.microsoft/r/QG8PACUnsa)
- 反馈入口是仅由用户主动点击的普通外部链接。点击反馈会离开游戏，由 Microsoft Forms 收集和处理。游戏不会在点击前访问该链接，也不会自动发送手牌、日志、角色、浏览器环境、错误诊断、语言偏好或任何 `GameState` 数据。

## 本地运行与开发

### 固定工具链

- Node.js `24.18.0`（见 `.node-version`）
- pnpm `11.9.0`（见 `package.json#packageManager`）
- 仅为 E2E 安装 Playwright Chromium

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm run dev
```

构建与预览生产产物：

```bash
pnpm run build
pnpm run preview
```

### 测试与质量验证

运行常规与固定种子测试：

```bash
pnpm run test:run
pnpm run test:shuffle
```

运行 production-mode 独立 fixture 与 Chromium E2E 测试：

```bash
pnpm run test:e2e
```

运行覆盖真实 `dist/index.html` 路径的生产端测试：

```bash
pnpm run test:e2e:production
```

运行生产隔离与体积门禁检查：

```bash
pnpm run check:production
pnpm run check:size
```

生产依赖审计：

```bash
pnpm audit --prod
```

## 错误报告与隐私安全

若游戏遇到未捕获异常，fatal 页面仅提供安全脱敏的本地可复制诊断信息：

```text
名称：反应域
应用版本：0.20.0-alpha.1
规则版本：MVP0-P10
Commit：<短 SHA 或 dev/unknown>
错误码：<稳定错误码>
运行环境：<非敏感概要>
```

该诊断绝不包含原始 `Error.message`、堆栈、`GameState`、手牌、日志或用户状态，亦不会自动上传至任何外部服务器。

## 当前限制与延期边界

- **Alpha 试玩性质**：当前为 Web Playtest Alpha，无服务端账号、联机对战或持久化存档；刷新页面会重置当前对局。这不是 Beta 1。
- **手牌可见性**：人机对战提供人类私密视角与对手牌背；本地双人仍为同屏公开。
- **视口适配**：正式对局聚焦横屏牌桌设计；竖屏展示旋转提示。
- **延期特性**：真实金属卡池与实验反击金属选项、化学方程式牌、沉淀反应、响应 DIY、联网多人对局、天梯排行（ranked）、冒险模式（adventure）、账号体系与对局回放均延期至后续阶段。
- **已知兼容性**：iOS 27 beta 上的 Firefox 打开部分模态框可能偶发聚焦异常（`ROOT_RUNTIME_FAILED`），该问题尚未解决。
- **桌面包装**：Tauri、Electron、PWA、桌面安装包与自动更新暂未实现。

规则边界继续由 [`docs/MVP0_RULE_FREEZE.md`](docs/MVP0_RULE_FREEZE.md)、[`docs/PHASE8_CHARACTER_RULE_FREEZE.md`](docs/PHASE8_CHARACTER_RULE_FREEZE.md)、[`docs/PHASE9_DEBUG_UI_RULE_FREEZE.md`](docs/PHASE9_DEBUG_UI_RULE_FREEZE.md)、[`docs/PHASE10_REACTION_EVENT_RULE_FREEZE.md`](docs/PHASE10_REACTION_EVENT_RULE_FREEZE.md)、[`docs/PHASE12_REACTION_FIELD_WEB_PLAYTEST_FREEZE.md`](docs/PHASE12_REACTION_FIELD_WEB_PLAYTEST_FREEZE.md) 和 [`docs/PHASE20_OFFICIAL_PLAY_UI_FREEZE.md`](docs/PHASE20_OFFICIAL_PLAY_UI_FREEZE.md) 约束；阶段规划详见 [`docs/MVP_PLAN.md`](docs/MVP_PLAN.md)。

## 许可证与资产

- **源代码**：基于 [Apache-2.0](LICENSE) 许可开源；归属说明见 [NOTICE](NOTICE)。版权所有 © 2026 Nulledge 及 Reaction Field 贡献者。
- **品牌资产**：`public/brand/**` 下的文件受 [品牌资产说明](docs/REACTION_FIELD_BRAND_ASSETS.md) 约束，不属于 Apache-2.0 开源范围，严禁用于暗示官方认可或背书。
- **第三方依赖**：继续遵循其各自开源许可证。
