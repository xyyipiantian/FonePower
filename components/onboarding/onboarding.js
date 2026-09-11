// =====================================================================
// FitFlow · 新手引导组件 (Onboarding Coach Mark)
// 触发：app.onLaunch 时检测本地标记，未完成则挂载并启动
// 流程：4 步（欢迎 / 动作库 / 训练计划 / 训练日志），每步含上下导航
// 完成：写入 wx.storage 'ff.onboarding.done' = 1，下次不再触发
// =====================================================================

const STORAGE_KEY = 'ff.onboarding.done';

// 引导步骤数据（4 步）
const STEPS = [
  {
    key: 'welcome',
    icon: '👋',
    title: '欢迎来到 FitFlow',
    body: '这是一个给你自己用的健身工具。\n30 秒带你认识 3 个核心 Tab，按"下一步"开始。',
    bg: '#00A87C'
  },
  {
    key: 'exercises',
    icon: '💪',
    title: '动作库',
    body: '1324 个标准动作 · 按部位 / 器械 / 目标肌群筛选 · 每个动作都有 GIF 演示、分步要领、训练技巧。\n\n收藏喜欢的动作，方便日后训练时调用。',
    bg: '#3B82F6'
  },
  {
    key: 'plans',
    icon: '📋',
    title: '训练计划',
    body: '7 套预设计划（胸 / 背 / 肩 / 腿 / 核心 / 全身 + 推荐课程）。\n\n也可以自己组合动作做一份专属计划。每条计划都能切换「健身房 / 居家 / 纯徒手」三套动作。',
    bg: '#F59E0B'
  },
  {
    key: 'log',
    icon: '📊',
    title: '训练日志',
    body: '在「我的」Tab 里：\n· 每次训练自动记录（重量 / 组数 / RPE）\n· 7 天 / 30 天训练趋势\n· 重新开始任意一次训练\n\n记得保持节奏，不用每天练。',
    bg: '#8B5CF6'
  }
];

Component({
  data: {
    visible: false,
    step: 0,            // 0..3
    steps: STEPS,
    total: STEPS.length,
    isLast: false
  },

  lifetimes: {
    attached() {
      // 外部通过 setData 触发 show，本组件不做自动启动
    }
  },

  methods: {
    /** 外部调用：启动引导（先检查本地标记） */
    show() {
      try {
        const done = wx.getStorageSync(STORAGE_KEY);
        if (done) return;
      } catch (e) {}
      this.setData({
        visible: true,
        step: 0,
        isLast: false
      });
    },

    next() {
      const cur = this.data.step;
      if (cur >= this.data.total - 1) {
        this._complete();
        return;
      }
      const nextStep = cur + 1;
      this.setData({
        step: nextStep,
        isLast: nextStep >= this.data.total - 1
      });
      // 触觉反馈
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    },

    prev() {
      const cur = this.data.step;
      if (cur <= 0) return;
      const prevStep = cur - 1;
      this.setData({
        step: prevStep,
        isLast: false
      });
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    },

    skip() {
      wx.showModal({
        title: '跳过新手引导？',
        content: '可以在「我的」Tab 顶部重新启动引导。',
        confirmText: '跳过',
        cancelText: '继续看',
        success: (res) => {
          if (res.confirm) this._complete();
        }
      });
    },

    _complete() {
      try {
        wx.setStorageSync(STORAGE_KEY, 1);
      } catch (e) {}
      this.setData({ visible: false });
      this.triggerEvent('done');
      if (wx.vibrateShort) wx.vibrateShort({ type: 'medium' });
    }
  }
});