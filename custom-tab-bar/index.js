Component({
  options: {
    addGlobalClass: true,
    styleIsolation: 'apply-shared'
  },
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '动作库', icon: 'ico-lib', iconOn: 'ico-lib--on' },
      { pagePath: '/pages/plans/plans', text: '训练计划', icon: 'ico-calendar', iconOn: 'ico-calendar--on' },
      { pagePath: '/pages/favorites/favorites', text: '收藏', icon: 'ico-heart-o', iconOn: 'ico-heart--on' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: 'ico-user', iconOn: 'ico-user--on' }
    ]
  },
  methods: {
    switchTab(e) {
      const idx = e.currentTarget.dataset.index;
      if (idx === this.data.selected) return;
      const url = this.data.list[idx].pagePath;
      // 轻触感反馈，提升交互质感
      if (wx.canIUse('vibrateShort')) {
        wx.vibrateShort({ type: 'light' }).catch((err) => {
          // 仅在「隐私拒绝」时提示；设备不支持振动属正常情况，保持静默
          if (err && /privacy/i.test(err.errMsg || '')) {
            wx.showToast({ title: '请先同意隐私协议', icon: 'none' });
          }
        });
      }
      wx.switchTab({ url });
    }
  }
});
