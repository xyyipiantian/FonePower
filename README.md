# FitFlow 健身动作库小程序

基于开源健身数据集的可视化动作库微信小程序。提供动作 GIF 动态图解、按部位/器械/目标肌群检索、训练计划与收藏功能，帮助用户学习标准动作、科学规划日常训练。

> AppID：见微信公众平台后台配置（请勿随仓库公开提交）
> 微信后台名称：**FitFlow 健身动作库**
> 建议服务类目：**体育 > 在线健身**（当前后台曾误设为「工具 > 备忘录」，上架前需修正）

---

## 功能特性

| 模块 | 说明 |
| --- | --- |
| **动作库（首页）** | 1324 条健身动作，支持关键词搜索与「身体部位 / 训练器械 / 目标肌群」三维分类筛选；带返回顶部悬浮按钮。 |
| **动作详情** | 动作 GIF 动态图解 + 静态图、标准要领分步说明、部位/器械/目标肌群标签、一键收藏。 |
| **训练计划** | 预设训练计划列表与计划详情（组合多个动作）。 |
| **我的收藏** | 收藏的动作集中查看，本地持久化。 |
| **个人中心** | 用户信息、收藏数等入口。 |
| **自定义 TabBar** | 动作库 / 训练计划 / 收藏 / 我的，激活态高对比青色胶囊指示。 |

---

## 技术架构

- **平台**：微信小程序（原生开发，非 uni-app / Taro）。
- **UI 方案**：WXML + WXSS，设计变量集中于 `styles/tokens.wxss`，图标为 `styles/icons.wxss` 内联 SVG（CSS `background-image`），无第三方 UI 库。
- **数据加载**：构建时静态打包（见下方「数据来源」），运行时从 `utils/exercises.js` 内存数组直接读取，无远程 API 调用。
- **媒体资源**：动作 GIF / 图片按 URL 从 [jsDelivr CDN](https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/) 实时加载（需在小程序后台配置 `downloadFile` 合法域名）。
- **云环境**：已开通 CloudBase 环境（环境 ID 见微信云开发控制台），**当前未接入代码**（收藏等功能仍走本地 Storage）。

### 目录结构

```
FitFlow/
├── app.js / app.json / app.wxss     小程序入口与全局配置
├── custom-tab-bar/                   自定义底部 TabBar 组件
├── pages/
│   ├── index/                       动作库（首页：搜索 + 分类筛选）
│   ├── detail/                      动作详情（GIF 图解 + 要领 + 收藏）
│   ├── plans/                       训练计划列表
│   ├── plan-detail/                 计划详情
│   ├── favorites/                   我的收藏
│   └── profile/                    个人中心
├── styles/
│   ├── tokens.wxss                 设计变量（颜色 / 阴影 / 圆角 / 动画时长）
│   └── icons.wxss                  矢量图标库（内联 SVG）
├── utils/
│   └── exercises.js                构建生成的动作数据模块（运行时数据源）
├── dataset-ref/
│   ├── exercises.json               原始数据集（1324 条动作）
│   └── build.js                    将 JSON 转换为 utils/exercises.js
├── design/                         设计规范 / 设计稿
├── project.config.json
└── sitemap.json
```

---

## 数据来源与构建

动作数据来源于开源项目 [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)（代码与数据 MIT，媒体资源 © GymVisual）。

本地仓库已包含完整数据集与构建产物，克隆即可运行：

```bash
# 如需重新生成数据模块（数据集更新后）
node dataset-ref/build.js
# 输出: utils/exercises.js  (含 EXERCISES / OPTIONS / getById / filter 等方法)
```

`build.js` 的策略：
- 仅保留中文说明（`instructions.zh`）以控制包体积；
- 身体部位 / 器械 / 目标肌群的中英文映射在 `build.js` 的 `MAP` 中维护；
- 媒体（GIF / 图）走 jsDelivr CDN，不打包进代码；
- 动作要领按标点切分为分步 `steps`。

> **重要限制**：数据集是「构建时快照」。上游仓库新增动作**不会**自动反映到线上小程序，必须重新运行 `build.js` 并重新发布。

---

## 本地开发

1. 用**微信开发者工具**导入本项目目录。
2. 填入你的 AppID（或测试号）。
3. 在「详情 → 本地设置」中确认已开启「不校验合法域名」（或已配置 jsDelivr CDN 为合法域名）。
4. 编译预览。`project.config.json` 已开启 `bigPackageSizeSupport`（数据集较大）。

---

## 数据存储现状

| 数据 | 存储位置 | 说明 |
| --- | --- | --- |
| 动作主数据 | `utils/exercises.js`（代码包内） | 静态快照，更新需重新构建 + 发版。 |
| 收藏数据 | 用户手机**本地 Storage**（键 `ff_favorites`，存动作 ID 数组） | 换机 / 清缓存 / 卸载会丢失，多设备不互通。 |
| CloudBase 云库 | 环境已开，未接入 | 后续可迁移收藏、计划、训练记录以实现跨设备持久化。 |

---

## Roadmap（建议）

- [ ] 接入 CloudBase：收藏 / 计划迁移至云数据库，支持跨设备与多用户。
- [ ] 动作库改为云库运行时拉取，解决「数据集不自动更新」问题。
- [ ] 动作名中文化（`exercises.js` 的 `name` 字段目前为英文，需逐条翻译或使用翻译 API）。
- [ ] 后台服务类目修正为「体育 > 在线健身」。
- [ ] 训练记录 / 打卡等进阶功能。

---

## 许可证

- 代码：MIT
- 数据：MIT（[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)）
- 媒体（GIF / 图片）：© GymVisual，遵循原仓库授权说明
