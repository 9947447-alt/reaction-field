# Phase 22 — B2-R1 Ion-Pair Reaction Freeze

**状态：Frozen v0.1。目标规则版本：`B2-R1`。本文件只冻结静态反应行合同，不实现 Engine。**

基线：`428b9962cb04e6e65db2178d00760a63ddd72816`。

## 0. 范围、权威与裁定来源

本文件将 Phase 22 §2.4 的开放示例收束为 **恰好 12 条**离子对反应行。每一行有稳定的 `IP-*` row ID、反应分类、精确反应组件及系数、展示方程式、结果身份、已有 definition 引用、Phase 10 / §3 交叉引用和可复核的源定位。

本任务用户明确裁定本文件的 §2.4 行成员、Ag₂CO₃ 准入、三个 overlap 的唯一 owner，以及三种氢氧化物的 result-only identity。这些决定用于收束上游没有唯一决定的范围，不冒称为旧源已有结论。Phase 10 Freeze 继续控制三个 legacy definition 的 ID 与事件语义；Card Pool Manifest Freeze 继续控制实体身份、池数量与 metal modes。本文件只在这些适用边界内补充 §2.4 exact table。

裁定证据：2026-10-05 原任务会话 `01a109e1-3605-7021-a9bd-2e64eec7798f` 第 2 次用户消息明确同意「12 行裁定包」，逐项授权上述成员、结果身份及 overlap。2026-10-05 接续任务用户另明确同意 **12 行统一水介质合同**：省略 medium 默认 `water`，显式水介质合法，空白、未知及任何非水介质整项 no match；不改变现有 redox matcher。这是本次补充授权，不是从手册或现有 redox 默认行为泛化所得。

其他来源按各自适用范围解释：

- `docs/PHASE22_B2_R1_RULE_FREEZE.md` 的 §1.3、§2、§3、§4 等合同继续有效；本文为开放的 §2.4 补充精确集合，不改动源文件，也不改动附录 A。
- `docs/PHASE22_B2_R1_CARD_POOL_MANIFEST_FREEZE.md` 是实体身份与数量的专项冻结；其 `definitionId`、21/39/49/97/344 数量和六种 metal modes 继续权威。沉淀标签不单独授权反应行。
- Phase 10 Freeze 与当前 `reactionDefinitions` / `SuccessfulReactionEvent` 确定三个既有 runtime definition 及语义；手册建议或本文件均不改写它们。
- 仓库手册 `docs/rules/ion-reaction-and-diy-manual-v1.0.docx` 的 §三「离子对反应总表」与 §四「按离子索引的反应手册」是行知识与逐行来源。● / △ 表示直接反应与条件或进阶规则，不单独将所有提及转成 executable row。

本文不改动任何既有 Freeze 文件；补充 §2.4 exact 边界，不覆盖 Manifest 的身份/数量/模式合同、Phase 10 runtime 或 Phase 22 附录 A。行外输入为 **no match**；不得根据溶解度标签、离子电荷、化学式推导、现实化学或通用反应引擎补行或补系数。

固定池合同仍为 **21 canonical ions、39 salts、49 redox rows、97 card definitions、344 ordinary cards、6 dual-use metal modes**；普通 starter deck 仍为 68 张。本文没有授予第 22 种 canonical ion、第 40 种 salt、第 50 条 redox row、新 definition 或新 Phase 10 `ReactionDefinitionId`。

### 0.1 接续审查证据矩阵

| 主题 | 已冻结规则 / 人类授权 | 当前实现与测试依据 | 本文处理 |
| --- | --- | --- | --- |
| 12 行成员、系数、产物 | Phase 22 §2.4、§3.5–§3.7；手册 §三/§四；原任务 12 行裁定 | `ions.ts`、`salts.ts`、`cardPool.ts` 提供 identity；现有 IP 表/matcher 尚不存在 | §2 封闭白名单；不将手册其他关系转成规则 |
| 组件单位与盐生成 | Manifest §4.1；Phase 22 §2.3 | `b2r1CardPool.test.ts` 的单单位来源、互斥 modes；`b2r1SaltGeneration.test.ts` 的 39 盐与严格配平 | §1 数量合同与 §4 独立盐入口保持 |
| redox 重叠 | Phase 22 §1.3；原任务 owner 裁定 | `redox.ts` 与 `b2r1Redox.test.ts` 保留三个 OR 行的 identity-set 匹配 | §3 只记录关系与 owner，不改旧 matcher |
| 介质 | 本轮用户统一水介质裁定 | 三个重叠 OR 行的 `water` 及省略默认行为只能证明旧模块，不自动授权其余 IP 行 | §1.3、§2 为全部 12 行明确介质 |
| 归一化 | 21 个规范离子；现有明确 aliases | `ions.ts: normalizeIonId`、`redox.ts: normalizeMediumId / normalizeReactionCondition`；对应盐/redox 测试 | §1.4 复用现有映射，验证 canonical 成员，不加 alias |
| runtime 与事件 | MVP0、Phase 10、Phase 18、Phase 22 Appendix A | `types.ts`、正式 `reducer.ts`、三条 `reactionDefinitions` 及 `reactionEvents.test.ts` | 只冻结静态合同，后置边界不变 |

本轮规则待裁定项已由水介质回复消除；工程输入形状按下文最小独立合同落实。core **201** / other **143**、六金属仅 `elemental` / `ion_component` 两种互斥模式、`Fe2(SO4)3` 白名单外负例、普通实体池排除 `event_lab_fire` 均保持。生产规则仍为 `MVP0-P10`，技术版本仍为 `0.20.0-beta.1`。

## 1. 静态合同与结果身份

### 1.1 输入与匹配字段

- 反应行只使用下表列明的 identity 与确切化学计量数。离子身份沿用 21 个 frozen canonical IDs；非离子物种使用已有静态物质身份。
- `×N` 表示 N 个组件单位，不是“该离子存在”的布尔标记。作为本次匹配输入提交的 selected component multiset 必须与该行输入 multiset **完全相等**；少项、多项、未知项或空白项均为整个输入 **no match**，不得先过滤非法项，也不得把重复项 set 去重。
- 一张组件实体最多贡献一个选定组件单位；同一离子在所需系数中出现多单位时，须以不同合法组件单位满足。不得重复使用同一实体实例凑数。该实体身份约束继承 Card Pool Manifest §4.1；本文件不实现实例选择或消费。
- 精确比较对象仅是本次提交的 selected component multiset。本文件不冻结 Engine 如何从牌或场上物种选出它，也不定义 spectators 的抽取、介质费用、反应牌区或牌的消费。纯输入中的 medium 合法性按 §1.3；不得先从提交的额外组件中剔除 spectators 再匹配。不得因现有 redox `solutionIons` 集合接口把本表系数退化成集合成员测试。
- 方程式系数是 row contract；heating 行只声明条件身份 `heating`。不冻结 heating 条件牌的提供方式、费用、窗口或消费。
- 既有 Phase 10 `SuccessfulReactionEvent` 继续按 Phase 10 合同产生。表中的 `legacyReactionDefinitionId` 是映射，不是新定义，也不把 Phase 10 runtime 改成按化学计量选牌的 matcher。

### 1.2 结果 / product definition

- 已有 `productDefinitionId` 只引用稳定的物质身份；本 §2.4 静态行本身不决定该 definition 的 `CardInstance` 创建、复制、移动或弃置语义，这些留给后续 Engine 冻结。
- `substance_nh3` 在加热放氨行中也只是普通物质身份引用；该引用不授权创建 NH₃ 实例、状态或所有权关系。
- `acid_base_neutralization` 的 Phase 10 event result 继续是虚拟 H₂O。`acid_carbonate_co2` 的 Phase 10 event result 继续是虚拟 CO₂；方程式中的 H₂O 不增加 event product。二者即使另有 `substance_h2o` 或 `substance_co2` definition，也不创建实例。
- SO₂ 行保留 equation display `SO₃²⁻ + H₂O`，并以 `absorption:so2-alkaline` 标识静态反应结果；H₂O 可引用 `substance_h2o` 作为 display identity，但不增加 Phase 10 event product。Phase 10 结果仍只为 `damage-cancelled` 或 `status-removed`；不创建 CardInstance、token、亚硫酸根 canonical ion 或残留 status。
- `Cu(OH)₂`、`Fe(OH)₃`、`Fe(OH)₂` 没有 ordinary `CardDefinition`。依本任务用户裁定，本次静态任务只保存 formula、displayFormula 与产物系数作为 **result-only formula identity**；本次不创建 ordinary definition、CardInstance、token、status 或 zone，后续实例语义仍由 Engine 冻结决定。
- 对以上 result-only 行，ASCII `formula` 是不可变结果身份，`resultId` 固定为 `formula:<ASCII formula>`；产物 `count` 独立记录，`displayFormula` 仅用于显示。
- SO₂ 吸收式中的 `SO₃²⁻` 是展示方程式的结果身份，不是新增 canonical ion，不进入 21-ion 集合；本文件也不创建亚硫酸盐 card 或 residual status。
- Result identity 不决定所有权、目标、所在牌区、存续、伤害、状态清除或后续反应。

### 1.3 最小纯 matcher 输入与拒绝语义

下一刀只提供一个独立对象输入：必填 `components: readonly string[]`，可选 `medium: string`、`conditions: readonly string[]`。这是待实现的输入合同，不声称当前已有此 API；函数及类型命名可遵循仓库风格，不增加位置参数或 scalar overload，不接收 redox 的 `reactants / solutionIon / solutionIons / condition` 字段，也不隐式合并这些字段。对象之外的输入及额外字段均 no match。

- `components` 为展开的组件单位数组：每个元素贡献一个单位；表内重复 identity 按次数计数。输入顺序不影响结果，归一化后必须与某一行的完整 multiset 完全相等；不按比例放大/约分，不匹配子集，不 set 去重。`["H+", "H+", "CO32-"]` 命中放气行；一个 H⁺ 不足、三个 H⁺ 过量均不命中。需要的重复组件合法，超出行系数的重复组件非法。
- components 缺失、空数组、非数组、稀疏数组，或任何非字符串、空白、未知、额外项，都使整个输入 no match。不得过滤非法项再匹配，不强制转换数字/对象。实体实例唯一性由将来调用方保证；纯 matcher 不读取 CardInstance 或 GameState，也不能证明两次相同 ion identity 来自不同实例。
- 12 行的 `medium` 都是 `water`。省略或值为 `undefined` 时默认 `water`；显式字符串须经 §1.4 归一为 `water`。空字符串、纯空白、未知值、`null`、非字符串及任何非水介质均 no match。H⁺ 输入不是把 medium 改为酸介质的授权；medium 是上下文身份，不贡献 H₂O 组件，不要求水牌，也不决定费用。
- `conditions` 省略或值为 `undefined` 等价于 `[]`。11 条无条件行要求精确 `[]`；仅 `IP-GAS-AMMONIUM-HYDROXIDE-HEAT` 要求归一化后精确一个 `heating`。重复条件（包括两个 alias 归一到 heating）、额外条件、未知或空白项、非字符串、非数组和稀疏数组均整项 no match，不过滤未知条件、不 set 去重。`high_temperature` 不替代 `heating`；条件不计入 components 数量。
- 匹配成功仅返回唯一 IP row 身份及只读静态数据；no match 不返回候选成功行或可执行效果。reason 文案与函数名不构成规则。相同规范输入重复调用结果确定，调用方数组及对象（包括 frozen 输入）保持原值；不得原地排序、消费组件、修改状态或触发其他 matcher。

### 1.4 Canonical identity 与 normalization / aliases 边界

规范 identity 唯一为 `H+、NH4+、Na+、K+、Ca2+、Mg2+、Ba2+、Al3+、Fe2+、Fe3+、Zn2+、Cu2+、Ag+、OH-、Cl-、NO3-、CO32-、SO42-、F-、Br-、I-`。参与匹配的离子输入及归一化输出使用这些 canonical IDs；`CO3^2-`、`SO4^2-` 和 Unicode 展示式不会成为新 ID。SO₃²⁻ 等展示结果按 §1.2 单独表示，不能进入规范离子集合。

- 离子输入先验证为字符串并 trim，再复用现有 `ions.ts` 的 `normalizeIonId`；其返回值必须再次确认是字符串且属于 `B2R1_ALL_ION_DEFINITIONS` 的 canonical ID 集合，不能只凭 truthy 接受未知项或对象原型键。可接受 alias 严格限于该模块在 Base 中明确声明的映射（含 `CO3^2-`、`SO4^2-`、`CO3²⁻`、`CO₃²⁻`、`SO₄²⁻` 与其余已声明 Unicode 离子式）。不得增加大小写转换、名称推断、formula 解析或新 alias；归一化后的重复单位仍保留次数。
- 唯一非离子输入使用 canonical formula `SO2`，映射既有 `substance_so2` identity。components 不接收 `substance_so2` 作为 formula，也不自动移植 redox 私有 reactant alias（如 `so2`、`SO₂`、`二氧化硫`）；不能为复用私有 helper 改造现有 redox 模块。产物 definition link 不构成新的输入 alias。
- medium 复用 `normalizeMediumId`，仅接受其 Base 中已声明且结果为 `water` 的 `water / 水 / H2O / H₂O`（允许首尾空白）。现有酸介质 alias 归一成功后仍因非水被拒绝；不新增介质或 alias。
- conditions 复用 `normalizeReactionCondition`，先保留原数组基数再逐项归一校验；本包仅 `heating / 加热 / heat` 可用于唯一 heating 行，其他已有条件身份不能替代它或成为无条件行的额外许可。不修改 normalization helper 或既有 redox 接受/拒绝行为。

## 2. Frozen v0.1 exact row whitelist

以下 12 条构成完整且封闭的集合。行序及 row ID 不依赖数组下标；`IP-*` 与 `OR-*` 及 Phase 10 runtime ID 使用不同命名空间。

### 2.1 中和：1 条

| rowId | reactionKind | 输入组件 multiset | medium | conditions | 方程式 / 结果身份 | 已有 definition / 映射 | 来源定位 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `IP-NEUTRALIZATION-H-OH` | `neutralization` | `H+ ×1`, `OH- ×1` | `water` | `[]` | H⁺ + OH⁻ → H₂O；product `H2O ×1` | `productDefinitionId: substance_h2o`; `legacyReactionDefinitionId: acid_base_neutralization`；Phase 10 event result 仍为 virtual H₂O | Phase 22 §2.4 第 1 项；手册 §三 H⁺ 行 × OH⁻ 列、§四 4.1 `OH⁻` 与 4.2 `H⁺` 行；Phase 10 §二 |

### 2.2 气体生成：2 条

| rowId | reactionKind | 输入组件 multiset | medium | conditions | 方程式 / 结果身份 | 已有 definition / 映射 | 来源定位 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `IP-GAS-ACID-CARBONATE` | `gas_evolution` | `H+ ×2`, `CO32- ×1` | `water` | `[]` | 2H⁺ + CO₃²⁻ → CO₂↑ + H₂O；products `CO2 ×1`, `H2O ×1` | `productDefinitionId: substance_co2, substance_h2o`; `legacyReactionDefinitionId: acid_carbonate_co2`；Phase 10 event result 仍为 virtual CO₂，H₂O 仅为 equation product | Phase 22 §2.4 第 2 项；手册 §三 H⁺ 行 × CO₃²⁻ 列、§四 4.1 `CO₃²⁻` 行；Phase 10 §三 |
| `IP-GAS-AMMONIUM-HYDROXIDE-HEAT` | `gas_evolution` | `NH4+ ×1`, `OH- ×1` | `water` | `[heating]` | NH₄⁺ + OH⁻ —【加热】→ NH₃↑ + H₂O；products `NH3 ×1`, `H2O ×1` | `productDefinitionId: substance_nh3, substance_h2o` (identity references only); redox cross-reference `OR-NH4-OH-heat`; no Phase 10 mapping or new event outcome | Phase 22 §2.1 NH₄⁺ 用途、§3.7 `OR-NH4-OH-heat`; 手册 §三 OH⁻ 行 × NH₄⁺ 列、§四 4.2 `NH₄⁺` 与 4.6 `NH₄⁺` 行；将此 overlap 纳入 §2.4 是本任务用户裁定 |

### 2.3 吸收：1 条

| rowId | reactionKind | 输入组件 multiset | medium | conditions | 方程式 / 结果身份 | 已有 definition / 映射 | 来源定位 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `IP-ABSORPTION-SO2-OH` | `absorption` | `SO2 (substance_so2) ×1`, `OH- ×2` | `water` | `[]` | equation display: SO₂ + 2OH⁻ → SO₃²⁻ + H₂O；static result `absorption:so2-alkaline`; display products `SO3^2- ×1`, `H2O ×1` | `legacyReactionDefinitionId: so2_alkaline_absorption`; redox cross-reference `OR-SO2-OH`; `productDefinitionId: substance_h2o` (equation display identity only); SO₃²⁻ is not a canonical ion or ordinary definition | Phase 22 §2.4 第 3 项、§3.6 `OR-SO2-OH`; 手册 §四 4.2 `SO₂` 行；Phase 10 §四。由 §2.4 唯一拥有此 overlap 是本任务用户裁定 |

### 2.4 沉淀：8 条

| rowId | reactionKind | 输入组件 multiset | medium | conditions | 方程式 / 结果身份 | 已有 definition / 映射 | 来源定位 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `IP-PRECIPITATION-BASO4` | `precipitation` | `Ba2+ ×1`, `SO42- ×1` | `water` | `[]` | Ba²⁺ + SO₄²⁻ → BaSO₄↓；product `BaSO4 ×1` | `productDefinitionId: substance_baso4` (identity link only; instance semantics deferred) | Phase 22 §2.4 第 4 项、§2.3 BaSO₄ 配方；手册 §三 Ba²⁺ 行 × SO₄²⁻ 列、§四 4.3 `Ba²⁺` 行 |
| `IP-PRECIPITATION-BACO3` | `precipitation` | `Ba2+ ×1`, `CO32- ×1` | `water` | `[]` | Ba²⁺ + CO₃²⁻ → BaCO₃↓；product `BaCO3 ×1` | `productDefinitionId: substance_baco3` (identity link only; instance semantics deferred) | Phase 22 §2.1 Ba²⁺ 用途、§2.3 BaCO₃ 配方；手册 §三 Ba²⁺ 行 × CO₃²⁻ 列、§四 4.4 `Ba²⁺` 行 |
| `IP-PRECIPITATION-CACO3` | `precipitation` | `Ca2+ ×1`, `CO32- ×1` | `water` | `[]` | Ca²⁺ + CO₃²⁻ → CaCO₃↓；product `CaCO3 ×1` | `productDefinitionId: substance_caco3` (identity link only; instance semantics deferred) | Phase 22 §2.4 第 4 项、§2.3 CaCO₃ 配方；手册 §三 Ca²⁺ 行 × CO₃²⁻ 列、§四 4.4 `Ca²⁺` 行 |
| `IP-PRECIPITATION-AGCL` | `precipitation` | `Ag+ ×1`, `Cl- ×1` | `water` | `[]` | Ag⁺ + Cl⁻ → AgCl↓；product `AgCl ×1` | `productDefinitionId: substance_agcl` (identity link only; instance semantics deferred) | Phase 22 §2.4 第 4 项、§2.3 AgCl 配方；手册 §三 Ag⁺ 行 × Cl⁻ 列、§四 4.5 `Ag⁺` 行 |
| `IP-PRECIPITATION-AG2CO3` | `precipitation` | `Ag+ ×2`, `CO32- ×1` | `water` | `[]` | 2Ag⁺ + CO₃²⁻ → Ag₂CO₃↓；product `Ag2CO3 ×1` | `productDefinitionId: substance_ag2co3` (identity link only; instance semantics deferred) | Phase 22 §2.3 Ag₂CO₃ 盐配方及“进阶沉淀”说明；手册 §三 Ag⁺ 行 × CO₃²⁻ 列、§四 4.4 `Ag⁺` 行。将进阶行授权为 executable v0.1 是本任务用户裁定 |
| `IP-PRECIPITATION-CUOH2` | `precipitation` | `Cu2+ ×1`, `OH- ×2` | `water` | `[]` | Cu²⁺ + 2OH⁻ → Cu(OH)₂↓；resultId: `formula:Cu(OH)2`, formula `Cu(OH)2`, count `1`, displayFormula `Cu(OH)₂` | result-only formula identity; no ordinary definition | Phase 22 §2.1 Cu²⁺ 用途；手册 §三 Cu²⁺ 行 × OH⁻ 列、§四 4.2 `Cu²⁺` 行；result-only identity 是本任务用户裁定 |
| `IP-PRECIPITATION-FE3OH3` | `precipitation` | `Fe3+ ×1`, `OH- ×3` | `water` | `[]` | Fe³⁺ + 3OH⁻ → Fe(OH)₃↓；resultId: `formula:Fe(OH)3`, formula `Fe(OH)3`, count `1`, displayFormula `Fe(OH)₃` | result-only formula identity; no ordinary definition; overlap `OR-Fe3-OH` | Phase 22 §3.5 `OR-Fe3-OH`; 手册 §三 Fe³⁺ 行 × OH⁻ 列、§四 4.2 `Fe³⁺` 行；由 §2.4 唯一拥有 overlap 及 result-only identity 是本任务用户裁定 |
| `IP-PRECIPITATION-FE2OH2` | `precipitation` | `Fe2+ ×1`, `OH- ×2` | `water` | `[]` | Fe²⁺ + 2OH⁻ → Fe(OH)₂↓；resultId: `formula:Fe(OH)2`, formula `Fe(OH)2`, count `1`, displayFormula `Fe(OH)₂` | result-only formula identity; no ordinary definition | Phase 22 §2.1 Fe²⁺ 用途；手册 §三 Fe²⁺ 行 × OH⁻ 列、§四 4.2 `Fe²⁺` 行；result-only identity 是本任务用户裁定 |

**行数复核：** `neutralization = 1`、`gas_evolution = 2`、`absorption = 1`、`precipitation = 8`，合计 **12**。完整 row ID 集合恰为本节 12 行；不接受表外 row。

## 3. Phase 10、redox 与沉淀结算唯一性

### 3.1 Phase 10 三条既有 definition

| 本表 rowId | 唯一 legacyReactionDefinitionId | 本 Freeze 对 runtime 的约束 |
| --- | --- | --- |
| `IP-NEUTRALIZATION-H-OH` | `acid_base_neutralization` | 保留 Phase 10 的合法酸碱 DAMAGE 响应触发；结果是虚拟 H₂O，不创建 CardInstance、token 或临时资源 |
| `IP-GAS-ACID-CARBONATE` | `acid_carbonate_co2` | 保留 Phase 10 的酸性 DAMAGE 被实体 CO₃²⁻ 或实体 Na₂CO₃ 成功响应的触发；CO₂ 是虚拟结果，不创建 CardInstance、token 或临时资源 |
| `IP-ABSORPTION-SO2-OH` | `so2_alkaline_absorption` | 保留 Phase 10 的即时 SO₂ DAMAGE 抵消与 SO₂_LEAK 状态处理两种触发；不增加 definition、CardInstance、reaction chain 或 SuccessfulReactionEvent 数量 |

Phase 10 继续只有上述三个正式 `ReactionDefinitionId`。`FIRE` 处理不是 reaction；不得为这 12 条新增 production `ReactionDefinitionId`，也不得改变现有事件日志、触发、结果或 continuation。

### 3.2 §3 redox overlap 的 owner

Phase 22 §1.3 将 ion-pair recognition 排在 redox whitelist 之前；原任务用户进一步指定下列三个化学关系的 canonical resolution owner 为本 §2.4 IP row。纯数据层只记录 owner / cross-reference 元数据；对应 `OR-*` 行与现有 redox matcher 均保留原合同及独立可匹配结果，不把它们降为不可匹配行。未来 Engine 不得对同一次事件双重结算，但本次及下一刀不实现调度、抢占、自动 fallback、resolution 或事件去重。

| redox rowId | 唯一 IP owner | 冻结关系 |
| --- | --- | --- |
| `OR-Fe3-OH` | `IP-PRECIPITATION-FE3OH3` | 同一 Fe³⁺ / OH⁻ 沉淀输入仅识别和结算一次 |
| `OR-SO2-OH` | `IP-ABSORPTION-SO2-OH` | 同一 SO₂ / OH⁻ 吸收输入仅识别和结算一次；另沿用 Phase 10 definition mapping |
| `OR-NH4-OH-heat` | `IP-GAS-AMMONIUM-HYDROXIDE-HEAT` | 同一 NH₄⁺ / OH⁻ / heating 输入仅识别和结算一次 |

`OR-NH3-H` 不属于本 Freeze 的 §2.4 whitelist；它仍是 §3.7 的独立 redox row，本文件不给它新增 IP row 或第五种 reaction kind。它与 NH₄⁺ / OH⁻ 加热放氨不能合并：反应身份和输入均不同。`OR-Na2FeO4-purify` 虽产生 Fe(OH)₃，但反应物不同，不与 `IP-PRECIPITATION-FE3OH3` 重叠。

化学关系重叠不等于两个 matcher 的序列化输入相同：现有 redox `solutionIons` 按 identity-set 匹配，`OR-Fe3-OH` 仍接受 `[Fe3+, OH-]`，`OR-SO2-OH` 仍接受 SO₂ 与 `[OH-]`；不能把新 IP 所需的三个或两个 OH⁻ 单位塞入旧接口改变其拒绝重复项的行为。IP 对应行分别需要 OH⁻ ×3、×2，少单位整项 no match；NH₄⁺/OH⁻ 的两种 identity 与单一 heating 条件也独立保留旧 OR 合同。现有 `OR-Fe-Cu2` / `OR-Zn-Cu2` 的 canonical matcher 返回继续为既有 `OR-Fe-Cu` / `OR-Zn-Cu`。新 IP matcher 不调用旧 matcher，不截断或转换输入以代替旧行为。

### 3.3 49-row audit matrix

以下按 Phase 22 §3 小节逐条对照冻结的全部 49 个 row ID。除表中标明的三个化学关系重叠外，其余行没有与本文件任何 IP row 相同的反应关系；两模块的 matcher 数量合同按 §3.2 区分，相同产物式不构成相同输入或双重结算。

| Phase 22 §3 rowId | 对 §2.4 whitelist 的审查结果 |
| --- | --- |
| `OR-Mg-H` | 无相同输入 IP row |
| `OR-Zn-H` | 无相同输入 IP row |
| `OR-Fe-H` | 无相同输入 IP row |
| `OR-Al-H` | 无相同输入 IP row |
| `OR-Cu-H` | 无相同输入 IP row；§3 明示不反应 |
| `OR-Ag-H` | 无相同输入 IP row；§3 明示不反应 |
| `OR-Mg-Cu` | 无相同输入 IP row |
| `OR-Zn-Cu` | 无相同输入 IP row |
| `OR-Fe-Cu` | 无相同输入 IP row |
| `OR-Mg-Ag` | 无相同输入 IP row |
| `OR-Zn-Ag` | 无相同输入 IP row |
| `OR-Fe-Ag` | 无相同输入 IP row |
| `OR-Cu-Ag` | 无相同输入 IP row |
| `OR-Cl2-Br` | 无相同输入 IP row |
| `OR-Cl2-I` | 无相同输入 IP row |
| `OR-Br2-I` | 无相同输入 IP row |
| `OR-Cl2-F` | 无相同输入 IP row；§3 明示不反应 |
| `OR-Fe-Fe3` | 无相同输入 IP row |
| `OR-Fe2-Cl2` | 无相同输入 IP row |
| `OR-Fe-Cu2` | 无相同输入 IP row；与 §3.3 Fe/Cu²⁺ 的保留关系不构成本表反应 |
| `OR-Fe2-H2O2` | 无相同输入 IP row |
| `OR-Fe3-OH` | 与 `IP-PRECIPITATION-FE3OH3` 输入重叠；IP row 唯一 owner |
| `OR-S-O2` | 无相同输入 IP row |
| `OR-SO2-Cl2` | 无相同输入 IP row |
| `OR-SO2-O2` | 无相同输入 IP row |
| `OR-S-Fe` | 无相同输入 IP row |
| `OR-SO2-OH` | 与 `IP-ABSORPTION-SO2-OH` 输入重叠；IP row 唯一 owner |
| `OR-Cu-HNO3-dil` | 无相同输入 IP row |
| `OR-Cu-HNO3-conc` | 无相同输入 IP row |
| `OR-Fe-HNO3-dil` | 无相同输入 IP row |
| `OR-NH4-OH-heat` | 与 `IP-GAS-AMMONIUM-HYDROXIDE-HEAT` 输入及条件重叠；IP row 唯一 owner |
| `OR-NH3-H` | 不纳入本 §2.4 whitelist；继续由既有 §3.7 row 表达 |
| `OR-KMnO4-HCl-conc` | 无相同输入 IP row |
| `OR-MnO2-HCl-conc` | 无相同输入 IP row |
| `OR-NaClO-HCl` | 无相同输入 IP row |
| `OR-Cl2-H2` | 无相同输入 IP row |
| `OR-Zn-Cu2` | 无相同输入 IP row；保留的重复授权 ID 不改变本表 |
| `OR-Al-Cu2` | 无相同输入 IP row |
| `OR-Mg-Fe2` | 无相同输入 IP row |
| `OR-H2-CuO` | 无相同输入 IP row |
| `OR-C-CuO` | 无相同输入 IP row |
| `OR-CO-CuO` | 无相同输入 IP row |
| `OR-Fe2O3-CO` | 无相同输入 IP row |
| `OR-Fe2O3-H2` | 无相同输入 IP row |
| `OR-KMnO4-Fe2` | 无相同输入 IP row |
| `OR-Na2O2-H2O` | 无相同输入 IP row |
| `OR-KClO3-MnO2` | 无相同输入 IP row |
| `OR-Na2S2O3-I2` | 无相同输入 IP row |
| `OR-Na2FeO4-purify` | 无相同输入 IP row；虽有 Fe(OH)₃ 产品，输入不同 |

本矩阵仍计 **49** 个原有 redox row ID；不删除、改名或新增任何 `OR-*` 行。`OR-Fe-Cu2`、`OR-Zn-Cu2` 等既有 redox compatibility/canonicalization 关系按 Phase 22 原合同保持。

## 4. §2.3 盐 DIY 与 precipitate recognition

- 本文件冻结的 precipitate recognition 是化学行白名单；它不删除、不缩减、不覆盖 §2.3 的 **39-salt Strict Stoichiometric DIY** 合法输出。BaSO₄、BaCO₃、CaCO₃、AgCl、Ag₂CO₃ 等仍可按各自已冻结的盐配方构建实体盐 definition。
- `substance_*` 在沉淀行中是 product identity link；§2.4 行不裁定相应 Engine 实例语义。§2.3 盐构建动作继续按既有合同产生实体盐卡，且不因本 whitelist 而失去合法性。
- §1.3 的物质反应识别优先级与 §2.3 的 DIY 盐构建入口不同；不得以某个 ion-pair row 或 precipitate 标记否定盐配方合法性，也不得借 DIY recipe 扩增 §2.4 whitelist。
- manifest 的 `isPrecipitate` / solubility 是盐身份元数据，不是行授权。尤其不得据此新增 `CaSO₄`、`Ag₂SO₄`、`MgCO₃`、`ZnCO₃` 等手册 §三 / §四 没有授权的 §2.4 行。

## 5. 静态数据合同与 Engine 边界

当前静态层已有 canonical ion definitions、39 条 salt definitions、97 条 card definitions 与 49 条 redox rows，可为本表身份与现存 definition link 提供来源。当前 `B2R1RedoxReactionDefinition` 的 solution ion 字段是 ion identity 集合，不承载本表逐项 stoichiometric count；本文件是未来静态 Ion Pair data implementation 的合同，不代表 matcher 或 runtime 已具备本行为。

后续 Engine 必须另外决定并实现实际触发时点、行动/响应窗口、目标与归属、所选 CardInstance 的合法性与消费、反应先后及结算续接。本 Freeze 不为这些行为建立第二条 runtime 路径。

## 6. 明确后置与禁止扩展

下列内容不属于本 Freeze 的 executable semantics，继续等待独立 Engine / rules Freeze：

- Zn(OH)₂ 与 Al(OH)₃ 暂缓：手册 §三列出带 ● 的产物公式，但 §四没有对应的完整计量方程及输入系数；不得以现实化学知识推补反应计量、溶解度边界或两性/过量碱规则。`NH3 + H+` 仍只由 §3.7 `OR-NH3-H` 表达，不纳入本 §2.4 whitelist。

- 沉淀状态窗口、沉淀归属、离子封存及被封存离子所在来源；
- 零伤害盐主行动收益；
- 任一 precipitate 的 CardInstance、token、status、zone、ownership、discard 或 lifecycle；
- H₂O、CO₂、NH₃ 或吸收产物是否在除既有 Phase 10 语义外创建实例、资源、状态或后续效果；
- 加热条件的实际费用、牌的选择/消费和窗口时机；
- 响应 DIY runtime、通用反应链、沉淀后的进一步反应；
- Phase 22 附录 A 中列明的全部后置项，包括强制 DIY 标签。

禁止 generic solubility solver、generic ionic-equation engine、由电荷或 formula 推导反应/系数、`isPrecipitate` 自动扩行、all-insoluble-salts heuristic、现实化学 fallback、未列反应别名，以及通过创建普通 definition 补齐本表结果。

表外输入、表外物质组合和未满足表中精确组件计量或条件的组合均为 **no match**。本文件以外来源不能隐式增加 IP row。

## 7. 下一刀最小静态实现与测试边界

只允许新增本表 12 行的只读 IP 数据、必要的 IP 类型、按 §1.3/§1.4 的独立纯 matcher、数据入口的最小导出及对应单元测试。每行保存 stable rowId、reactionKind、按单位计数的输入、medium、conditions、静态产物/结果 identity、既有 definition link、legacy mapping、overlap reference 与来源；嵌套数组/对象同样只读。不得扩充 ions、salts、cardPool、49-row redox 或 Phase 10 definitions；不实现 CardInstance 到 components 的 runtime adapter。

最小验收测试应覆盖：

1. 完整 12-ID 集合唯一性、分类计数 1/2/1/8、每行输入系数/产物/来源/link，全部行至少一条合法输入及倒序输入；各行 components 所需重复单位保留。
2. 每行少一个单位、多一个单位、额外合法 identity、未知/空白项与对应 alias 混合；components 缺失、空数组、稀疏数组、非字符串/非数组；不接受化学计量等比例放大。逐项校验后整项拒绝，不能过滤、去重或子集命中。
3. 12 行省略/undefined medium 与显式 water、已声明水 alias 的正例；空白、未知、非水、null/非字符串反例。11 行只接受无条件输入；heating 行覆盖缺失、正确 alias、重复、额外、未知/空白、非字符串/非数组/稀疏条件反例。
4. 既有 ion aliases 与 canonical 身份一致；未知及对象原型键不能越过 canonical 成员验证；SO2 只接收 §1.4 formula。只读/frozen 输入不变，重复调用确定，不读写 GameState。
5. 表外 `NH3 + H+`、Zn/Al 氢氧化物、CaSO4/Ag2SO4/MgCO3/ZnCO3、手册其他气体链均不能成为 IP 新行；Fe2(SO4)3 仍是盐生成负例。NO3- 盐构建不额外产生沉淀行。
6. 保留现有三个 overlap OR 行的集合匹配及 canonical 返回、39 盐全部合法输出和难溶/微溶资格、21/39/49/97/344、core201/other143、六金属互斥 modes、starter68、普通池排除 event_lab_fire，以及三条 Phase 10 event 原语义；复用已有测试，不复制一套生产规则。

该实现切片仍不涉及 Engine 接线、全局优先级 dispatcher、沉淀状态/封存、伤害数值、组件消费、生成实例生命周期、响应 DIY、Appendix A 或发布元数据。这里的测试范围是下一刀实现验收，不为本次纯文档任务新增模拟文档内容的测试，也不宣称 IP matcher 已实现。
