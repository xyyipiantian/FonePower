const exercises = require('../../utils/exercises.js');
const favGuide = require('../../utils/favGuide.js');

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
    const comp = this.selectComponent('#favGuide');
    if (favGuide.isShareEntry()) {
      // 通过分享卡片进入：黄金转化窗口，引导添加到我的小程序
      favGuide.tryGuide(comp, { text: '把 FitFlow 放进「我的小程序」，下拉就能练，不用再搜。' });
    } else if (favGuide.getBrowsedCount() >= 5) {
      // P2 兜底：高活跃但从未引导过的用户
      favGuide.tryGuide(comp, { text: '常来练？把 FitFlow 放进「我的小程序」，下拉就能打开。' });
    }

    // 新手引导（首次进入自动启动，跳过/完成后不再触发）
    if (!this._onboardingTried) {
      this._onboardingTried = true;
      setTimeout(() => {
        const ob = this.selectComponent('#onboarding');
        if (ob && ob.show) ob.show();
      }, 1500);
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
  },

  // 进入营养食材分包（二级入口）
  onGoNutrition() {
    wx.navigateTo({ url: '/packageNutrition/pages/list/list' });
  },

  // 转发给好友：以动作库首页为入口，携带收录总量
  onShareAppMessage() {
    const total = this.data.libraryTotal || (exercises.EXERCISES && exercises.EXERCISES.length) || 0;
    return {
      title: `FitFlow 健身动作库 · 收录 ${total} 个标准动作动态图解`,
      path: 'pages/index/index'
    };
  },

  // 分享到朋友圈：引导用户进入动作库
  onShareTimeline() {
    return {
      title: 'FitFlow 健身动作库 · 千余条动作动态图解，科学跟练',
      query: ''
    };
  },

  // 原生菜单「收藏」：定制收藏卡片标题
  onAddToFavorites() {
    return { title: 'FitFlow 健身动作库 · 千余条标准动作动态图解' };
  }
});
