# Step 2a/2b/2c 改造总览

> 2026-09-10 · D:\GitFolder\59110\FitFlow

## 本次完成的三件事

### 2a · hero 背景图 + 标题可读性（已完成）
- **问题**：无背景图时，白色标题被浅色渐变 + 右上角水印 icon 压住，看不清。
- **修复**：
  - 加 `.hero-mask` 底部暗色遮罩（黑 0→0.28 渐变），标题永远清晰
  - 标题加 `text-shadow`
  - 水印透明度 0.25 → 0.16，避免压字
  - 焚诀 plan 用珊瑚色深渐变（#7C2D12 → #C2410C → #EA580C），有「焚诀」的力量感
- **没碰谭成义肖像**：改用纯 CSS 渐变 + 装饰，规避肖像权 + 平台审核风险

### 2b · CloudBase + 微信静默登录（代码完成，待开通云环境）
- 新增 `utils/cloud.js`：统一封装云能力，**CLOUD_ENV 为空时自动降级本地 Storage**（未开通也能跑）
- 新增 `cloudfunctions/login/`：云函数拿 openid
- `app.js` 启动时静默登录 + 拉取云端收藏/计划
- 收藏逻辑（detail/favorites/profile）全部改走 cloud.js
- **数据隔离**：云端按 `users/{openid}` 存，用户之间互不冲突

### 2c · 自定义训练计划（已完成，仅自己可见）
- 新增 `pages/plan-editor/`：搜索动作 → 挑动作 → 设组数/次数/RPE/休息 → 保存
- 新增 `pages/custom-plan/`：查看/删除自己的计划
- 训练计划页合并「内置计划 + 我的计划」，加「创建」入口
- 顺手修了焚诀结构化计划在列表页 `exerciseIds.length` 报错的 bug

## 校验结果
- 9/9 JS 文件语法通过
- 页面文件齐全（新增 2 个页面注册到 app.json）
- 7 个计划（原 6 + 焚诀），焚诀 15 动作
- cloud.js 导出完整

## ⚠️ 你需要手动做的（关键，否则云端不同步）
小程序现在**能跑**（云能力自动降级本地），但收藏/计划**不会跨设备同步**，直到你开通云环境：

1. 微信开发者工具 → 点顶部「云开发」按钮 → 开通（个人免费额度够用）
2. 开通后复制「环境 ID」（形如 `fitflow-xxxxx`）
3. 把环境 ID 填进 `utils/cloud.js` 第 11 行 `const CLOUD_ENV = '...'`
4. 右键 `cloudfunctions/login` → 上传并部署（云端安装依赖）
5. 云开发 → 数据库 → 新建集合 `users`（权限选「仅创建者可读写」）

做完这 5 步，收藏和自定义计划就会自动同步到云端、换设备不丢。

## 文件清单
| 类型 | 文件 |
|---|---|
| 新增 | `utils/cloud.js` |
| 新增 | `cloudfunctions/login/index.js` + `package.json` |
| 新增 | `pages/plan-editor/`（js/wxml/wxss/json） |
| 新增 | `pages/custom-plan/`（js/wxml/wxss/json） |
| 修改 | `app.js`、`app.json`、`project.config.json` |
| 修改 | `pages/plans/plans.js` + `plans.wxml` + `plans.wxss` |
| 修改 | `pages/plan-detail/`（js/wxml/wxss，2a + env 走 cloud） |
| 修改 | `pages/detail/detail.js`、`favorites.js`、`profile.js` |
