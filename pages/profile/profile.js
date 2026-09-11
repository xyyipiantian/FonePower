const exercises = require('../../utils/exercises.js');
const favGuide = require('../../utils/favGuide.js');
const cloud = require('../../utils/cloud.js');

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
      favCount: cloud.getFavs().length
    });

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }

    const comp = this.selectComponent('#favGuide');
    if (this.data.favCount > 0) {
      // P1：已有收藏资产，提示「换手机也不丢」引导添加
      favGuide.tryGuide(comp, {
        text: `你已收藏 ${this.data.favCount} 个动作，添加到「我的小程序」，换手机也不丢。`
      });
    } else if (favGuide.isShareEntry()) {
      favGuide.tryGuide(comp, { text: '把 FitFlow 放进「我的小程序」，下拉就能练，不用再搜。' });
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
  },

  // 原生菜单「收藏」：定制收藏卡片标题
  onAddToFavorites() {
    return { title: 'FitFlow 健身动作库 · 科学训练指南' };
  },

  // 打开数据源仓库
  openRepo() {
    wx.setClipboardData({
      data: 'https://github.com/hasaneyldrm/exercises-dataset',
      success: () => wx.showToast({ title: '仓库链接已复制', icon: 'none' }),
      fail: () => wx.showToast({ title: '请先同意隐私协议后再复制', icon: 'none' })
    });
  },

  // 打开媒体版权方
  openGymvisual() {
    wx.setClipboardData({
      data: 'https://gymvisual.com/',
      success: () => wx.showToast({ title: '版权方链接已复制', icon: 'none' }),
      fail: () => wx.showToast({ title: '请先同意隐私协议后再复制', icon: 'none' })
    });
  },

  goTrainingLog() {
    wx.navigateTo({ url: '/pages/training-log/training-log' });
  },

  // 重新启动新手引导：清掉本地标记 + 回到首页让 onShow 触发
  restartOnboarding() {
    try {
      wx.removeStorageSync('ff.onboarding.done');
    } catch (e) {}
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
