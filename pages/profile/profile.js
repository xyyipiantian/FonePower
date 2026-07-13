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
  }
});
