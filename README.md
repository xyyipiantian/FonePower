# FonePower · 健身训练小程序

> 基于开源动作数据集的微信小程序。集**动作库 · 训练计划 · 训练日志 · 自定义计划 · 训练流程跟练**于一体。
> 朋友 / 个人使用，**免费 / 非商用**。

## 功能

### 核心
| 模块 | 说明 |
| --- | --- |
| **动作库** | 1324 条健身动作，关键词搜索 + 身体部位 / 训练器械 / 目标肌群三维筛选。 |
| **动作详情** | GIF 动态图解 + 静态图 + 标准要领分步说明 + 一键收藏。 |
| **训练计划** | 7 套预设计划（含《焚诀三分化》8 天循环改造版）按部位 / 全身 / 经典三分化全覆盖。 |
| **计划详情** | 倒金字塔组数、组间休息 RPE、要点 + 口诀；按器械条件（健身房 / 居家 / 纯徒手）自动切换动作变体。 |
| **训练跟练** | 训练中：单动作依次完成、组间休息倒计时、自动跳转下一组；退出再进保留进度。 |
| **训练日志** | 完整记录每次训练，可「再来一次」重开同 plan；统计累计组数 / 重量。 |
| **自定义计划** | 自由组合动作、自定义组数次数 RPE 休息，存云端多设备同步。 |
| **收藏** | 收藏喜欢的动作，本地 + 云端双写，多设备同步。 |
| **营养食材** | 1000+ 条食材营养数据（独立分包）。 |
| **个人中心** | 训练统计、设置入口。 |

### 进阶
- **计划排序**：训练计划可上下移动，记住你的偏好顺序
- **动作替换**：内置计划里的动作**长按**可换成别的（只改你本机视图，不污染公共数据）
- **器械条件切换**：同一计划根据「健身房 / 居家 / 纯徒手」自动展示不同动作变体
- **训练进度持久化**：中途退出训练，再次进入时询问是否继续

## 技术栈

- **平台**：微信小程序（原生 WXML + WXSS + JS）
- **云服务**：CloudBase（`wx.cloud`），按 `openid` 隔离数据
- **数据同步**：本地 Storage + 云端双写，断网自动降级本地
- **UI**：自研设计系统（`styles/tokens.wxss` + `styles/icons.wxss` 内联 SVG），无第三方 UI 库
- **媒体**：动作 GIF / 图片从 [jsDelivr CDN](https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/) 加载
- **数据源**：[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)（代码与数据 MIT，媒体 © GymVisual）

## 目录结构

```
FonePower/
├── app.js / app.json / app.wxss         入口与全局配置
├── custom-tab-bar/                       自定义底部 TabBar
├── pages/
│   ├── index/                            动作库（首页）
│   ├── detail/                           动作详情
│   ├── plans/                            训练计划列表
│   ├── plan-detail/                      计划详情（带动作替换）
│   ├── plan-editor/                      自定义计划编辑器
│   ├── custom-plan/                      我的计划详情
│   ├── training/                         训练跟练页
│   ├── training-log/                     训练日志
│   ├── favorites/                        收藏
│   └── profile/                          个人中心
├── packageNutrition/                     营养食材分包
├── styles/
│   ├── tokens.wxss                       设计变量（颜色/阴影/圆角/动画）
│   └── icons.wxss                        矢量图标库
├── utils/
│   ├── exercises.js                      动作数据（1324 条，运行时数据源）
│   ├── plans.js                          内置训练计划（7 套，结构化 days+items+variants）
│   ├── cloud.js                          CloudBase 封装（登录 + 收藏/计划/排序/替换 override 同步）
│   ├── trainingLog.js                    训练日志 CRUD + 云同步
│   └── favGuide.js                       收藏引导组件
├── components/fav-guide/                 收藏引导组件
├── cloudfunctions/login/                 静默登录云函数（拿 openid）
├── dataset-ref/                          数据集原始 JSON + 构建脚本（已从打包排除）
├── docs/                                 配套文档（体态评估、焚诀手册、动作图解）
├── design/                               设计系统规范
├── project.config.json
└── sitemap.json
```

## 数据存储

| 数据 | 位置 | 同步策略 |
| --- | --- | --- |
| 动作主数据 | `utils/exercises.js`（代码包内） | 静态快照，发布更新 |
| 收藏 | 本地 Storage + CloudBase `users.favorites` | 双写，断网降级本地 |
| 自定义计划 | 本地 Storage + CloudBase `users.plans` | 双写 |
| 计划排序 | 本地 Storage + CloudBase `users.planOrder` | 双写 |
| 动作替换 override | 本地 Storage + CloudBase `users.planOverrides` | 双写 |
| 训练日志 | 本地 Storage + CloudBase `users.trainingLogs` | 双写 |
| 器械条件 | 本地 Storage | 单一设备 |

**用户隔离**：所有云端数据按 `openid` 存放在 `users/{openid}` 单一文档的多个字段下，集合权限为「仅创建者可读写」。

## 本地开发

### 1. 准备

- 微信开发者工具（最新稳定版）
- 申请微信小程序 AppID（个人 / 测试号均可）
- 微信云开发环境（**可选**，不开通会自动降级本地 Storage）

### 2. 导入项目

1. 微信开发者工具 → 导入项目 → 选择本仓库根目录
2. **首次 clone**：仓库里没有 `project.config.json`（避免 appid 泄漏），需手动从 `project.config.example.json` 复制一份并填入你的 `appid`
3. 编译预览

### 3. 云环境（可选）

如果想用云同步功能：

1. 工具栏「云开发」→ 创建环境（免费版够用）
2. 复制环境 ID，填入 `utils/cloud.js` 的 `CLOUD_ENV`
3. 在云数据库创建 `users` 集合，权限选「**仅创建者可读写**」
4. 右键 `cloudfunctions/login/` → 上传并部署（依赖：wx-server-sdk）
5. 重启小程序，自动静默登录 + 拉取云端数据

不开通云环境，**核心功能全部可用**（仅收藏 / 自定义计划 / 训练日志不跨设备）。

### 4. 域名白名单

- 在微信公众平台 → 开发管理 → 服务器域名，配置 `cdn.jsdelivr.net` 为 `downloadFile` 合法域名
- 或者在开发者工具「详情 → 本地设置」勾选「不校验合法域名」（仅本地预览用）

## 训练计划

内置 7 套计划：

| 计划 | 部位 | 强度 | 排程 | 备注 |
| --- | --- | --- | --- | --- |
| 胸肌塑形 | 胸 · 三头 | 初级 | 单日 | 结构化，要点 + 口诀 |
| 背部雕刻 | 背 · 二头 · 后束 | 中级 | 单日 | 含面拉改善圆肩 |
| 肩部三角 | 三角肌 | 初级 | 单日 | 前 / 中 / 后束全覆盖 |
| 下肢力量 | 腿 · 臀 | 中级 | 单日 | 含保加利亚蹲 / 单腿硬拉 |
| 核心燃脂 | 腹直 · 腹斜 | 初级 | 单日 | 仰卧起坐系列 |
| 全身激活 | 全身 | 进阶 | 单日 | 多关节循环 |
| **焚诀三分化 · 8 天循环** | 推 / 拉 / 腿 | 中高级 | 推-拉-腿-休 滚动 | 凯圣王×谭成义《焚诀》久坐族改造版 |

每个计划都支持 **gym / home / bodyweight** 三套动作变体。

## 配套文档

`docs/` 目录下：

- `久坐族体态评估与12周减脂计划.md` — 体态自测 + 三阶段减脂方案
- `焚诀三分化-完整执行手册.md` — 焚诀完整版说明
- `焚诀三分化-动作图解手册.html` — 15 个动作 SVG 图解

## 隐私

本项目遵循微信《用户隐私保护指引》：

- 复制外链使用 `wx.setClipboardData`
- 弹窗位置使用 `wx.getSystemInfoSync`
- 反馈使用 `wx.vibrateShort`

上述接口的采集目的需在小程序后台「用户隐私保护指引」中声明（开启 `__usePrivacyCheck__` 后会强制检查）。

## 上线 / 体验

**个人 / 朋友使用建议走「体验版」**，最稳：

1. 开发者工具 → 右上「上传」→ 填版本号 → 上传
2. 微信公众平台 → 成员管理 → 添加朋友为体验者
3. 朋友扫码即可用，无需类目资质、免审核

如果要正式发布（搜索能搜到），需：

- 个人主体选择「体育 / 健身」类目
- 完成 ICP 备案
- 提交「用户隐私保护指引」

## 数据来源与许可

- **代码**：MIT
- **动作数据**：[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)（MIT）
- **媒体（GIF / 图片）**：© GymVisual，遵循原仓库授权
- **营养数据**：来自公开营养数据库（wger、Open Food Facts 等），遵循其对应授权

## 致谢

- 凯圣王 × 谭成义《焚诀三分化》原版思路
- [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) 提供完整动作数据
- 上游 [duziteng2019/FitFlow](https://github.com/duziteng2019/FitFlow) 提供项目骨架

---

> 个人 / 朋友用，**免费 + 非商用**。觉得好用就 Star 一下 ⭐