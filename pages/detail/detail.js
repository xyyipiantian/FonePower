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
  }
});
