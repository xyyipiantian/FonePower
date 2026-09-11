# Step 1 改造总览 · 焚诀三分化集成

> 2026-09-10 · D:\GitFolder\59110\FitFlow

## 改了什么
| 文件 | 改动 | 影响 |
|---|---|---|
| `utils/plans.js` | 新增 `fenshen-3day` 结构化计划（3 天 × 5 动作 = 15 条目） | 保留旧 6 个计划，零破坏 |
| `pages/plan-detail/plan-detail.js` | 读 `wx.getStorageSync('ff.env')`、装配 days、自动重载 | 自动兼容旧/新结构 |
| `pages/plan-detail/plan-detail.wxml` | 排程卡 + 器械条件面板 + day 分组 + item 卡（含 pill/要点/口令/缩略图） | 仅结构化计划生效 |
| `pages/plan-detail/plan-detail.wxss` | sched/env/day/item 四组样式 | 增量 +6KB |

## 核心数据形状
```js
{
  id: 'fenshen-3day', name: '焚诀三分化 · 8 天循环',
  schedule: { cycle: 8, pattern: '推-拉-腿-休 | 推-拉-腿-休', note: '...' },
  envHint: { gym: '...', home: '...', bodyweight: '...' },
  days: [
    { name: '推', focus: '胸 · 三头 · 前束',
      items: [
        { sets: 4, reps: '15/12/10/8', rpe: 8, rest: 90,
          variants: {
            gym: { id: '0025', name: '杠铃卧推', note: '...', cue: '肘往裤兜走' },
            home: { id: '0065', name: '杠铃地面推', note: '...', cue: '...' },
            bodyweight: { id: '1311', name: '宽距俯卧撑', note: '...', cue: '...' }
          }
        },
        // ... 共 5 条
      ]
    },
    { name: '拉', items: [...] },
    { name: '腿', items: [...] }
  ]
}
```

## 校验结果
- **39/39 variant id 全部命中动作库**（gym 15 + home 13 + bodyweight 11，跨版本少量复用）
- 7 个计划（原 6 + 焚诀 1）
- 3 天 / 5 动作 / 共 15 条目
- 打包体积 1.5M（含 dataset-ref 排除），主包限 2M 内
- 旧 6 个 plan 的 `exerciseIds` 路径 100% 兼容，零破坏

## 用户视角的体验
1. 微信开发者工具导入 `D:\GitFolder\59110\FitFlow` 编译
2. 「训练计划」页看到 7 个卡片
3. 点「焚诀三分化 · 8 天循环」进入详情
4. 看到「器械条件：健身房 ▼」可切换到「居家」或「纯徒手」
5. 切完后所有动作的卡片自动重渲：动作名 + 缩略图 + 倒金字塔 pill + 要点 + 口令
6. 点缩略图跳到动作详情页查 GIF

## 待你做的事
- **C 盘 5 项残留（39M）**：在 C 盘会话目录里手动清理（沙箱拦截了回收站批量删）
- **跑 Step 0 验证**：微信开发者工具导入，验证 5 件事（GIF 动 / 搜索 / 下肢力量假数据 / 收藏 / TabBar）
- **回来跑 Step 1 验证**：进入焚诀计划卡片，切换器械条件看效果

## 已知遗留（不影响运行）
- bodyweight 版「杠铃卧推/上斜哑铃卧推」无纯徒手替代，回落 gym 版的同动作
- dataset-ref 中文名映射脚本可能存在重复 id（无害）
