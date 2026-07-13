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
  }
});
