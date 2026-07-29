const plans = require('../../utils/plans.js');

Page({
  data: {
    plans: [],
    showBackTop: false
  },

  onLoad() {
    this.setData({ plans: plans.PLANS });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  onPageScroll(e) {
    const show = e.scrollTop > 400;
    if (show !== this.data.showBackTop) {
      this.setData({ showBackTop: show });
    }
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  goPlan(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/plan-detail/plan-detail?id=${id}` });
  },

  // 转发给好友：以训练计划列表为入口
  onShareAppMessage() {
    return {
      title: 'FitFlow 训练计划 · 胸/背/肩/腿/核心全套跟练方案',
      path: 'pages/plans/plans'
    };
  },

  // 分享到朋友圈：引导用户进入训练计划
  onShareTimeline() {
    return {
      title: 'FitFlow 训练计划 · 科学规划日常训练',
      query: ''
    };
  }
});
