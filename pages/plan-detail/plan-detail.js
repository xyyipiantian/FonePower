const exercises = require('../../utils/exercises.js');
const plans = require('../../utils/plans.js');
const favGuide = require('../../utils/favGuide.js');
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    plan: null,
    exercises: [],          // 兼容旧 plan（exerciseIds 数组）
    days: [],               // 结构化 plan（fenshen-3day）
    schedule: null,
    envHint: null,
    env: 'gym',             // 当前器械条件
    envOpen: false,         // 切换面板是否展开
    replaceOpen: false,     // 替换动作浮层
    replaceTarget: null     // { dayIndex, itemIndex, name }
  },

  onLoad(query) {
    this._loadPlan(query.id);
  },

  _loadPlan(planId) {
    const basePlan = plans.getPlanById(planId);
    if (!basePlan) {
      this.setData({ plan: null });
      return;
    }
    wx.setNavigationBarTitle({ title: basePlan.name });

    const env = this._readEnv();
    // 应用用户个性化覆盖（不污染原 plan）
    const plan = cloud.applyOverrides(basePlan);

    // 结构化计划（焚诀三分化 / 升级后的内置计划）
    if (plan.days && Array.isArray(plan.days)) {
      const days = plan.days.map((day, dayIdx) => {
        const items = day.items.map((it, idx) => {
          const variant = it.variants[env] || it.variants.gym || Object.values(it.variants)[0];
          const ex = variant ? exercises.getById(variant.id) : null;
          return {
            idx: idx + 1,
            exerciseId: variant ? variant.id : '',
            name: ex ? (ex.nameZh || ex.name) : (variant ? variant.name : ''),
            image: ex ? ex.image : '',
            initial: ex && ex.nameZh ? ex.nameZh[0] : (ex ? ex.name[0] : '?'),
            gif: ex ? ex.gif : '',
            sets: it.sets,
            reps: it.reps,
            rpe: it.rpe,
            rest: it.rest,
            cue: variant ? variant.cue : '',
            note: variant ? variant.note : '',
            hasEx: !!ex,
            _isOverridden: !!this._isItemOverridden(plan.id, dayIdx, idx)
          };
        });
        return { name: day.name, focus: day.focus, items };
      });
      this.setData({
        plan, days, schedule: plan.schedule || null,
        envHint: plan.envHint || null, env,
        isExternal: !!plan.isExternal,
        externalRef: plan.externalRef || null
      });
      return;
    }

    // 旧结构（exerciseIds 数组）
    const list = (plan.exerciseIds || []).map(id => exercises.getById(id)).filter(Boolean);
    this.setData({ plan, exercises: list });
  },

  _isItemOverridden(planId, dayIndex, itemIndex) {
    const ov = cloud.getPlanOverride(planId);
    return !!(ov[dayIndex] && ov[dayIndex][itemIndex]);
  },

  _readEnv() {
    return cloud.getEnv();
  },

  _saveEnv(v) {
    cloud.setEnv(v);
  },

  toggleEnvPanel() {
    this.setData({ envOpen: !this.data.envOpen });
  },

  pickEnv(e) {
    const v = e.currentTarget.dataset.env;
    if (!v || v === this.data.env) {
      this.setData({ envOpen: false });
      return;
    }
    this._saveEnv(v);
    this.onLoad({ id: this.data.plan.id });
    this.setData({ envOpen: false });
    const label = v === 'gym' ? '健身房' : v === 'home' ? '居家' : '纯徒手';
    wx.showToast({ title: '已切换到' + label + '版', icon: 'none' });
  },

  // 长按动作项 → 显示替换/恢复菜单
  onItemLongTap(e) {
    const { day: di, item: ii } = e.currentTarget.dataset;
    const it = (this.data.days[di] && this.data.days[di].items[ii]);
    if (!it) return;
    const isOv = it._isOverridden;
    wx.showActionSheet({
      itemList: isOv
        ? ['替换这个动作', '恢复成原计划动作']
        : ['替换这个动作'],
      success: (res) => {
        if (res.tapIndex === 0) this._openReplace(di, ii);
        if (res.tapIndex === 1 && isOv) this._resetItem(di, ii);
      }
    });
  },

  _openReplace(di, ii) {
    const it = this.data.days[di].items[ii];
    this.setData({
      replaceOpen: true,
      replaceTarget: { dayIndex: di, itemIndex: ii, name: it.name },
      replaceKeyword: ''
    });
  },

  closeReplace() {
    this.setData({ replaceOpen: false, replaceTarget: null, replaceResults: [] });
  },

  onReplaceInput(e) {
    const kw = e.detail.value || '';
    this.setData({ replaceKeyword: kw });
    this._searchReplace(kw);
  },

  _searchReplace(kw) {
    if (!kw || kw.length < 1) {
      this.setData({ replaceResults: [] });
      return;
    }
    const lower = kw.toLowerCase();
    // 从 exercises 数据集挑前 20 个匹配
    const results = exercises.EXERCISES.filter(ex => {
      const n = (ex.nameZh || ex.name || '').toLowerCase();
      return n.indexOf(lower) > -1;
    }).slice(0, 20).map(ex => ({
      id: ex.id,
      name: ex.nameZh || ex.name,
      bodyPart: ex.bodyPart || '',
      target: ex.target || ''
    }));
    this.setData({ replaceResults: results });
  },

  pickReplace(e) {
    const target = this.data.replaceTarget;
    if (!target) return;
    const picked = e.currentTarget.dataset.ex;
    const plan = this.data.plan;
    if (!picked || !plan) return;
    cloud.setItemOverride(plan.id, target.dayIndex, target.itemIndex, {
      id: picked.id,
      name: picked.name,
      note: '',
      cue: ''
    });
    this.setData({ replaceOpen: false, replaceTarget: null, replaceResults: [] });
    this._loadPlan(plan.id);
    wx.showToast({ title: '已替换', icon: 'success' });
  },

  _resetItem(di, ii) {
    const plan = this.data.plan;
    if (!plan) return;
    cloud.clearItemOverride(plan.id, di, ii);
    this._loadPlan(plan.id);
    wx.showToast({ title: '已恢复原计划动作', icon: 'none' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  // 复制计划到「我的计划」（让别人能复用你的训练）
  copyPlan() {
    const plan = this.data.plan;
    if (!plan) return;
    let exercisesArr = [];
    if (plan.days && plan.days.length) {
      // 结构化计划：把今天该练的 day 拍平
      const dayIdx = (this.data.days && this.data.days.length) ?
        Math.min(this.data.days.length - 1, this._todayIdx || 0) : 0;
      const day = plan.days[dayIdx];
      exercisesArr = (day ? day.items : []).map(it => {
        const variant = it.variants[this.data.env] || it.variants.gym || Object.values(it.variants)[0];
        return {
          id: variant ? variant.id : '',
          sets: it.sets || 3,
          reps: (it.reps || '12') + '',
          rpe: it.rpe || 8,
          rest: it.rest || 60,
          note: (variant && variant.note) || '',
          cue: (variant && variant.cue) || ''
        };
      });
    } else if (plan.exerciseIds && plan.exerciseIds.length) {
      exercisesArr = plan.exerciseIds.map(id => ({
        id, sets: 3, reps: '12', rpe: 8, rest: 60, note: '', cue: ''
      }));
    }
    const now = Date.now();
    const newPlan = {
      id: 'custom_' + now,
      name: plan.name + '（我的副本）',
      desc: (plan.desc || '') + (plan.isPublic ? '\n\n来源：内置公开计划' : ''),
      createdAt: now, updatedAt: now,
      isPublic: false,
      sourcePlanId: plan.id,
      exercises: exercisesArr
    };
    const all = cloud.getPlans();
    cloud.setPlans(all.concat(newPlan));
    wx.showToast({ title: '已加入「我的计划」', icon: 'success' });
    setTimeout(() => {
      wx.navigateTo({ url: `/pages/custom-plan/custom-plan?id=${newPlan.id}` });
    }, 600);
  },

  // 外部推荐课程跳转：复制 URL 到剪贴板 + 提示（个人主体小程序不支持外链直跳）
  goExternal() {
    const ref = this.data.externalRef;
    if (!ref || !ref.url) return;
    wx.setClipboardData({
      data: ref.url,
      success: () => {
        wx.showModal({
          title: '已复制到剪贴板',
          content: '链接已复制。打开微信扫一扫/浏览器粘贴即可进入「' + ref.author + '」官方平台。',
          showCancel: false,
          confirmText: '我知道了'
        });
      }
    });
  },

  startTrain() {
    const plan = this.data.plan;
    if (!plan) return;

    // 结构化计划：找到今天该练的 day（基于训练日志）
    let dayIdx = 0;
    let dayItems = null;
    if (plan.days && Array.isArray(plan.days)) {
      // 优先用训练日志推算
      try {
        const trainingLog = require('../../utils/trainingLog.js');
        const cycle = (plan.schedule && plan.schedule.cycle) || plan.days.length;
        const computed = trainingLog.getCurrentDayIndex(plan.id, cycle, plan.schedule && plan.schedule.pattern);
        dayIdx = Math.min(computed, plan.days.length - 1);
      } catch (e) {
        dayIdx = 0;
      }
      const day = plan.days[dayIdx];
      dayItems = (day && day.items) || [];
      // 把 variant 拍平到 items 顶层（训练页需要直接读 sets/reps/rpe/rest/cue/note）
      const items = dayItems.map(it => {
        const variant = it.variants[this.data.env] || it.variants.gym || Object.values(it.variants)[0];
        return Object.assign({}, it, {
          exerciseId: variant ? variant.id : '',
          name: variant ? variant.name : '',
          cue: variant ? variant.cue : '',
          note: variant ? variant.note : ''
        });
      });
      // 写到 storage 让 training 页读取
      wx.setStorageSync('ff.currentTraining', {
        plan: plan,
        dayIndex: dayIdx
      });
      wx.navigateTo({ url: `/pages/training/training?planId=${plan.id}&dayIndex=${dayIdx}` });
      return;
    }

    // 旧结构（exerciseIds 数组）
    const list = (plan.exerciseIds || []).map(id => exercises.getById(id)).filter(Boolean);
    if (!list.length) return;
    // 把旧 plan 拍平成可训练数据
    const items = list.map((ex, idx) => ({
      idx: idx + 1,
      exerciseId: ex.id,
      name: ex.nameZh || ex.name,
      sets: 3,
      reps: '12',
      rpe: 8,
      rest: 60,
      cue: '',
      note: ''
    }));
    // 旧 plan 直接塞 days[0]
    const flatPlan = Object.assign({}, plan, {
      days: [{ name: '训练日', focus: '', items }]
    });
    wx.setStorageSync('ff.currentTraining', {
      plan: flatPlan,
      dayIndex: 0
    });
    wx.navigateTo({ url: `/pages/training/training?planId=${plan.id}&dayIndex=0` });
  },

  onImgError(e) {
    const id = e.currentTarget.dataset.id;
    const idx = this.data.exercises.findIndex(it => it.id === id);
    if (idx > -1) {
      this.setData({ [`exercises[${idx}]._err`]: true });
    }
  },

  onShow() {
    if (favGuide.isShareEntry()) {
      const comp = this.selectComponent('#favGuide');
      favGuide.tryGuide(comp, { text: '喜欢这份计划？添加到「我的小程序」，随时回看。' });
    }
  },

  onReachBottom() {
    const comp = this.selectComponent('#favGuide');
    favGuide.tryGuide(comp, { text: '把这份计划存进「我的小程序」，下次一点就开练。' });
  },

  onShareAppMessage() {
    const plan = this.data.plan;
    if (!plan || !plan.id) {
      return { title: 'FitFlow 训练计划', path: 'pages/plans/plans' };
    }
    return {
      title: `${plan.name} · FitFlow 训练计划`,
      path: `pages/plan-detail/plan-detail?id=${plan.id}`
    };
  },

  onShareTimeline() {
    const plan = this.data.plan;
    if (!plan || !plan.id) {
      return { title: 'FitFlow 训练计划', query: '' };
    }
    return {
      title: `${plan.name} · 科学训练计划`,
      query: `id=${plan.id}`
    };
  },

  onAddToFavorites() {
    const plan = this.data.plan;
    const res = { title: (plan && plan.name ? plan.name + ' · ' : '') + 'FitFlow 训练计划' };
    return res;
  }
});
