const exercises = require('../../utils/exercises.js');
const favGuide = require('../../utils/favGuide.js');

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
    // P2 浏览计数：每查看一个动作详情 +1
    favGuide.incBrowsedCount();
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
    // P0：首次收藏成功，趁正向时刻引导添加到我的小程序（轻量模态）
    if (!has) {
      const n = getFavs().length;
      const comp = this.selectComponent('#favGuide');
      favGuide.tryGuide(comp, {
        mode: 'modal',
        title: `已收藏 ${n} 个动作`,
        text: '添加到「我的小程序」，你收藏的动作随时都在，下拉就能练。'
      });
    }
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
  },

  // 原生菜单「收藏」：定制收藏卡片
  onAddToFavorites() {
    const ex = this.data.ex;
    const res = { title: (ex && ex.name ? ex.name + ' · ' : '') + 'FitFlow 健身动作库' };
    if (ex && ex.image) res.imageUrl = ex.image;
    return res;
  },

  onShow() {
    // 通过分享卡片进入动作详情：引导添加到我的小程序
    if (favGuide.isShareEntry()) {
      const comp = this.selectComponent('#favGuide');
      favGuide.tryGuide(comp, { text: '喜欢这个动作？添加到「我的小程序」，训练时一点就到 ↗' });
    }
  }
});
