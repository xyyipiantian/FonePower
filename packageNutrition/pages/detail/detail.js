// 营养食材详情（分包页）
const { getById } = require('../../utils/nutrition.js');

Page({
  data: {
    item: null
  },

  onLoad(opt) {
    const id = Number(opt.id);
    const item = getById(id);
    if (!item) {
      wx.setNavigationBarTitle({ title: '食材详情' });
      this.setData({ item: null });
      return;
    }
    // 规整空值，避免模板显示 null
    ['protein', 'carbs', 'fat', 'fiber', 'sodium'].forEach(function (k) {
      if (item[k] === null || item[k] === undefined) item[k] = '—';
    });
    wx.setNavigationBarTitle({ title: item.name });
    this.setData({ item: item });
  }
});
