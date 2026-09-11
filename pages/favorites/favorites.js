const exercises = require('../../utils/exercises.js');
const favGuide = require('../../utils/favGuide.js');
const cloud = require('../../utils/cloud.js');

// 每页条数：控制单次 setData 传输量
const PAGE_SIZE = 120;

Page({
  data: {
    list: [],
    total: 0,
    hasMore: false
  },

  onShow() {
    // 调试自检：进收藏页时打印本地 vs 云端状态
    const localFavs = cloud.getFavs();
    const sysInfo = wx.getSystemInfoSync();
    console.log('[favorites.onShow] 本地收藏数=' + localFavs.length + ' cloudReady=' + cloud.isCloudReady() + ' platform=' + sysInfo.platform);

    this._all = cloud.getFavs()
      .map(id => exercises.getListById(id))
      .filter(Boolean);
    this._page = 0;
    this.setData({ total: this._all.length });
    this.renderPage();

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    if (favGuide.isShareEntry()) {
      const comp = this.selectComponent('#favGuide');
      favGuide.tryGuide(comp, { text: '把 FitFlow 放进「我的小程序」，下拉就能练，不用再搜。' });
    }
  },

  renderPage() {
    const end = (this._page + 1) * PAGE_SIZE;
    const slice = this._all.slice(0, end);
    this.setData({ list: slice, hasMore: end < this._all.length });
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this._page++;
      this.renderPage();
    }
  },

  onImgError(e) {
    const id = e.currentTarget.dataset.id;
    const idx = this.data.list.findIndex(it => it.id === id);
    if (idx > -1) {
      this.setData({ [`list[${idx}]._err`]: true });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  // 转发给好友：个人收藏页无独立内容，落地到动作库首页并引导收藏功能
  onShareAppMessage() {
    return {
      title: 'FitFlow 健身动作库 · 一键收藏你喜欢的标准动作',
      path: 'pages/index/index'
    };
  },

  // 分享到朋友圈：同样落地到动作库首页，避免入口灰掉
  onShareTimeline() {
    return {
      title: 'FitFlow 健身动作库 · 一键收藏标准动作',
      query: ''
    };
  },

  // 原生菜单「收藏」：定制收藏卡片标题
  onAddToFavorites() {
    return { title: 'FitFlow 我的收藏 · 一键收藏标准动作' };
  }
});
