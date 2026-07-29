const exercises = require('../../utils/exercises.js');

const FAV_KEY = 'ff_favorites';
function getFavs() {
  try { return wx.getStorageSync(FAV_KEY) || []; } catch (e) { return []; }
}

Page({
  data: {
    total: 0,
    bodyPartCount: 0,
    favCount: 0
  },

  onShow() {
    this.setData({
      total: exercises.EXERCISES.length,
      bodyPartCount: exercises.getOptions('bodyPart').length,
      favCount: getFavs().length
    });

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
  },

  // 转发给好友：个人中心无独立内容，落地到动作库首页
  onShareAppMessage() {
    return {
      title: 'FitFlow 健身动作库 · 千余条动作动态图解与训练计划',
      path: 'pages/index/index'
    };
  },

  // 分享到朋友圈：同样落地到动作库首页，避免入口灰掉
  onShareTimeline() {
    return {
      title: 'FitFlow 健身动作库 · 千余条动作动态图解与训练计划',
      query: ''
    };
  }
});
