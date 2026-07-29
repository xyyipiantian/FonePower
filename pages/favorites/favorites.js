const exercises = require('../../utils/exercises.js');

const FAV_KEY = 'ff_favorites';
function getFavs() {
  try { return wx.getStorageSync(FAV_KEY) || []; } catch (e) { return []; }
}

// 每页条数：控制单次 setData 传输量
const PAGE_SIZE = 120;

Page({
  data: {
    list: [],
    total: 0,
    hasMore: false
  },

  onShow() {
    this._all = getFavs()
      .map(id => exercises.getListById(id))
      .filter(Boolean);
    this._page = 0;
    this.setData({ total: this._all.length });
    this.renderPage();

    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
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
  }
});
