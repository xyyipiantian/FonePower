// 营养食材库 · 列表页（分包入口）
const { NUTRITION, searchNutrition } = require('../../utils/nutrition.js');

const PAGE_SIZE = 60;

Page({
  data: {
    keyword: '',
    list: [],
    total: 0,
    hasMore: false
  },

  // 当前筛选结果全集（用于分页）
  _all: [],

  onLoad() {
    this._all = NUTRITION;
    this._render('');
  },

  _render(q) {
    const res = q ? searchNutrition(q) : this._all;
    const slice = res.slice(0, PAGE_SIZE);
    this.setData({
      total: res.length,
      list: slice,
      hasMore: res.length > PAGE_SIZE
    });
  },

  onSearch(e) {
    const q = (e.detail.value || '').trim();
    this.setData({ keyword: q });
    this._render(q);
  },

  clearKeyword() {
    this.setData({ keyword: '' });
    this._render('');
  },

  onReachBottom() {
    if (!this.data.hasMore) return;
    const next = this.data.list.length + PAGE_SIZE;
    const slice = this._all.slice(0, next);
    this.setData({
      list: slice,
      hasMore: next < this._all.length
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/packageNutrition/pages/detail/detail?id=' + id });
  }
});
