const exercises = require('../../utils/exercises.js');
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    plan: null,
    list: []
  },

  onLoad(query) {
    const plan = cloud.getPlans().find(p => p.id === query.id);
    if (!plan) {
      this.setData({ plan: null });
      return;
    }
    wx.setNavigationBarTitle({ title: plan.name });
    const list = plan.exercises.map((it, idx) => {
      const ex = exercises.getById(it.id);
      return Object.assign({}, it, {
        idx: idx + 1,
        name: ex ? (ex.nameZh || ex.name) : it.id,
        image: ex ? ex.image : '',
        hasEx: !!ex
      });
    });
    this.setData({ plan, list });
  },

  onShow() {
    // 从编辑器返回后刷新（支持编辑场景）
    if (this.data.plan) {
      this.onLoad({ id: this.data.plan.id });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  goEdit() {
    const plan = this.data.plan;
    if (!plan) return;
    wx.navigateTo({ url: `/pages/plan-editor/plan-editor?id=${plan.id}` });
  },

  deletePlan() {
    const plan = this.data.plan;
    if (!plan) return;
    wx.showModal({
      title: '删除计划',
      content: `确定删除「${plan.name}」吗？`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          const plans = cloud.getPlans().filter(p => p.id !== plan.id);
          cloud.setPlans(plans);
          wx.showToast({ title: '已删除', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 500);
        }
      }
    });
  }
});
