// =====================================================================
// FitFlow · 训练页面
// 流程：开始训练 → 逐动作/逐组完成 → 全部完成 → 写入训练日志
// =====================================================================
const exercises = require('../../utils/exercises.js');
const trainingLog = require('../../utils/trainingLog.js');
const cloud = require('../../utils/cloud.js');

const PROGRESS_KEY = 'ff.training.in_progress';

Page({
  data: {
    plan: null,
    dayIndex: 0,
    dayName: '',
    items: [],         // 当前 day 的全部动作（带 hasEx）
    itemIndex: 0,      // 当前动作索引（0-based）
    setIndex: 0,       // 当前组索引（0-based）
    setsTotal: 0,      // 当前动作的总组数
    setProgress: [],   // 当前动作每组的完成状态 [{done:false,weight:''}, ...]
    showRest: false,   // 是否显示休息倒计时
    restSeconds: 0,    // 剩余休息秒
    restTotal: 0,      // 总休息秒
    startedAt: 0,
    done: false,       // 整个训练是否完成
    summary: null,     // 完成总结
    currentItem: null, // 当前动作（data 字段，WXML 直接访问）
    // ===== v1 沉浸模式 =====
    immersive: true,   // 默认进入沉浸态
    restPulse: false,  // 倒计时最后 3 秒脉冲红（动画触发）
    subscribed: false  // 是否已订阅训练完成通知
  },

  onLoad(query) {
    // 屏幕常亮（防息屏中断训练）
    if (wx.setKeepScreenOn) {
      wx.setKeepScreenOn({ keepScreenOn: true });
    }
    // 检测订阅状态（从本地 storage 读）
    this.setData({ subscribed: cloud.getSubscribedFlag() });
    // query: ?planId=&dayIndex=
    try {
      const raw = wx.getStorageSync('ff.currentTraining');
      if (!raw) {
        wx.showToast({ title: '未找到训练数据', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 800);
        return;
      }
      const plan = raw.plan;
      const dayIdx = raw.dayIndex || 0;
      const day = (plan.days && plan.days[dayIdx]) || null;
      const items = (day ? day.items : []).map(it => ({
        ...it,
        hasEx: !!exercises.getById(it.exerciseId),
        image: exercises.getById(it.exerciseId) ? exercises.getById(it.exerciseId).image : ''
      }));
      const firstItem = items[0];
      this.setData({
        plan,
        dayIndex: dayIdx,
        dayName: day ? day.name : '',
        items,
        itemIndex: 0,
        setIndex: 0,
        setsTotal: firstItem ? firstItem.sets : 0,
        setProgress: this._buildSetProgress(firstItem ? firstItem.sets : 0),
        startedAt: Date.now(),
        done: false,
        showRest: false,
        currentItem: firstItem || null
      });
      wx.setNavigationBarTitle({ title: (plan.name || '训练中') });
    } catch (e) {
      console.error('[training] init fail:', e);
    }
  },

  _buildSetProgress(n) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push({ done: false, weight: '' });
    return arr;
  },

  onUnload() {
    if (this._restTimer) clearInterval(this._restTimer);
    // 关闭屏幕常亮
    if (wx.setKeepScreenOn) {
      wx.setKeepScreenOn({ keepScreenOn: false });
    }
    // 退出时把当前进度落盘
    this._saveProgress();
  },

  // 拦截系统返回（安卓物理返回 / 顶部胶囊左滑）
  onBackPress() {
    if (this.data.done) return false; // 完成页允许返回
    this.cancelTraining();
    return true; // 阻止默认返回
  },

  // 切换沉浸态
  toggleImmersive() {
    const next = !this.data.immersive;
    this.setData({ immersive: next });
    wx.vibrateShort && wx.vibrateShort({ type: 'light' });
  },

  onShow() {
    // 回到训练页时检测是否有进度，有则恢复
    if (this.data.done) return;
    const saved = wx.getStorageSync('ff.training.progress');
    if (!saved || !saved.plan) return;
    // 只在「不是当前会话」的情况下恢复
    if (saved.startedAt && saved.startedAt === this.data.startedAt) return;
    // 询问用户：继续 / 重新开始
    if (saved.setIndex > 0 || saved.itemIndex > 0) {
      wx.showModal({
        title: '继续上次的训练？',
        content: `上次：${saved.dayName || ''} 第 ${(saved.itemIndex || 0) + 1} 个动作 · 第 ${(saved.setIndex || 0) + 1} 组`,
        confirmText: '继续',
        cancelText: '重新开始',
        success: (res) => {
          if (res.confirm) {
            this._restoreProgress(saved);
          } else {
            this._clearProgress();
          }
        }
      });
    }
  },

  _saveProgress() {
    if (this.data.done) return;
    try {
      wx.setStorageSync('ff.training.progress', {
        plan: this.data.plan,
        dayIndex: this.data.dayIndex,
        dayName: this.data.dayName,
        items: this.data.items,
        itemIndex: this.data.itemIndex,
        setIndex: this.data.setIndex,
        setsTotal: this.data.setsTotal,
        setProgress: this.data.setProgress,
        startedAt: this.data.startedAt,
        updatedAt: Date.now()
      });
    } catch (e) {}
  },

  _clearProgress() {
    try { wx.removeStorageSync('ff.training.progress'); } catch (e) {}
  },

  _restoreProgress(saved) {
    const item = (saved.items && saved.items[saved.itemIndex]) || null;
    this.setData({
      plan: saved.plan,
      dayIndex: saved.dayIndex,
      dayName: saved.dayName,
      items: saved.items,
      itemIndex: saved.itemIndex,
      setIndex: saved.setIndex,
      setsTotal: saved.setsTotal || (item ? item.sets : 0),
      setProgress: saved.setProgress || this._buildSetProgress(item ? item.sets : 0),
      startedAt: saved.startedAt || Date.now(),
      done: false,
      showRest: false,
      currentItem: item
    });
    wx.setNavigationBarTitle({ title: (saved.plan && saved.plan.name) || '训练中' });
  },

  _syncCurrent() {
    const { items, itemIndex } = this.data;
    this.setData({ currentItem: items[itemIndex] || null });
  },

  // 标记当前组完成
  completeSet() {
    const { itemIndex, setIndex, setProgress, items } = this.data;
    const next = setProgress.slice();
    next[setIndex] = Object.assign({}, next[setIndex], { done: true });

    // 完成一组：触觉确认
    wx.vibrateShort && wx.vibrateShort({ type: 'medium' });

    if (setIndex + 1 < setProgress.length) {
      this.setData({ setProgress: next });
      this._startRest(items[itemIndex].rest || 60, () => {
        this.setData({ setIndex: setIndex + 1 });
        this._saveProgress();
      });
    } else if (itemIndex + 1 < items.length) {
      this.setData({ setProgress: next });
      this._nextItem();
    } else {
      this.setData({ setProgress: next });
      this._finishTraining();
    }
  },

  _nextItem() {
    const { itemIndex, items } = this.data;
    const nextIdx = itemIndex + 1;
    const nextItem = items[nextIdx];
    if (!nextItem) return this._finishTraining();
    this.setData({
      itemIndex: nextIdx,
      setIndex: 0,
      setsTotal: nextItem.sets,
      setProgress: this._buildSetProgress(nextItem.sets)
    });
    this._syncCurrent();
    this._saveProgress();
    // 切动作：重振动提示
    wx.vibrateShort && wx.vibrateShort({ type: 'heavy' });
    this._startRest(30, () => {
      wx.showToast({ title: '下一个动作：' + (nextItem.name || ''), icon: 'none' });
    });
  },

  _startRest(seconds, cb) {
    if (this._restTimer) clearInterval(this._restTimer);
    this._restCb = cb || null;
    this.setData({
      showRest: true,
      restSeconds: seconds,
      restTotal: seconds,
      restPulse: false
    });
    this._restTimer = setInterval(() => {
      const left = this.data.restSeconds - 1;
      // 最后 3 秒：脉冲 + 振动
      if (left === 3 || left === 2) {
        this.setData({ restPulse: true, restSeconds: left });
        wx.vibrateShort && wx.vibrateShort({ type: 'light' });
      } else if (left === 1) {
        this.setData({ restPulse: true, restSeconds: left });
        wx.vibrateShort && wx.vibrateShort({ type: 'medium' });
      } else if (left <= 0) {
        this._stopRest(true);
      } else {
        this.setData({ restSeconds: left });
      }
    }, 1000);
  },

  // 停止休息：auto=true 时自然倒计时结束（执行 cb），false 时用户跳过（也执行 cb）
  _stopRest(runCb) {
    if (this._restTimer) {
      clearInterval(this._restTimer);
      this._restTimer = null;
    }
    this.setData({ showRest: false, restSeconds: 0 });
    const cb = this._restCb;
    this._restCb = null;
    if (runCb && typeof cb === 'function') cb();
  },

  skipRest() {
    // 用户主动跳过：也执行回调（跟自然结束等价）
    this._stopRest(true);
  },

  // 完成整个训练
  _finishTraining() {
    if (this._restTimer) clearInterval(this._restTimer);
    const { items, startedAt, plan, dayIndex, dayName } = this.data;
    const totalSets = items.reduce((s, it) => s + (it.sets || 0), 0);
    const endAt = Date.now();
    const summary = {
      id: 'log_' + endAt,
      planId: plan.id,
      planName: plan.name,
      dayIndex,
      dayName,
      startedAt,
      endAt,
      duration: Math.floor((endAt - startedAt) / 1000),
      totalSets,
      itemsCount: items.length
    };
    trainingLog.appendLog(summary);
    // 通知后端：本场训练结束（用于后续统计、推送等）
    this._maybeSendDoneNotification(summary);
    // 清理临时训练数据
    this._clearProgress();
    try { wx.removeStorageSync('ff.currentTraining'); } catch (e) {}
    this.setData({ done: true, summary });
    // 训练完成：长振动庆祝
    if (wx.vibrateLong) {
      wx.vibrateLong();
    } else {
      wx.vibrateShort && wx.vibrateShort({ type: 'heavy' });
    }
  },

  // 用户主动取消训练
  cancelTraining() {
    wx.showModal({
      title: '放弃训练？',
      content: '当前训练进度不会被记录',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          try { wx.removeStorageSync('ff.currentTraining'); } catch (e) {}
          wx.navigateBack();
        }
      }
    });
  },

  goDetail() {
    const it = this.data.currentItem;
    if (!it) return;
    wx.navigateTo({ url: `/pages/detail/detail?id=${it.exerciseId}` });
  },

  finishAndExit() {
    wx.navigateBack({ delta: 2 });
  },

  // 用户点订阅按钮
  onSubscribeTap() {
    const tmplId = cloud.TEMPLATE_IDS.TRAIN_DONE;
    if (tmplId === 'TEMPLATE_ID_TRAIN_DONE') {
      wx.showModal({
        title: '订阅功能未启用',
        content: '需要先在「微信公众平台 → 订阅消息」申请模板，把 template_id 填入 utils/cloud.js 的 TEMPLATE_IDS.TRAIN_DONE。',
        confirmText: '我知道了',
        showCancel: false
      });
      return;
    }
    cloud.requestSubscribeTemplate(tmplId).then((accepted) => {
      if (accepted) {
        cloud.setSubscribedFlag(true);
        this.setData({ subscribed: true });
        wx.vibrateShort && wx.vibrateShort({ type: 'medium' });
        wx.showToast({ title: '已开启，下次练完会通知', icon: 'success' });
      } else {
        wx.showToast({ title: '未授权，下次可再点', icon: 'none' });
      }
    });
  },

  // 训练完成时如果订阅过，尝试发一条通知（一次性 token 立即消费）
  _maybeSendDoneNotification(summary) {
    if (!cloud.getSubscribedFlag()) return;
    const tmplId = cloud.TEMPLATE_IDS.TRAIN_DONE;
    if (tmplId === 'TEMPLATE_ID_TRAIN_DONE') return;
    const dur = summary.duration ? Math.floor(summary.duration / 60) + ' 分钟' : '刚刚';
    // 通用模板字段：thing1 = 计划名 / thing2 = 时长 / thing3 = 动作数
    // 不同模板字段名不一样，真实场景需要按申请到的模板对应字段调整
    cloud.sendSubscribeMessage(tmplId, {
      thing1: { value: (summary.planName || '训练').slice(0, 20) },
      thing2: { value: dur.slice(0, 20) },
      thing3: { value: (summary.totalSets || 0) + ' 组' }
    }).then((res) => {
      if (res && res.ok) {
        // 用过即失效，清掉本地标记，下次练完再让用户重新订阅
        cloud.setSubscribedFlag(false);
        this.setData({ subscribed: false });
      }
    });
  },

  // 重量变化（虽然不强制记录，先存到 setProgress 里）
  onWeightInput(e) {
    const idx = parseInt(e.currentTarget.dataset.idx, 10);
    const val = e.detail.value;
    const next = this.data.setProgress.slice();
    next[idx] = Object.assign({}, next[idx], { weight: val });
    this.setData({ setProgress: next });
  }
});