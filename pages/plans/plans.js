const plans = require('../../utils/plans.js');
const favGuide = require('../../utils/favGuide.js');
const cloud = require('../../utils/cloud.js');
const trainingLog = require('../../utils/trainingLog.js');

Page({
  data: {
    plans: [],            // 当前展示的计划（已按 planOrder 排序后合并 builtin + custom）
    customPlans: [],      // 仅用于内部：自定义计划（用户新建的）
    showBackTop: false,
    editing: false        // 编辑模式（显示 ↑/↓ 按钮）
  },

  onLoad() {
    this.refresh();
  },

  refresh() {
    const builtin = plans.PLANS.map(p => {
      let count;
      if (p.days && Array.isArray(p.days)) {
        count = p.days.reduce((a, d) => a + d.items.length, 0);
      } else {
        count = (p.exerciseIds || []).length;
      }
      const days = p.days ? p.days.length : 0;
      const cycle = (p.schedule && p.schedule.cycle) || days;
      const lastLog = trainingLog.getLastLogForPlan(p.id);
      const lastDays = trainingLog.getDaysSinceLast(p.id);
      const todayIdx = trainingLog.getCurrentDayIndex(p.id, cycle);
      const todayDay = (p.days && p.days[todayIdx]) ? p.days[todayIdx] : null;
      return Object.assign({}, p, {
        _kind: 'builtin',
        _count: count,
        _lastDays: lastDays,
        _lastDate: lastLog ? this._fmtRel(lastLog.endAt) : '未练过',
        _todayName: todayDay ? todayDay.name : '',
        _todayFocus: todayDay ? todayDay.focus : ''
      });
    });
    const custom = cloud.getPlans().map(p => {
      const lastLog = trainingLog.getLastLogForPlan(p.id);
      return Object.assign({}, p, {
        _kind: 'custom',
        _lastDate: lastLog ? this._fmtRel(lastLog.endAt) : '未练过',
        _count: (p.exercises || []).length
      });
    });

    // 按用户自定义顺序排序
    const order = cloud.getPlanOrder();
    const all = builtin.concat(custom);
    const sorted = this._sortByOrder(all, order);

    this.setData({ plans: sorted, customPlans: custom });
  },

  // 按用户保存的 id 顺序排序；新出现的 id 追加在末尾
  _sortByOrder(items, order) {
    if (!order || !order.length) return items;
    const idx = {};
    order.forEach((id, i) => { idx[id] = i; });
    return items.slice().sort((a, b) => {
      const ai = (a.id in idx) ? idx[a.id] : 9999;
      const bi = (b.id in idx) ? idx[b.id] : 9999;
      return ai - bi;
    });
  },

  _fmtRel(ts) {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return days + ' 天前';
    if (days < 30) return Math.floor(days / 7) + ' 周前';
    return Math.floor(days / 30) + ' 月前';
  },

  onShow() {
    this.refresh();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    if (favGuide.isShareEntry()) {
      const comp = this.selectComponent('#favGuide');
      favGuide.tryGuide(comp, { text: '把 FitFlow 放进「我的小程序」，下拉就能练，不用再搜。' });
    }
  },

  onPageScroll(e) {
    const show = e.scrollTop > 400;
    if (show !== this.data.showBackTop) {
      this.setData({ showBackTop: show });
    }
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  goPlan(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.editing) return; // 编辑模式下点击不跳转
    wx.navigateTo({ url: `/pages/plan-detail/plan-detail?id=${id}` });
  },

  goCustomPlan(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.editing) return;
    wx.navigateTo({ url: `/pages/custom-plan/custom-plan?id=${id}` });
  },

  createPlan() {
    if (this.data.editing) return;
    wx.navigateTo({ url: '/pages/plan-editor/plan-editor' });
  },

  // 编辑模式切换
  toggleEdit() {
    this.setData({ editing: !this.data.editing });
    wx.vibrateShort && wx.vibrateShort({ type: 'light' });
  },

  // 上移
  moveUp(e) {
    const id = e.currentTarget.dataset.id;
    const arr = this.data.plans.slice();
    const i = arr.findIndex(p => p.id === id);
    if (i <= 0) return;
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    this._afterReorder(arr);
    wx.vibrateShort && wx.vibrateShort({ type: 'light' });
  },

  // 下移
  moveDown(e) {
    const id = e.currentTarget.dataset.id;
    const arr = this.data.plans.slice();
    const i = arr.findIndex(p => p.id === id);
    if (i < 0 || i >= arr.length - 1) return;
    [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
    this._afterReorder(arr);
    wx.vibrateShort && wx.vibrateShort({ type: 'light' });
  },

  _afterReorder(arr) {
    const ids = arr.map(p => p.id);
    cloud.setPlanOrder(ids);
    this.setData({ plans: arr });
  },

  onShareAppMessage() {
    return {
      title: 'FitFlow 训练计划 · 胸/背/肩/腿/核心全套跟练方案',
      path: 'pages/plans/plans'
    };
  },

  onShareTimeline() {
    return {
      title: 'FitFlow 训练计划 · 科学规划日常训练',
      query: ''
    };
  },

  onAddToFavorites() {
    return { title: 'FitFlow 训练计划 · 科学编排的跟练方案' };
  }
});