# FitFlow 健身动作库 · UI 设计系统

> 设计：UI Designer 像素君　|　版本：v1.0　|　状态：可用于开发还原

本规范定义 FitFlow 小程序的视觉语言，覆盖 `app.wxss` 设计令牌与全站组件。所有页面样式**仅消费令牌变量**，确保跨页面一致性与可维护性。

---

## 一、设计原则

1. **活力可信（Vitality & Trust）**：以青绿主色传递健康能量，橙色强调传递行动号召。
2. **层级清晰**：通过字重、色彩明度、阴影海拔三重手段建立阅读秩序。
3. **触摸友好**：所有可点击元素最小触控区 ≥ 44rpx（实际组件更高）。
4. **无障碍优先**：正文/背景对比度满足 WCAG AA（≥ 4.5:1）；激活态有非颜色线索（图标/字重/底纹）。

---

## 二、色彩系统 Color

### 主色阶 Primary（Vitality Emerald）

| Token | 值 | 用途 |
|---|---|---|
| `--ff-primary-50` | `#E6F8F2` | 激活态底色、浅底纹 |
| `--ff-primary-100` | `#C9F0E5` | 浅填充 |
| `--ff-primary-200` | `#9DE3D0` | 浅填充 |
| `--ff-primary-300` | `#5FD4B8` | 聚焦描边 |
| `--ff-primary-400` | `#1FC79F` | 渐变中段 |
| `--ff-primary-500` | `#00C896` | ★ 品牌主色 |
| `--ff-primary-600` | `#00A87C` | 标题/激活文字（深一档，对比度更优） |
| `--ff-primary-700/800/900` | `#008663 / #00654B / #00452F` | 深色场景、渐变深端 |

### 强调色 Accent（Energy Orange）

| Token | 值 | 用途 |
|---|---|---|
| `--ff-accent-50/100` | `#FFF1EA / #FFE0D1` | 提示浅底 |
| `--ff-accent-500` | `#FF7A45` | ★ 关键行动、重置链接 |
| `--ff-accent-600/700` | `#F2641E / #D24F12` | 按压/强调文字 |

### 中性 Neutral

| Token | 值 | 用途 |
|---|---|---|
| `--ff-bg` | `#F4F6F9` | 页面背景 |
| `--ff-surface` | `#FFFFFF` | 卡片/控件表面 |
| `--ff-surface-2` | `#FBFCFE` | 次级表面 |
| `--ff-ink-900` | `#161C2D` | 主文字 |
| `--ff-ink-700` | `#3A4252` | 次级标题文字 |
| `--ff-ink-500` | `#6B7280` | 次要文字 |
| `--ff-ink-400` | `#9AA3B2` | 占位/元信息 |
| `--ff-line` | `#ECEFF3` | 分隔线/边框 |
| `--ff-line-strong` | `#E2E6EC` | 时间线连接线 |

### 语义 Semantic

`--ff-success #16A34A`　`--ff-warning #F59E0B`　`--ff-danger #EF4444`　`--ff-info #3B82F6`

### 品牌渐变 Gradients

```css
--ff-grad-primary: linear-gradient(135deg, #00C896 0%, #16D6A6 100%);
--ff-grad-hero:    linear-gradient(135deg, #00A87C 0%, #00D6A8 55%, #4BE3B4 100%);
--ff-grad-accent:  linear-gradient(135deg, #FF8A4C 0%, #FF6A3D 100%);
```

---

## 三、字体排版 Typography

- **字体栈**：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Helvetica, sans-serif`
- **字重**：400（正文） / 600（次要强调） / 700（区块标题） / 800（大标题、数字）
- **字号阶梯（rpx）**：20 / 22 / 26 / 28 / 30 / 34 / 40 / 48 / 56
- **行高**：标题 1.25–1.35，正文 1.5–1.6

---

## 四、间距 / 圆角 / 阴影

- **间距**：4rpx 基准（4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64）
- **圆角**：`sm 12` / `md 16` / `lg 20`（卡片默认） / `xl 28`（演示大图） / `full 999`（胶囊）
- **阴影海拔**：`xs → lg` 四级，用于静默→悬浮→按压→聚焦的层次表达

---

## 五、组件库 Components

| 组件 | 类 | 说明 |
|---|---|---|
| 标签 | `.tag` / `.tag.primary` / `.tag.accent` | 部位/器械/肌群标记，胶囊样式 |
| 区块标题 | `.sec-title` | 左侧渐变竖条 + 加粗标题 |
| 媒体占位 | `.ph-box` | GIF/图加载失败兜底，品牌渐变 + 首字母 |
| 通用卡片 | `.ff-card` | 白底 + 大圆角 + sm 阴影 |
| 按压反馈 | `.ff-press` | `:active` 缩放 0.97 |
| 渐变文字 | `.ff-gradient-text` | 标题强调 |
| 分隔线 | `.ff-divider` | 2rpx 浅线 |
| 空状态 | `.ff-empty` | 图标 + 主副文案居中 |

### 矢量图标系统

所有图标为内嵌 SVG data-uri 背景图（见 `styles/icons.wxss`），颜色随图形内嵌，**零 emoji、零外部字体依赖**，随主包打包、离线可用、渲染可控。

| 图标类 | 含义 | 变体 |
|---|---|---|
| `.ico-lib` / `.ico-lib--on` | 动作库（九宫格） | 灰 / 青（激活） |
| `.ico-calendar` / `.ico-calendar--on` | 训练计划 | 灰 / 青 |
| `.ico-heart-o` / `.ico-heart` / `.ico-heart--on` | 收藏（心形） | 灰描边 / 橙填充 / 青填充 |
| `.ico-user` / `.ico-user--on` | 我的 | 灰 / 青 |
| `.ico-search` | 搜索 | 墨色 |
| `.ico-close` | 关闭 | 墨色 |
| `.ico-dumbbell` / `.ico-dumbbell-gray` | 品牌 / 空状态 / 水印 | 白 / 浅灰 |
| `.ico-clock` | 时长 | 青 |
| `.ico-chevron` | 右箭头导航 | 灰 |
| `.ico-play` | 开始训练 | 白 |
| `.ico-fire` | 难度等级 | 橙 |

用法：`<view class="ico ico-xxx"></view>`，尺寸由所在上下文类控制（如 `.tab-ico` 46rpx、`.fav-ico` 36rpx、`.empty-ico` 96rpx）。

### 页面级关键组件

- **首页 `pages/index`**：分段控件（`.dim-tabs` 激活态用品牌渐变）、横向筛选胶囊（`.chip.active` 渐变填充）、双列动作卡片（`.card` 按压缩放 + 图片轻微放大 + 底部渐变遮罩提升标签可读性）。
- **详情页 `pages/detail`**：演示大图（`.hero` 顶部渐变条 + md 阴影）、收藏按钮（`.fav-btn` 默认白底、激活态能量橙渐变）、肌群标签行、动作要领**时间线**（`.step` 连接线 + 渐变序号圆点）、来源声明。
- **收藏页 `pages/favorites`**：复用首页卡片视觉语言（双列网格 + 底部渐变遮罩），空状态引导用户去详情页收藏。
- **我的页 `pages/profile`**：品牌 Hero 卡（`.brand` 顶部渐变 + 毛玻璃 logo，logo 为矢量哑铃）、三栏统计（`.stats` 渐变数字 + 分隔线）、关于数据源 / 设计系统说明卡片。
- **训练计划页 `pages/plans`**：计划卡片列表，封面渐变 + 哑铃水印 + 难度火焰徽标 + 名称，下方描述、时钟时长、动作数与目标肌群标签，点击进入详情。
- **计划详情页 `pages/plan-detail`**：渐变头图（计划信息 + 开始训练按钮）、描述卡、编号动作列表（缩略图 + 标签 + 右箭头），点击进入动作详情。
- **自定义导航 `custom-tab-bar`**：固定底部、白底 + 顶部细线 + 上投影；四项（动作库 / 训练计划 / 收藏 / 我的）矢量图标 + 文字，激活态切换为主色并轻微上浮放大。

### 页面地图与导航

```
动作库 (index)  ──navigateTo──▶  详情 (detail)
   ▲  ▲                              │ toggleFav → storage
   │  └──────── switchTab ──────────┘
收藏 (favorites)  ──navigateTo──▶  详情 (detail)
训练计划 (plans)  ──navigateTo──▶  计划详情 (plan-detail)
   │                                    │ 列表项 → 详情 (detail)
   └── 由计划内「开始训练」进入首个动作
我的 (profile)
        │
        └── 统计实时读取 storage 收藏数与 exercises 数据总量
```

- 四个 tab 页（`index` / `plans` / `favorites` / `profile`）通过 `custom: true` 自定义 TabBar 渲染，各自 `onShow` 调用 `getTabBar().setData({selected})` 同步高亮（索引 0–3）。
- 详情页、计划详情页为非 tab 页，由 tab 页 `navigateTo` 进入；收藏状态写入 `wx.storage` 键 `ff_favorites`（ID 数组），`favorites` 与 `profile` 实时读取。
- 训练计划数据位于 `utils/plans.js`（由 `dataset-ref/build-plans.js` 从数据集生成），每个计划含 `exerciseIds`、`level`、`duration`、`target`、封面色相 `hue`；计划详情解析 ID 为完整动作对象（带中文标签）。

---

## 六、交互与动效 Motion

- 过渡：`--ff-tr-fast 150ms` / `--ff-tr 250ms`，缓动 `cubic-bezier(0.4,0,0.2,1)`
- 反馈：卡片按压下沉 + 缩微缩放；图片 `scale(1.06)` 微放大，增强可点感
- 尊重系统「减少动态效果」偏好（后续可接入 `prefers-reduced-motion`）

---

## 七、无障碍 Accessibility

- 正文（`--ff-ink-900` / `--ff-ink-500`）对白底对比度 ≥ 4.5:1
- 激活态不仅靠颜色：配合字重、底纹、图标区分
- 触控目标 ≥ 44rpx；列表卡片整卡可点
- 媒体加载失败有文字占位（`.ph-box`），不出现破图

---

## 八、接入与维护

- **改动入口**：仅修改 `app.wxss` 令牌即可全局换肤；页面样式不得写死色值。
- **主题扩展**：令牌已变量化，新增 `.theme-dark` 覆盖同名变量即可支持深色模式。
- **预览**：`design/preview.html` 为高保真令牌与组件画廊，浏览器直接打开走查。
- **打包**：`design/` 与 `dataset-ref/` 已在 `project.config.json` 的 `packOptions.ignore` 中排除，不计入上传包。
