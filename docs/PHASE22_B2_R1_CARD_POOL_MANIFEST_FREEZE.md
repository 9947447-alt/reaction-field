# Phase 22 — B2-R1 Card Pool Manifest

**文件状态：Frozen v0.1。目标规则版本：`B2-R1`；本文件不代表运行时已实现或上线。**

基线 Git object：`0956f19aefdab9819be0dc35dacaaa21de87a641`。本专项合同冻结 **97 个可抽取 definition、344 张普通实体主牌堆实例**，用于下一任务实现 card definitions + deck manifest；不实现 Engine。运行中规则仍为 `MVP0-P10`，普通 starter deck 仍为 68 张，技术版本仍为 `0.20.0-beta.1`。

## 0. Authority / Supersession

本文件是较新的专项 Freeze。**唯一覆盖点**：对 [Phase 22 §2.1](PHASE22_B2_R1_RULE_FREEZE.md#21-阳离子b2-r1-卡面可提供的离子) 的“单质金属不直接提供上表离子，除非经 §3 氧化还原行转化”，仅以 §2.2 明确列出的 Mg / Al / Zn / Fe / Cu / Ag **牌面双模式**替代该限制：玩家可在一次结算中选择 elemental mode 或 ion-component mode。

这是牌面明确授权的模式选择，**不是单质自动电离**。只授权 Mg²⁺、Al³⁺、Zn²⁺、Fe²⁺、Cu²⁺、Ag⁺ 这六种离子组件模式；Fe 不提供 Fe³⁺。不得推导其他金属、其他价态、额外模式或通用自动电离。除这一覆盖点外，既有 Phase 22 化学合同继续保持权威；数量、ID 和严格组件计量是本专项的数据细化，不构成对整个上游规则的隐式重写。

规范集合保持 **13 cations + 8 anions = 21 ions、39 salts、49 redox rows**。盐构建结果仍严格限于 `B2R1_SALT_CATALOG` 的 39 种。**Fe₂(SO₄)₃ 不在白名单，没有预印实例，也不得 DIY 生成**；即便 Fe³⁺ ×2 + SO₄²⁻ ×3 电荷平衡、计量正确，也必须拒绝。不得新增第 40 种盐，不修改既有 Phase 22 Freeze 文件。

下游解释顺序：本节唯一覆盖点 → 其余 Phase 22 Frozen 合同 → 未被覆盖的 MVP0 / Phase 10 等已合并 Freeze。遇到表外物质、效果或未冻结的 Engine 消费语义，不得以现实化学知识补全。

## 1. 清单字段与数量硬合同

下列 §2 是唯一普通抽牌 inventory，每行只出现一个 `definitionId`。ID 是稳定 snake_case，沿用已有同语义 ID；浓稀分开，金属双模式共用一个 ID。`count` 是首版每副完整主牌堆的实例张数，**不是 definition 数量**。同一 ID 的多张实例必须具有互不重复的 instance identity。

表中 `formula / display` 的左值为 ASCII 化学身份，右值为卡面展示；条件牌没有化学式，左值为条件 key。`category` 为本 Manifest 的互斥统计类别，不能用 tags 重复计数。`tags` 为稳定能力/关联元数据；`—` 表示空集合。新增 B2-R1 元数据不宣称已属于当前 Engine `Tag` 或 `CardType` 类型。`ion_component`、`dual_use`、`reagent` 等标记本身不授予表外反应、伤害或响应时机。

`ionsProvided / modes / conditionProvided` 只按所在行和后文定义解释：独立离子与金属 ion-component mode 每张提供一个单位；物质的离子组成不等于免费拆牌、多单位 DIY 组件或通用自动电离。条件能力与物质身份分开，不得把条件当额外反应物。§2.10 盐表的签名是**生成它所需的输入 multiset**，不是消耗一张盐就可拿到该 multiset 的授权。

关联分类：基础元素为 `nonmetal`，双用途金属为 `metal`，卤素单质为 `halogen`（以 F₂/Cl₂/Br₂/I₂ 物质身份参与行，不等于游离原子组件）；离子按规范 ion identity 关联，物质按 formula、已声明离子组成和 Frozen 行关系关联。条件按精确 condition key 关联。此元数据不绕过 7C / `tableReference`，不授予新 Engine 出牌入口；主动 DIY、响应及状态窗口继续遵守适用时机合同。

| category | definitions | cards | 保守统计侧 |
| --- | --- | --- | --- |
| independent_ion | 15 | 110 | core |
| dual_use_metal | 6 | 50 | core |
| base_element | 3 | 20 | core |
| condition | 5 | 21 | core |
| halogen_elemental | 4 | 18 | other |
| base_molecule_gas | 6 | 29 | other |
| named_reagent_oxide | 11 | 39 | other |
| dilute_acid_base | 6 | 14 | other |
| concentrated_acid | 2 | 4 | other |
| salt | 39 | 39 | other |

人工分组核对：核心 110 + 50 + 20 + 21 = **201**；其余 18 + 29 + 39 + 14 + 4 + 39 = **143**；总计 201 + 143 = **344**。definitions：15 + 6 + 3 + 5 + 4 + 6 + 11 + 6 + 2 + 39 = **97**。

**组件驱动硬合同：component/core cards > ready-made/complex cards，即 201 > 143。** 这是最低意义上的组件优势（201/344，约 58.43%）：将 Cl₂、H₂、O₂、试剂等全部保守计入成品/复杂物质；这些牌实际也可参加组合，真实玩法的 component-capable 占比更高。不得以调池名义反转为成品多于组件；更改固定数量须新的显式 Freeze 修订。

预印稀酸/稀碱共 14 张，相关独立组件去重后为 H⁺、Cl⁻、SO₄²⁻、NO₃⁻、Na⁺、K⁺、Ca²⁺、OH⁻，共 **70 张**。均匀随机从完整主牌堆抽一张时，该预印集合的概率为 14/344，小于组件集合的 70/344。各成品的预印张数/相关组件张数分别为 HCl 3/20、H₂SO₄ 2/20、HNO₃ 2/18、NaOH 3/20、KOH 2/18、石灰水 2/18；这些组件集合有重叠，不得把分母重复相加。这里比较实体供给，不保证任意一手能凑齐 recipe。

## 2. 普通实体牌清单

### 2.1 独立离子：110 张 / 15 definitions

category 全部为 `independent_ion`；每张只有表列离子一个单位的 ion-component 能力，规范 ID 采用 `CO32-`、`SO42-`，不是旧展示别名。

| definitionId | 中文名 | formula / display | count | ionsProvided（每张 ×1） | tags | 用途 / Frozen linkage |
| --- | --- | --- | --- | --- | --- | --- |
| ion_h | 氢离子 | H+ / H⁺ | 10 | H+ | ion_component, acid | §2.3 稀酸；§3 酸性来源 |
| ion_nh4 | 铵根离子 | NH4+ / NH₄⁺ | 6 | NH4+ | ion_component | §2.3 铵盐；§3.7 加热链 |
| ion_na | 钠离子 | Na+ / Na⁺ | 8 | Na+ | ion_component | §2.3 钠盐/稀碱 |
| ion_k | 钾离子 | K+ / K⁺ | 6 | K+ | ion_component | §2.3 钾盐/稀碱 |
| ion_ca | 钙离子 | Ca2+ / Ca²⁺ | 6 | Ca2+ | ion_component | §2.3 钙盐/石灰水 |
| ion_ba | 钡离子 | Ba2+ / Ba²⁺ | 4 | Ba2+ | ion_component | §2.3 钡盐 |
| ion_fe3 | 铁(III)离子 | Fe3+ / Fe³⁺ | 6 | Fe3+ | ion_component | §2.3 铁(III)盐；§3.5 |
| ion_oh | 氢氧根离子 | OH- / OH⁻ | 12 | OH- | ion_component, base, alkaline-absorb | §2.3 稀碱；Phase 10 吸收/中和 |
| ion_cl | 氯离子 | Cl- / Cl⁻ | 10 | Cl- | ion_component | §2.3 氯化物/稀 HCl |
| ion_no3 | 硝酸根离子 | NO3- / NO₃⁻ | 8 | NO3- | ion_component | §2.3 硝酸盐/稀 HNO₃ |
| ion_co3 | 碳酸根离子 | CO32- / CO₃²⁻ | 8 | CO32- | ion_component, carbonate | §2.3 碳酸盐；Phase 10 CO₂ |
| ion_so4 | 硫酸根离子 | SO42- / SO₄²⁻ | 10 | SO42- | ion_component | §2.3 硫酸盐/稀 H₂SO₄ |
| ion_f | 氟离子 | F- / F⁻ | 4 | F- | ion_component, halogen | §2.2；OR-Cl2-F 明示不反应；不授予 HF DIY |
| ion_br | 溴离子 | Br- / Br⁻ | 6 | Br- | ion_component, halogen | §3.4 卤素置换 |
| ion_i | 碘离子 | I- / I⁻ | 6 | I- | ion_component, halogen | §3.4 卤素置换 |

### 2.2 双用途金属：50 张 / 6 definitions

category 全部为 `dual_use_metal`，tags 全部为 `dual_use, metal, ion_component`。两个 mode 的稳定标识为 `elemental` 与 `ion_component`，没有默认同时选中模式。

| definitionId | 中文名 | formula / display | count | elemental mode | ion_component mode（×1） | 用途 / Frozen linkage |
| --- | --- | --- | --- | --- | --- | --- |
| element_mg | 镁 | Mg / Mg | 8 | Mg | Mg2+ | §2.3 镁盐；§3.2/3.3/3.9 |
| element_al | 铝 | Al / Al | 7 | Al | Al3+ | §2.3 铝盐；§3.2 去膜/§3.9 |
| element_zn | 锌 | Zn / Zn | 8 | Zn | Zn2+ | §2.3 锌盐；§3.2/3.3/3.9 |
| element_fe | 铁 | Fe / Fe | 10 | Fe | Fe2+ | §2.3 亚铁盐；§3.2/3.3/3.5/3.6 |
| element_cu | 铜 | Cu / Cu | 10 | Cu | Cu2+ | §2.3 铜盐；§3.3/3.7 |
| element_ag | 银 | Ag / Ag | 7 | Ag | Ag+ | §2.3 银盐；§3.2 明示不反应 |

一张实体牌在一次结算中只能选择一个 mode，消耗后不得再次贡献另一模式。elemental 模式只表示对应单质；ion_component 模式只提供一个表列离子单位。作为 Fe 单质的同一张 Fe 不得同时提供 Fe²⁺，反之亦然。Fe 不提供 Fe³⁺：后者的独立来源为 `ion_fe3`，或既有明确授权的反应路径，不能口头升价。六种模式之外没有隐含 mode。

Mg²⁺、Al³⁺、Fe²⁺、Zn²⁺、Cu²⁺、Ag⁺ 保留规范离子身份，但**没有独立抽牌 definition**；不得新增 `ion_mg` 等第二套实体，也不得以两套 ID 给同一金属重复计数。

### 2.3 基础元素组件：20 张 / 3 definitions

category 为 `base_element`，tags 为 `element_component, nonmetal`。每张提供一个元素单位，保留 MVP0 组件式 DIY 资源语言。

| definitionId | 中文名 | formula / display | count | 单位 / 用途 / Frozen linkage |
| --- | --- | --- | --- | --- |
| element_o | 氧元素组件 | O / O | 8 | O ×1；继承虚拟 CO₂ / SO₂ DIY |
| element_c | 碳元素组件 | C / C | 6 | C ×1；虚拟 CO₂ DIY、OR-C-CuO |
| element_s | 硫元素组件 | S / S | 6 | S ×1；虚拟 SO₂ DIY、§3.6 |

### 2.4 条件牌：21 张 / 5 definitions

category 为 `condition`，tags 为 `reaction_condition`。不是化学物质或离子组件；每张只提供一个精确 conditionProvided，不自动替代其他条件。

| definitionId | 中文名 | formula / display | count | conditionProvided | 用途 / Frozen linkage |
| --- | --- | --- | --- | --- | --- |
| condition_ignition | 点燃 | ignition / 点燃 | 5 | ignition | OR-S-O2、OR-Cl2-H2 |
| condition_heating | 加热 | heating / 加热 | 6 | heating | OR-S-Fe、OR-NH4-OH-heat 及加热还原行 |
| condition_catalysis | 催化 | catalysis / 催化 | 3 | catalysis | OR-SO2-O2 |
| condition_high_temperature | 高温 | high_temperature / 高温 | 4 | high_temperature | OR-C-CuO、OR-Fe2O3-CO |
| condition_oxide_film_removed | 去氧化膜 | oxide_film_removed / 去氧化膜 | 3 | oxide_film_removed | OR-Al-H |

`mno2_catalysis` 不做独立抽象条件牌，只由 `substance_mno2` 在 OR-KClO3-MnO2 中提供；不得创建第二张“MnO₂催化”牌。`catalysis ≠ mno2_catalysis`，`heating ≠ high_temperature`。条件/催化剂在实际 redox 结算中是否弃置、返还或保留由后续 Engine Freeze 决定，本表冻结 capability，不自行补写消费时序。

### 2.5 卤素单质：18 张 / 4 definitions

category 为 `halogen_elemental`；物质模式只有 formula 身份，不提供对应阴离子组件。

| definitionId | 中文名 | formula / display | count | tags | 用途 / Frozen linkage |
| --- | --- | --- | --- | --- | --- |
| substance_f2 | 氟单质 | F2 / F₂ | 2 | halogen, special, high_risk_candidate | 特殊/高危候选；§3 无可执行 F₂ 行 |
| substance_cl2 | 氯气 | Cl2 / Cl₂ | 6 | halogen, harmful-gas | §3.4/3.5/3.6/3.8；§3.11 chlorine_gas_stimulus 持续状态 |
| substance_br2 | 溴单质 | Br2 / Br₂ | 5 | halogen | OR-Br2-I；OR-Cl2-Br 产物 |
| substance_i2 | 碘单质 | I2 / I₂ | 5 | halogen | §3.4 产物；OR-Na2S2O3-I2 |

F / Cl / Br / I 体系同时有 F⁻、Cl⁻、Br⁻、I⁻ 独立组件。`high_risk_candidate` 只标记 F₂ 的特殊/高危候选定位，不授予可执行效果；F₂ 入池不增加 §3 行，不泛化卤素活动性。F⁻ 存在也不授予 HF DIY 或表外氟盐。

### 2.6 基础分子 / 气体：29 张 / 6 definitions

category 为 `base_molecule_gas`。

| definitionId | 中文名 | formula / display | count | tags | 用途 / Frozen linkage |
| --- | --- | --- | --- | --- | --- |
| substance_h2 | 氢气 | H2 / H₂ | 5 | flammable_gas | §3.2/3.8/3.9；首包无 H₂ 即时伤害 |
| substance_o2 | 氧气 | O2 / O₂ | 6 | — | §3.6；继承 MVP0 O₂ 路径，不新增 high-oxygen buff |
| substance_so2 | 二氧化硫 | SO2 / SO₂ | 4 | harmful-gas | §3.6；兼容 Phase 10 / SO2_LEAK，不新增即时伤害 |
| substance_nh3 | 氨气 | NH3 / NH₃ | 3 | — | §3.7 OR-NH4-OH-heat / OR-NH3-H |
| substance_h2o | 水 | H2O / H₂O | 6 | fire-extinguish | water 来源；继承 FIRE 状态处理，不授予回复 |
| substance_co2 | 二氧化碳 | CO2 / CO₂ | 5 | fire-extinguish | 继承 FIRE 状态处理 |

### 2.7 点名试剂 / 氧化物：39 张 / 11 definitions

category 为 `named_reagent_oxide`。仅提供所列物质身份与点名 capability；不能按元素成分拆出新的离子池或配方。

| definitionId | 中文名 | formula / display | count | tags | conditionProvided | 用途 / Frozen linkage |
| --- | --- | --- | --- | --- | --- | --- |
| substance_h2o2 | 过氧化氢 | H2O2 / H₂O₂ | 4 | reagent | — | OR-Fe2-H2O2；不开放 OR-H2O2-Fe2 |
| substance_kmno4 | 高锰酸钾 | KMnO4 / KMnO₄ | 4 | reagent | — | OR-KMnO4-HCl-conc、OR-KMnO4-Fe2 |
| substance_na2feo4 | 高铁酸钠 | Na2FeO4 / Na₂FeO₄ | 2 | reagent | — | OR-Na2FeO4-purify 有目标净化；无目标 O₂ 回复/高氧后置 |
| substance_mno2 | 二氧化锰 | MnO2 / MnO₂ | 4 | reagent, oxide | mno2_catalysis（仅 OR-KClO3-MnO2） | OR-MnO2-HCl-conc 反应物；OR-KClO3-MnO2 催化 provider |
| substance_naclo | 次氯酸钠 | NaClO / NaClO | 4 | reagent | — | OR-NaClO-HCl |
| substance_cuo | 氧化铜 | CuO / CuO | 4 | reagent, oxide | — | OR-H2-CuO、OR-C-CuO、OR-CO-CuO |
| substance_co | 一氧化碳 | CO / CO | 4 | reagent | — | OR-CO-CuO、OR-Fe2O3-CO |
| substance_fe2o3 | 氧化铁 | Fe2O3 / Fe₂O₃ | 4 | reagent, oxide | — | OR-Fe2O3-CO、OR-Fe2O3-H2 |
| substance_na2o2 | 过氧化钠 | Na2O2 / Na₂O₂ | 3 | reagent, oxide | — | OR-Na2O2-H2O |
| substance_kclo3 | 氯酸钾 | KClO3 / KClO₃ | 3 | reagent | — | OR-KClO3-MnO2 |
| substance_na2s2o3 | 硫代硫酸钠 | Na2S2O3 / Na₂S₂O₃ | 3 | reagent | — | OR-Na2S2O3-I2 |

MnO₂ 同时具有物质 / reagent 身份、浓盐酸行 reactant 能力和氯酸钾行催化能力。不得把一次物质消费与一次催化消费擅自合并、重复消费或生成抽象替身；实际结算由后续 Engine Freeze 决定。KMnO₄ 的 MnO₄⁻、Na₂S₂O₃ 的 S₂O₃²⁻ 只是既有点名行的化学表示，**不新增第 22 种规范离子或独立组件**。

### 2.8 预印稀酸 / 稀碱：14 张 / 6 definitions

category 为 `dilute_acid_base`；浓度卡面固定 `dilute`。离子组成只描述物质身份 / 适用来源，DIY 生成的输入签名另见 §4.2，不能把成品免费拆成多张组件。

| definitionId | 中文名 | formula / display | count | 离子组成 | tags | 用途 / mediumProvided / Frozen linkage |
| --- | --- | --- | --- | --- | --- | --- |
| substance_hcl_dilute | 稀盐酸 | HCl / 稀 HCl | 3 | H+ ×1, Cl- ×1 | acid, strong-acid, aqueous, dilute | dil_non_oxidizing_acid；§2.3、§3.2/3.8、Phase 10 |
| substance_h2so4_dilute | 稀硫酸 | H2SO4 / 稀 H₂SO₄ | 2 | H+ ×2, SO42- ×1 | acid, strong-acid, aqueous, dilute | dil_non_oxidizing_acid；§2.3、§3.2、Phase 10 |
| substance_hno3_dilute | 稀硝酸 | HNO3 / 稀 HNO₃ | 2 | H+ ×1, NO3- ×1 | acid, strong-acid, aqueous, dilute | dil_hno3；§2.3、§3.7 |
| substance_naoh_dilute | 稀氢氧化钠 | NaOH / 稀 NaOH | 3 | Na+ ×1, OH- ×1 | base, strong-alkali, aqueous, alkaline-absorb, dilute | §2.3；Phase 10 中和/吸收 |
| substance_koh_dilute | 稀氢氧化钾 | KOH / 稀 KOH | 2 | K+ ×1, OH- ×1 | base, strong-alkali, aqueous, alkaline-absorb, dilute | §2.3；Phase 10 中和/吸收 |
| substance_caoh2_limewater | 石灰水 | Ca(OH)2 / 石灰水 Ca(OH)₂ | 2 | Ca2+ ×1, OH- ×2 | base, strong-alkali, aqueous, alkaline-absorb, dilute | §2.3；Phase 10 中和/吸收 |

### 2.9 预印浓酸：4 张 / 2 definitions

category 为 `concentrated_acid`；tags 为 `acid, strong-acid, aqueous, concentrated`，卡面必须显示浓度。浓酸仅来自预印牌或已冻结的明确产物路径，**普通 DIY 不得生成浓 HCl、浓 H₂SO₄、浓 HNO₃**。浓 H₂SO₄ 不在本池，不为对称性新增。

| definitionId | 中文名 | formula / display | count | 离子组成 | mediumProvided | 用途 / Frozen linkage |
| --- | --- | --- | --- | --- | --- | --- |
| substance_hcl_concentrated | 浓盐酸 | HCl / 浓 HCl | 2 | H+ ×1, Cl- ×1 | conc_hcl | OR-KMnO4-HCl-conc、OR-MnO2-HCl-conc |
| substance_hno3_concentrated | 浓硝酸 | HNO3 / 浓 HNO₃ | 2 | H+ ×1, NO3- ×1 | conc_hno3 | OR-Cu-HNO3-conc |

### 2.10 预印盐：39 张 / 39 definitions

category 全部为 `salt`，每行 **count = 1**，完全沿用基线 `B2R1_SALT_CATALOG` 的 ID、formula、display、离子计量、solubility、isPrecipitate 和 tags。用途为 §2.3 盐 DIY 稳定输出 / 预印备用路线；可关联相应离子与既有表内关系，不授权表外拆解或沉淀 Engine。`ions signature` 使用规范 ion ID，表示生成该盐的精确输入。

微溶/难溶和 precipitate 标签不删除预印牌，也不阻止白名单 DIY 生成；标签不代表已实现 §2.4 沉淀状态。

| definitionId | 中文名 | formula / display | count | ions signature | solubility | isPrecipitate | tags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| substance_nacl | 氯化钠 | NaCl / NaCl | 1 | Na+ ×1, Cl- ×1 | soluble | false | salt, chloride |
| substance_kcl | 氯化钾 | KCl / KCl | 1 | K+ ×1, Cl- ×1 | soluble | false | salt, chloride |
| substance_agcl | 氯化银 | AgCl / AgCl | 1 | Ag+ ×1, Cl- ×1 | insoluble | true | salt, chloride, precipitate |
| substance_bacl2 | 氯化钡 | BaCl2 / BaCl₂ | 1 | Ba2+ ×1, Cl- ×2 | soluble | false | salt, chloride |
| substance_cacl2 | 氯化钙 | CaCl2 / CaCl₂ | 1 | Ca2+ ×1, Cl- ×2 | soluble | false | salt, chloride |
| substance_mgcl2 | 氯化镁 | MgCl2 / MgCl₂ | 1 | Mg2+ ×1, Cl- ×2 | soluble | false | salt, chloride |
| substance_zncl2 | 氯化锌 | ZnCl2 / ZnCl₂ | 1 | Zn2+ ×1, Cl- ×2 | soluble | false | salt, chloride |
| substance_fecl2 | 氯化亚铁 | FeCl2 / FeCl₂ | 1 | Fe2+ ×1, Cl- ×2 | soluble | false | salt, chloride |
| substance_fecl3 | 氯化铁 | FeCl3 / FeCl₃ | 1 | Fe3+ ×1, Cl- ×3 | soluble | false | salt, chloride |
| substance_cucl2 | 氯化铜 | CuCl2 / CuCl₂ | 1 | Cu2+ ×1, Cl- ×2 | soluble | false | salt, chloride |
| substance_alcl3 | 氯化铝 | AlCl3 / AlCl₃ | 1 | Al3+ ×1, Cl- ×3 | soluble | false | salt, chloride |
| substance_nh4cl | 氯化铵 | NH4Cl / NH₄Cl | 1 | NH4+ ×1, Cl- ×1 | soluble | false | salt, chloride |
| substance_na2so4 | 硫酸钠 | Na2SO4 / Na₂SO₄ | 1 | Na+ ×2, SO42- ×1 | soluble | false | salt, sulfate |
| substance_k2so4 | 硫酸钾 | K2SO4 / K₂SO₄ | 1 | K+ ×2, SO42- ×1 | soluble | false | salt, sulfate |
| substance_baso4 | 硫酸钡 | BaSO4 / BaSO₄ | 1 | Ba2+ ×1, SO42- ×1 | insoluble | true | salt, sulfate, precipitate |
| substance_caso4 | 硫酸钙 | CaSO4 / CaSO₄ | 1 | Ca2+ ×1, SO42- ×1 | slightly_soluble | true | salt, sulfate, precipitate |
| substance_mgso4 | 硫酸镁 | MgSO4 / MgSO₄ | 1 | Mg2+ ×1, SO42- ×1 | soluble | false | salt, sulfate |
| substance_znso4 | 硫酸锌 | ZnSO4 / ZnSO₄ | 1 | Zn2+ ×1, SO42- ×1 | soluble | false | salt, sulfate |
| substance_feso4 | 硫酸亚铁 | FeSO4 / FeSO₄ | 1 | Fe2+ ×1, SO42- ×1 | soluble | false | salt, sulfate |
| substance_cuso4 | 硫酸铜 | CuSO4 / CuSO₄ | 1 | Cu2+ ×1, SO42- ×1 | soluble | false | salt, sulfate |
| substance_al2_so4_3 | 硫酸铝 | Al2(SO4)3 / Al₂(SO₄)₃ | 1 | Al3+ ×2, SO42- ×3 | soluble | false | salt, sulfate |
| substance_ag2so4 | 硫酸银 | Ag2SO4 / Ag₂SO₄ | 1 | Ag+ ×2, SO42- ×1 | slightly_soluble | true | salt, sulfate, slightly_soluble |
| substance_na2co3 | 碳酸钠 | Na2CO3 / Na₂CO₃ | 1 | Na+ ×2, CO32- ×1 | soluble | false | salt, carbonate |
| substance_k2co3 | 碳酸钾 | K2CO3 / K₂CO₃ | 1 | K+ ×2, CO32- ×1 | soluble | false | salt, carbonate |
| substance_caco3 | 碳酸钙 | CaCO3 / CaCO₃ | 1 | Ca2+ ×1, CO32- ×1 | insoluble | true | salt, carbonate, precipitate |
| substance_baco3 | 碳酸钡 | BaCO3 / BaCO₃ | 1 | Ba2+ ×1, CO32- ×1 | insoluble | true | salt, carbonate, precipitate |
| substance_mgco3 | 碳酸镁 | MgCO3 / MgCO₃ | 1 | Mg2+ ×1, CO32- ×1 | slightly_soluble | true | salt, carbonate, precipitate |
| substance_znco3 | 碳酸锌 | ZnCO3 / ZnCO₃ | 1 | Zn2+ ×1, CO32- ×1 | insoluble | true | salt, carbonate, precipitate |
| substance_ag2co3 | 碳酸银 | Ag2CO3 / Ag₂CO₃ | 1 | Ag+ ×2, CO32- ×1 | insoluble | true | salt, carbonate, precipitate |
| substance_nano3 | 硝酸钠 | NaNO3 / NaNO₃ | 1 | Na+ ×1, NO3- ×1 | soluble | false | salt, nitrate |
| substance_kno3 | 硝酸钾 | KNO3 / KNO₃ | 1 | K+ ×1, NO3- ×1 | soluble | false | salt, nitrate |
| substance_agno3 | 硝酸银 | AgNO3 / AgNO₃ | 1 | Ag+ ×1, NO3- ×1 | soluble | false | salt, nitrate |
| substance_ca_no3_2 | 硝酸钙 | Ca(NO3)2 / Ca(NO₃)₂ | 1 | Ca2+ ×1, NO3- ×2 | soluble | false | salt, nitrate |
| substance_mg_no3_2 | 硝酸镁 | Mg(NO3)2 / Mg(NO₃)₂ | 1 | Mg2+ ×1, NO3- ×2 | soluble | false | salt, nitrate |
| substance_zn_no3_2 | 硝酸锌 | Zn(NO3)2 / Zn(NO₃)₂ | 1 | Zn2+ ×1, NO3- ×2 | soluble | false | salt, nitrate |
| substance_fe_no3_2 | 硝酸亚铁 | Fe(NO3)2 / Fe(NO₃)₂ | 1 | Fe2+ ×1, NO3- ×2 | soluble | false | salt, nitrate |
| substance_fe_no3_3 | 硝酸铁 | Fe(NO3)3 / Fe(NO₃)₃ | 1 | Fe3+ ×1, NO3- ×3 | soluble | false | salt, nitrate |
| substance_cu_no3_2 | 硝酸铜 | Cu(NO3)2 / Cu(NO₃)₂ | 1 | Cu2+ ×1, NO3- ×2 | soluble | false | salt, nitrate |
| substance_nh4no3 | 硝酸铵 | NH4NO3 / NH₄NO₃ | 1 | NH4+ ×1, NO3- ×1 | soluble | false | salt, nitrate |

盐分组复核：氯化物 12、硫酸盐 10、碳酸盐 7、硝酸盐 10，合计 39；没有氟化物/溴化物/碘化物或硫酸铁的隐含增补。`substance_na2co3` 沿用既有 ID，不因旧 starter deck 与新 manifest 张数不同而新增同义 ID。

## 3. 21 种规范离子的实体来源

“规范离子存在”与“有独立离子抽牌 definition”是不同概念。下表逐项覆盖全部规范集合，不依赖拆解盐、不要求新增规范离子。模式来源是组件 capability，不等于可在任意时机自动成为场上的水溶液；溶液目标、介质消耗及选牌时机仍由适用 Frozen / 后续 Engine 合同决定。

| canonical ion | 实体 definitionId | 唯一组件来源模式 |
| --- | --- | --- |
| H+ | ion_h | 独立 ion_component ×1 |
| NH4+ | ion_nh4 | 独立 ion_component ×1 |
| Na+ | ion_na | 独立 ion_component ×1 |
| K+ | ion_k | 独立 ion_component ×1 |
| Ca2+ | ion_ca | 独立 ion_component ×1 |
| Mg2+ | element_mg | 金属 ion_component ×1 |
| Ba2+ | ion_ba | 独立 ion_component ×1 |
| Al3+ | element_al | 金属 ion_component ×1 |
| Fe2+ | element_fe | 金属 ion_component ×1 |
| Fe3+ | ion_fe3 | 独立 ion_component ×1 |
| Zn2+ | element_zn | 金属 ion_component ×1 |
| Cu2+ | element_cu | 金属 ion_component ×1 |
| Ag+ | element_ag | 金属 ion_component ×1 |
| OH- | ion_oh | 独立 ion_component ×1 |
| Cl- | ion_cl | 独立 ion_component ×1 |
| NO3- | ion_no3 | 独立 ion_component ×1 |
| CO32- | ion_co3 | 独立 ion_component ×1 |
| SO42- | ion_so4 | 独立 ion_component ×1 |
| F- | ion_f | 独立 ion_component ×1 |
| Br- | ion_br | 独立 ion_component ×1 |
| I- | ion_i | 独立 ion_component ×1 |

## 4. Strict Stoichiometric DIY / 严格化学计量 DIY

### 4.1 两层合法性与组件消耗

第一层：输入必须精确匹配已冻结 recipe 的 **multiset**，同时满足 identity exact、oxidation/ion state exact、cardinality exact。第二层：对应产物/效果路径必须位于当前 Frozen DIY 白名单。**两层都通过才可生成**；电荷平衡或计量正确不是白名单授权。

一张组件实体只贡献一个选定组件单位。`Al³⁺ ×2` 是两张 Al 各选一次 ion_component mode，不是一张 Al 重复使用；同一 instanceId 不可重复计数。必须实际拥有并选中 recipe 要求的全部不同实例，不允许缺项、额外组件、自动补系数、错误价态替代、先滤掉未知/空白/非法项再匹配合法子集，也不允许把配方中的重复离子压缩成 unique set。多出**同种但不同实例**也因 cardinality 超量失败；缺失/未知 mode 必须失败。

合法性、时机、目标和来源归属必须全部验证后，才消费组件；无效请求不得弃牌、生成结果或部分消费。接受的主动 DIY / response DIY 所选组件每张进入 discard **一次**，生成物立即进入对应结算，不入手牌；后续响应不得重复弃置源组件。主动与 response DIY 共用同一份组件签名与上述两层判定，响应不得降计量要求。合法性差异只能来自 timing、target、high-risk restriction 和 response-specific Engine rules。响应构建物须立即用于当前响应，且不得为【高危】物质；附录 A 强制【中和】【吸收】【沉淀】标签裁定仍后置。

物质的离子组成 / 盐输入签名不自动授予“成品拆为多单位组件”的消费路线。Phase 22 §2.3 保留的“可电离盐牌由数据层声明”边界仍有效：本 Manifest 不声明额外盐拆解 recipe 或盐 ion-component mode；下一任务不得据 formula 自行生成拆解配方。独立离子与六种金属模式已足以覆盖盐构建的规范组件来源。

本节冻结的是组件选择与消耗；不会把当前 `matchB2R1RedoxReaction` 的物种集合接口改成实体计量接口。对于 §3 redox 路径，方程式系数、介质与催化剂的实体消费/返回以及完整可执行 recipe 须由后续 Engine 合同明确，不能从 §6 capability 覆盖矩阵推导。不得通过向现有 matcher 填入重复物种来模拟多张组件，更不得把 matcher 接受一个物种名称解读为 DIY 可少用组件。

### 4.2 已冻结输出签名

39 种盐的精确 recipe 逐行见 §2.10；不能扩展到未列离子对。稀酸/稀碱六项完整签名如下，同一稳定 definition 用于预印与合法实体输出识别：

| 输出 definitionId | 精确组件签名 | 实际组件张数 |
| --- | --- | --- |
| substance_hcl_dilute | H+ ×1, Cl- ×1 | 2 |
| substance_h2so4_dilute | H+ ×2, SO42- ×1 | 3 |
| substance_hno3_dilute | H+ ×1, NO3- ×1 | 2 |
| substance_naoh_dilute | Na+ ×1, OH- ×1 | 2 |
| substance_koh_dilute | K+ ×1, OH- ×1 | 2 |
| substance_caoh2_limewater | Ca2+ ×1, OH- ×2 | 3 |

继承的 MVP0 虚拟路径保持虚拟，不把它们强制改为 CardInstance：`C ×1 + O ×2 → CO₂_REMOVE_OWN_FIRE`、`H⁺ ×1 + OH⁻ ×1 → H₂O_REMOVE_OWN_FIRE`、`S ×1 + O ×2 → SO₂_APPLY_LEAK`，以及现有五项虚拟稀酸碱攻击。它们的组件签名仍精确，效果/目标/时机遵守原 Freeze；`O + O → O₂` 仍未获授权。新增稀 HNO₃ 等目标数据不表示当前 `diyRecipes.ts` 已拥有该 recipe，也不启用 response DIY runtime。

### 4.3 正负 worked examples

以下“合法”指组件计量与白名单两层通过，仍须满足执行时机和目标。`Fe²⁺`、`Al³⁺`、`Ag⁺` 的实体输入分别只来自 Fe、Al、Ag 的 ion_component mode。

| 结果 | 实际输入与张数 | 两层裁定 |
| --- | --- | --- |
| FeSO₄ / substance_feso4 | Fe card ×1 选 Fe²⁺ + ion_so4 ×1；共 2 张 | 合法：Fe2+ ×1, SO42- ×1；白名单内 |
| FeSO₄ | Fe elemental ×1 + ion_so4 ×1；或 ion_fe3 ×1 + ion_so4 ×1 | 非法：身份/价态错；不能按 Fe 元素推导 Fe²⁺ |
| Fe₂(SO₄)₃（无 definition） | ion_fe3 ×2 + ion_so4 ×3；共 5 张 | 非法：计量正确，但产物不在 39 盐白名单；不生成、不消费 |
| Fe₂(SO₄)₃ | Fe ×2（任一模式）+ ion_so4 ×3；或 ion_fe3 ×1 + ion_so4 ×3；或 ion_fe3 ×2 + ion_so4 ×2 | 非法：价态/数量错误，且产物也未授权；v0.1 无正例 |
| Al₂(SO₄)₃ / substance_al2_so4_3 | Al card ×2，各选 Al³⁺ + ion_so4 ×3；共 5 张 | 合法：Al3+ ×2, SO42- ×3；实际消耗五张 |
| Al₂(SO₄)₃ | Al elemental ×2 + ion_so4 ×3；或 Al³⁺ ×1 + ion_so4 ×3；或 Al³⁺ ×2 + ion_so4 ×2 | 非法：模式/数量错误；同一张 Al 的 ID 重复两次也非法 |
| Na₂SO₄ / substance_na2so4 | ion_na ×2 + ion_so4 ×1；共 3 张 | 合法：Na+ ×2, SO42- ×1 |
| Na₂SO₄ | ion_na ×1 + ion_so4 ×1；或 ion_na ×3 + ion_so4 ×1 | 非法：不能 unique-set 压缩或接受多余 Na⁺ |
| CaCl₂ / substance_cacl2 | ion_ca ×1 + ion_cl ×2；共 3 张 | 合法：Ca2+ ×1, Cl- ×2 |
| CaCl₂ | ion_ca ×1 + ion_cl ×1；或 ion_ca ×1 + ion_cl ×2 + ion_oh ×1 | 非法：缺氯或额外组件；不能滤掉 OH⁻ 后放行 |
| Ag₂SO₄ / substance_ag2so4 | Ag card ×2，各选 Ag⁺ + ion_so4 ×1；共 3 张 | 合法：Ag+ ×2, SO42- ×1；微溶不阻止生成 |
| Ag₂SO₄ | Ag elemental ×2 + ion_so4 ×1；或 Ag⁺ ×1 + ion_so4 ×1 | 非法：模式错或缺一张 Ag；不得自动补齐 |

## 5. 主牌堆实例与 DIY 生成实例

ordinary draw-pile inventory 只限制预印实例抽取数量，**不限制 DIY output availability**。39 种盐及六种稀酸碱的合法实体输出使用与预印牌相同的稳定 definitionId，但生成新的独立 instance identity，不从 ordinary deck remaining count 中取走预印实例，不按剩余数量拒绝，也不凭空返还牌堆一张。

例如 `substance_al2_so4_3` 的唯一预印实例已经被抽走或进入 discard，玩家仍可用两张 Al（均选 Al³⁺）与三张 ion_so4 合法生成硫酸铝：消费五张组件，生成新的结算实例，预印库存不变。同理 FeSO₄、Ag₂SO₄ 等白名单盐。Fe₂(SO₄)₃ 没有定义和生成授权，不能用“DIY 不受库存限制”绕过白名单。

生成盐按 Phase 22 §2.3 立即打出进入结算，不入手牌；生成实例不是第 345 张开局普通牌堆库存。后续生成实例的区域生命周期与重洗策略由 Engine 合同处理，初始化器只能按 §2 的 count 创建预印实例，不能根据定义数或 DIY 生成记录扩充开局牌堆。继承的虚拟 DIY / Phase 10 虚拟副产路径仍不创建 CardInstance。

## 6. 49-row redox 物理输入覆盖

### 6.1 介质与条件来源

`conc_hcl` ← 浓 HCl；`dil_hno3` ← 稀 HNO₃；`conc_hno3` ← 浓 HNO₃；`dil_non_oxidizing_acid` ← 稀 HCl 或稀 H₂SO₄；`water` ← H₂O 实体来源/既有水溶液介质语义。合法 DIY 得到的稀酸可提供其明确介质，普通 H⁺ 组件不自动冒充浓酸或硝酸介质。不能通过名称/口头宣称把 dilute 升成 concentrated，稀 HNO₃ 不属于非氧化性酸介质。

物理覆盖表中的介质/溶液来源表示有相应卡种与 capability，**不冻结额外的 water 弃牌费用，也不把一张溶液的组成复制为多张免费 DIY 组件**。当前纯 matcher 对显式 solutionIons、缺省 water、无介质行和显式空白介质的区分保持原样：无介质行不是任意介质；溶液离子默认 water 不等于另造 H₂O 普通库存实例。

MnO₂ 是 OR-MnO2-HCl-conc 的物质反应物；在 OR-KClO3-MnO2 中是 `mno2_catalysis` provider，不能以 `condition_catalysis` 替代。其一次实际结算如何消费仍须后续 Engine Freeze。本文件不增加 matcher aliases、不更改任一 row 的输入、介质、条件或效果。

### 6.2 逐行覆盖矩阵

`reactants`、`solutionIons` 与 `medium` 是基线静态行的**物种标识**（非 DIY 实例张数），条件也是原 key。来源列按本 Manifest 稳定 ID 给出所有必要输入；`[elemental]` / `[ion_component]` 必须选择相应模式。`—` 为该字段未声明。矩阵含 49 行及原有重复授权 ID、显式不反应行，不把它们当新增反应；现有 matcher 的 canonical row 返回选择保持不变。

| rowId | reactants | solutionIons | medium | conditions | 实体来源 | 裁定 |
| --- | --- | --- | --- | --- | --- | --- |
| OR-KMnO4-HCl-conc | KMnO4 | — | conc_hcl | — | substance_kmno4; substance_hcl_concentrated | 表内合同 |
| OR-Cu-HNO3-dil | Cu | — | dil_hno3 | — | element_cu[elemental]; substance_hno3_dilute | 表内合同 |
| OR-Na2FeO4-purify | Na2FeO4 | — | water | — | substance_na2feo4; substance_h2o / 水溶液 | 表内合同 |
| OR-Mg-H | Mg | — | dil_non_oxidizing_acid | — | element_mg[elemental]; substance_hcl_dilute 或 substance_h2so4_dilute | 表内合同 |
| OR-Zn-H | Zn | — | dil_non_oxidizing_acid | — | element_zn[elemental]; substance_hcl_dilute 或 substance_h2so4_dilute | 表内合同 |
| OR-Fe-H | Fe | — | dil_non_oxidizing_acid | — | element_fe[elemental]; substance_hcl_dilute 或 substance_h2so4_dilute | 表内合同 |
| OR-Al-H | Al | — | dil_non_oxidizing_acid | oxide_film_removed | element_al[elemental]; substance_hcl_dilute 或 substance_h2so4_dilute; condition_oxide_film_removed | 表内合同 |
| OR-Cu-H | Cu | — | dil_non_oxidizing_acid | — | element_cu[elemental]; substance_hcl_dilute 或 substance_h2so4_dilute | 明示不反应 |
| OR-Ag-H | Ag | — | dil_non_oxidizing_acid | — | element_ag[elemental]; substance_hcl_dilute 或 substance_h2so4_dilute | 明示不反应 |
| OR-Mg-Cu | Mg | Cu2+ | water | — | element_mg[elemental]; element_cu[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Zn-Cu | Zn | Cu2+ | water | — | element_zn[elemental]; element_cu[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Fe-Cu | Fe | Cu2+ | water | — | element_fe[elemental]; element_cu[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Mg-Ag | Mg | Ag+ | water | — | element_mg[elemental]; element_ag[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Zn-Ag | Zn | Ag+ | water | — | element_zn[elemental]; element_ag[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Fe-Ag | Fe | Ag+ | water | — | element_fe[elemental]; element_ag[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Cu-Ag | Cu | Ag+ | water | — | element_cu[elemental]; element_ag[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Cl2-Br | Cl2 | Br- | water | — | substance_cl2; ion_br; substance_h2o / 水溶液 | 表内合同 |
| OR-Cl2-I | Cl2 | I- | water | — | substance_cl2; ion_i; substance_h2o / 水溶液 | 表内合同 |
| OR-Br2-I | Br2 | I- | water | — | substance_br2; ion_i; substance_h2o / 水溶液 | 表内合同 |
| OR-Cl2-F | Cl2 | F- | water | — | substance_cl2; ion_f; substance_h2o / 水溶液 | 明示不反应 |
| OR-Fe-Fe3 | Fe | Fe3+ | water | — | element_fe[elemental]; ion_fe3; substance_h2o / 水溶液 | 表内合同 |
| OR-Fe2-Cl2 | Cl2 | Fe2+ | water | — | substance_cl2; element_fe[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Fe-Cu2 | Fe | Cu2+ | water | — | element_fe[elemental]; element_cu[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Fe2-H2O2 | H2O2 | Fe2+, H+ | water | — | substance_h2o2; element_fe[ion_component]; ion_h; substance_h2o / 水溶液 | 表内合同 |
| OR-Fe3-OH | — | Fe3+, OH- | water | — | ion_fe3; ion_oh; substance_h2o / 水溶液 | 表内合同 |
| OR-S-O2 | S, O2 | — | — | ignition | element_s; substance_o2; condition_ignition | 表内合同 |
| OR-SO2-Cl2 | SO2, Cl2 | — | water | — | substance_so2; substance_cl2; substance_h2o / 水溶液 | 表内合同 |
| OR-SO2-O2 | SO2, O2 | — | — | catalysis | substance_so2; substance_o2; condition_catalysis | 表内合同 |
| OR-S-Fe | Fe, S | — | — | heating | element_fe[elemental]; element_s; condition_heating | 表内合同 |
| OR-SO2-OH | SO2 | OH- | water | — | substance_so2; ion_oh; substance_h2o / 水溶液 | 表内合同 |
| OR-Cu-HNO3-conc | Cu | — | conc_hno3 | — | element_cu[elemental]; substance_hno3_concentrated | 表内合同 |
| OR-Fe-HNO3-dil | Fe | — | dil_hno3 | — | element_fe[elemental]; substance_hno3_dilute | 表内合同 |
| OR-NH4-OH-heat | — | NH4+, OH- | water | heating | ion_nh4; ion_oh; substance_h2o / 水溶液; condition_heating | 表内合同 |
| OR-NH3-H | NH3 | H+ | water | — | substance_nh3; ion_h; substance_h2o / 水溶液 | 表内合同 |
| OR-MnO2-HCl-conc | MnO2 | — | conc_hcl | — | substance_mno2; substance_hcl_concentrated | 表内合同 |
| OR-NaClO-HCl | NaClO, HCl | — | — | — | substance_naclo; substance_hcl_dilute | 表内合同 |
| OR-Cl2-H2 | H2, Cl2 | — | — | ignition | substance_h2; substance_cl2; condition_ignition | 表内合同 |
| OR-Zn-Cu2 | Zn | Cu2+ | water | — | element_zn[elemental]; element_cu[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Al-Cu2 | Al | Cu2+ | water | — | element_al[elemental]; element_cu[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-Mg-Fe2 | Mg | Fe2+ | water | — | element_mg[elemental]; element_fe[ion_component]; substance_h2o / 水溶液 | 表内合同 |
| OR-H2-CuO | H2, CuO | — | — | heating | substance_h2; substance_cuo; condition_heating | 表内合同 |
| OR-C-CuO | C, CuO | — | — | high_temperature | element_c; substance_cuo; condition_high_temperature | 表内合同 |
| OR-CO-CuO | CO, CuO | — | — | heating | substance_co; substance_cuo; condition_heating | 表内合同 |
| OR-Fe2O3-CO | Fe2O3, CO | — | — | high_temperature | substance_fe2o3; substance_co; condition_high_temperature | 表内合同 |
| OR-Fe2O3-H2 | Fe2O3, H2 | — | — | heating | substance_fe2o3; substance_h2; condition_heating | 表内合同 |
| OR-KMnO4-Fe2 | KMnO4 | Fe2+, H+ | water | — | substance_kmno4; element_fe[ion_component]; ion_h; substance_h2o / 水溶液 | 表内合同 |
| OR-Na2O2-H2O | Na2O2 | — | water | — | substance_na2o2; substance_h2o / 水溶液 | 表内合同 |
| OR-KClO3-MnO2 | KClO3 | — | — | mno2_catalysis | substance_kclo3; substance_mno2 | 表内合同 |
| OR-Na2S2O3-I2 | Na2S2O3, I2 | — | — | — | substance_na2s2o3; substance_i2 | 表内合同 |

化学式中的 MnO₄⁻、S₂O₃²⁻ 等仅由点名 reagent 在对应行代表；不增加规范离子。Na₂FeO₄ 虽只有 2 张预印实例，仍具 water 净化行物质身份；方程式系数不能被本覆盖矩阵误读为当前抽牌池必须一次提供四张 reagent，实际 Engine 数量裁定另文。本 Manifest 既不把抽象 matcher 当完整消费 Engine，也不允许 Strict DIY 自动补系数。

Cl₂、NO、NO₂ 产物遵守 §3.11 持续刺激状态单一轨，不增即时伤害并列轨；H₂ 仅保留可燃气体标签，无首包即时伤害。SO₂ / SO2_LEAK、三类 Phase 10 成功反应与 H₂O / CO₂ FIRE 处理路径继续有效。O₂ 不因 Na₂FeO₄ 无目标情形获得回复/高氧增益。F₂ 没有 §3 行。

## 7. 下游实现与回归边界

下一任务只能按本 Manifest 实现稳定 card definitions 与普通 deck manifest：展开 §2 的 97 个 definitions / 344 个预印实例，保留离子 identity、金属 modes、条件 capability、浓稀属性及盐精确签名。不得在该数据任务中猜状态/伤害数值、redox 组件消费、介质/催化剂费用、生成物区域生命周期或 Engine 接线。

本次只新增本文件；`src/**`、现有 Phase 22 Freeze、package、lockfile、workflow、size gate 都不修改。明确保持以下运行时边界：

- 不接入 B2-R1 Engine，不绕过 `src/game/engine/reducer.ts` 或会话边界。
- 不删除 `usedDIYThisCycle`，不开放 response DIY runtime；目标 B2-R1 不限次/响应合同仅在未来独立 Engine 任务落地。
- 不改变当前 68-card starter deck；`event_lab_fire` 计入普通主牌堆 **0 张**，不得创建为普通 CardInstance。
- 不改技术版本或生产规则字符串 `MVP0-P10`，不宣称 B2-R1 上线。
- 不实现 §2.4 沉淀状态，不增 §3 row，不改 21 ions / 39 salts / 49 rows。
- 不实现 Appendix A 的 OR-Cl2-H2O、OR-K2Cr2O7-Fe2、OR-H2O2-Fe2、OR-SO3-H2O、高氧/回复、H₂ 即时伤害、沉淀窗口或 response DIY 强制标签等 deferred behaviors。

## 8. 验收合同

清单必须双重核对（程序与人工分组）：97 行都有唯一稳定 ID；无未经解释的同语义双 ID；十类数量与 §1 完全一致；总量 344；核心 201 严格大于其余 143；21 离子均有 §3 实体来源；双模式恰为六项且没有 Fe³⁺ mode；四卤素单质/阴离子均存在；39 盐 ID/计量/tags/溶解性与基线目录完全一致、每种预印恰 1 张；49 redox 输入/介质/条件逐行均有来源。

严格 DIY 验收按 §4 正负例：模式/价态/数量/白名单分别检查；额外组件、重复 instanceId、未知项拒绝且不消费。Fe₂(SO₄)₃ 的五张计量正确输入仍为负例，Al₂(SO₄)₃ 为五张正例。预印硫酸铝实例耗尽后仍可合法生成新实例，ordinary deck remaining count 不是生成门槛；保留虚拟路径不创建实体的差异。

仓库验证至少实际运行 `pnpm run test:run`、`pnpm run build`（含当前 `tsc -b` 类型检查与 production check）、`pnpm run check:size`、`pnpm run check:tracked-clean`、`git diff --check`。当前 package 没有独立 lint script，不得虚构 lint 通过。`check:tracked-clean` 应在合法文档提交后运行，不得 stash/reset 隐藏改动。以上回归检查不替代 Manifest 规则审计，任何应用行为改动均为 blocker。

本地限定提交标题：`docs(b2r1): freeze card pool manifest`；不 push / PR / merge。提交后以指定 Base 与实际完整 40-char Head 在独立 GPT-6.1-sol Read/Test-only 上下文中审计，审计者独立读 diff、清单及权威源，不修改文档/源码，不替作者修复。最终须独立审计 Pass、工作区 clean，并报告最终 HEAD；P0/P1 由主任务修复后对新 Head 重新独立审计。
