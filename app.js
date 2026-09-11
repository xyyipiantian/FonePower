const cloud = require('./utils/cloud.js');

App({
  globalData: {
    appName: 'FitFlow',
    version: '1.1.0',
    // 数据集来源（MIT），媒体资源 © Gym visual
    dataSource: 'https://github.com/hasaneyldrm/exercises-dataset'
  },
  onLaunch() {
    // 启用 __usePrivacyCheck__ 后，微信会在用户首次进入小程序时自动弹隐私协议。
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          this.globalData.needAuthorization = !!res.needAuthorization;
        }
      });
    }
    // 静默登录 + 拉取云端数据（未开通云环境时自动降级本地）
    cloud.ensureLogin().then(() => {
      return Promise.all([
        cloud.pullFavs(),
        cloud.pullPlans(),
        cloud.pullPlanOrder(),
        cloud.pullOverrides()
      ]);
    }).catch(() => {});
  }
});
