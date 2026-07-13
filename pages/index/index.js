const exercises = require('../../utils/exercises.js');

// 每页条数：控制单次 setData 传输量，避免触发性能告警（建议 < 256KB/次）
const PAGE_SIZE = 120;

Page({
  data: {
    libraryTotal: 0,
    total: 0,
    keyword: '',
    activeDim: 'bodyPart',
    activeValue: '',
    options: [],
    list: [],
    hasMore: false,
    showBackTop: false
  },

  onLoad() {
    this.setData({ libraryTotal: exercises.EXERCISES.length });
    this.refresh();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  // 切换筛选维度（身体部位 / 器械 / 目标肌群）
  setDim(e) {
    const dim = e.currentTarget.dataset.dim;
    if (dim === this.data.activeDim) return;
    this.setData({ activeDim: dim, activeValue: '', options: exercises.getOptions(dim) }, () => {
      this.refresh();
    });
  },

  // 选择某个筛选值（'' 表示全部）
  selectValue(e) {
    const value = e.currentTarget.dataset.value;
    if (value === this.data.activeValue) return;
    this.setData({ activeValue: value }, () => this.refresh());
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value }, () => this.refresh());
  },

  clearKeyword() {
    this.setData({ keyword: '' }, () => this.refresh());
  },

  // 根据当前维度、值、关键词重新计算列表（完整结果驻留内存，不进 setData）
  refresh() {
    const { activeDim, activeValue, keyword } = this.data;
    const filter = {};
    filter[activeDim] = activeValue;
    filter.keyword = keyword;
    this._all = exercises.filterList(filter);
    this._page = 0;
    this.setData({ total: this._all.length });
    this.renderPage();
  },

  // 仅把当前页的切片交给 setData，控制传输体量
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

  // 监听页面滚动，下滑超过阈值才显示「返回顶部」
  onPageScroll(e) {
    const show = e.scrollTop > 400;
    if (show !== this.data.showBackTop) {
      this.setData({ showBackTop: show });
    }
  },

  // 一键回到列表顶部
  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  // 仅更新出错的那一项，避免回传整列 list
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
  }
});
