const exercises = require('../../utils/exercises.js');

const FAV_KEY = 'ff_favorites';
function getFavs() {
  try { return wx.getStorageSync(FAV_KEY) || []; } catch (e) { return []; }
}
function setFavs(arr) {
  wx.setStorageSync(FAV_KEY, arr);
}

Page({
  data: {
    ex: null,
    fav: false
  },

  onLoad(query) {
    const ex = exercises.getById(query.id);
    if (ex) {
      wx.setNavigationBarTitle({ title: ex.name });
    }
    this.setData({ ex, fav: getFavs().indexOf(query.id) > -1 });
  },

  onErr() {
    this.setData({ 'ex._err': true });
  },

  toggleFav() {
    const ex = this.data.ex;
    if (!ex) return;
    const id = ex.id;
    const favs = getFavs();
    const has = favs.indexOf(id) > -1;
    const next = has ? favs.filter(x => x !== id) : favs.concat(id);
    setFavs(next);
    this.setData({ fav: !has });
    wx.showToast({ title: has ? '已取消收藏' : '已收藏', icon: 'none' });
  },

  // 转发给好友：携带动作 id，打开直达对应动作详情
  onShareAppMessage() {
    const ex = this.data.ex;
    if (!ex || !ex.id) {
      return { title: 'FitFlow 健身动作库', path: 'pages/index/index' };
    }
    const share = {
      title: `${ex.name || '健身动作'} · 标准动作动态图解 | FitFlow`,
      path: `pages/detail/detail?id=${ex.id}`
    };
    if (ex.image) share.imageUrl = ex.image;
    return share;
  },

  // 分享到朋友圈：query 携带动作 id，缩略图用动作配图
  onShareTimeline() {
    const ex = this.data.ex;
    if (!ex || !ex.id) {
      return { title: 'FitFlow 健身动作库', query: '' };
    }
    const res = {
      title: `${ex.name || '健身动作'} · 标准动作动态图解`,
      query: `id=${ex.id}`
    };
    if (ex.image) res.imageUrl = ex.image;
    return res;
  }
});
