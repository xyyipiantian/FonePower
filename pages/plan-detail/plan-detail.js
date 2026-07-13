const exercises = require('../../utils/exercises.js');
const plans = require('../../utils/plans.js');

Page({
  data: {
    plan: null,
    exercises: []
  },

  onLoad(query) {
    const plan = plans.getPlanById(query.id);
    if (!plan) {
      this.setData({ plan: null });
      return;
    }
    const list = plan.exerciseIds.map(id => exercises.getById(id)).filter(Boolean);
    wx.setNavigationBarTitle({ title: plan.name });
    this.setData({ plan: plan, exercises: list });
  },

  onImgError(e) {
    const id = e.currentTarget.dataset.id;
    const idx = this.data.exercises.findIndex(it => it.id === id);
    if (idx > -1) {
      this.setData({ [`exercises[${idx}]._err`]: true });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  startTrain() {
    const first = this.data.exercises[0];
    if (!first) return;
    wx.showToast({ title: '开始第 1 个动作', icon: 'none' });
    wx.navigateTo({ url: `/pages/detail/detail?id=${first.id}` });
  }
});
