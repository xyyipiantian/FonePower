const favGuide = require('../../utils/favGuide.js');

Component({
  data: {
    visible: false,
    mode: 'bar',
    text: '',
    title: '',
    arrowStyle: ''
  },

  lifetimes: {
    detached() {
      if (this._timer) clearTimeout(this._timer);
    }
  },

  methods: {
    // 由页面调用：opts = { mode, title, text }
    show(opts) {
      const mode = opts.mode === 'modal' ? 'modal' : 'bar';
      const d = {
        visible: true,
        mode,
        text: opts.text || '',
        title: opts.title || ''
      };

      if (mode === 'bar') {
        // 计算指向右上角胶囊菜单（···）的箭头水平位置
        try {
          const rect = wx.getMenuButtonBoundingClientRect();
          const sys = wx.getSystemInfoSync();
          const rpxRatio = 750 / sys.windowWidth;
          const rightPx = sys.windowWidth - rect.right;
          const rightRpx = Math.round(rightPx * rpxRatio);
          d.arrowStyle = 'right:' + rightRpx + 'rpx;';
        } catch (e) {}

        // 4 秒后自动收起（被动关闭不计入拒绝）
        if (this._timer) clearTimeout(this._timer);
        this._timer = setTimeout(() => {
          this.setData({ visible: false });
        }, 4000);
      }

      this.setData(d);
    },

    hide() {
      if (this._timer) clearTimeout(this._timer);
      this.setData({ visible: false });
    },

    onClose() {
      favGuide.markDismissed();
      this.hide();
    },

    onGoAdd() {
      // 无法程序化打开菜单，仅关闭并提示用户手动点击 ···
      favGuide.markDismissed();
      this.hide();
      wx.showToast({
        title: '点击右上角 ··· 添加到我的小程序',
        icon: 'none',
        duration: 2200
      });
    },

    onBarTap() {
      wx.showToast({
        title: '点击右上角 ··· 添加到我的小程序',
        icon: 'none',
        duration: 2200
      });
    },

    noOp() {}
  }
});
