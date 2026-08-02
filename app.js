App({
  globalData: {
    appName: 'FitFlow',
    version: '1.0.0',
    // 数据集来源（MIT），媒体资源 © Gym visual
    dataSource: 'https://github.com/hasaneyldrm/exercises-dataset'
  },
  onLaunch() {
    // 启用 __usePrivacyCheck__ 后，微信会在用户首次进入小程序时自动弹隐私协议。
    // 用户同意后，所有标记为隐私接口的 API 才会被放行；拒绝则接口调用 fail。
    // 这里只在启动时查询一次状态，便于各调用点根据状态给出更精准的提示。
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          this.globalData.needAuthorization = !!res.needAuthorization;
        }
      });
    }
    // 不监听 onNeedPrivacyAuthorization，使用微信默认协议弹窗；
    // 用户拒绝时，各调用点的 fail 回调会给出 toast 提示。
  }
});
