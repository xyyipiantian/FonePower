const trainingLog = require('../../utils/trainingLog.js');
const plans = require('../../utils/plans.js');
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    logs: [],
    total: 0,
    thisWeek: 0
  },

  onShow() {
    const logs = trainingLog.getLogs().slice().reverse();
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = logs.filter(l => l.endAt >= sevenDaysAgo).length;

    // 给每条日志加 plan 引用 + 是否能再来一次
    const allPlans = plans.PLANS.concat(cloud.getPlans());
    const planMap = {};
    allPlans.forEach(p => { planMap[p.id] = p; });

    this.setData({
      logs: logs.map(l => Object.assign({}, l, {
        date: this._fmtDate(l.endAt),
        time: this._fmtTime(l.endAt),
        durationMin: Math.max(1, Math.floor((l.duration || 0) / 60)),
        canReplay: !!planMap[l.planId],
        plan: planMap[l.planId] || null
      })),
      total: logs.length,
      thisWeek
    });
  },

  _fmtDate(ts) {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  },

  _fmtTime(ts) {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  },

  // 再次训练
  replay(e) {
    const id = e.currentTarget.dataset.id;
    const log = this.data.logs.find(l => l.id === id);
    if (!log) return;
    const plan = log.plan;
    if (!plan) {
      wx.showToast({ title: '原计划已不存在', icon: 'none' });
      return;
    }
    let dayIdx = log.dayIndex || 0;
    let day = (plan.days && plan.days[dayIdx]) || null;
    if (!day && plan.exerciseIds) {
      day = {
        name: '训练日',
        focus: '',
        items: plan.exerciseIds.map(eid => ({
          sets: 3, reps: '12', rpe: 8, rest: 60,
          variants: { gym: { id: eid, name: '', note: '', cue: '' } }
        }))
      };
      plan.days = [day];
    }
    if (!day) {
      wx.showToast({ title: '此计划无法再次训练', icon: 'none' });
      return;
    }
    const items = day.items.map(it => {
      const variant = it.variants.gym || Object.values(it.variants)[0];
      return Object.assign({}, it, {
        exerciseId: variant ? variant.id : '',
        name: variant ? variant.name : ''
      });
    });
    plan.days[dayIdx].items = items;
    wx.setStorageSync('ff.currentTraining', { plan, dayIndex: dayIdx });
    wx.navigateTo({ url: `/pages/training/training?planId=${plan.id}&dayIndex=${dayIdx}` });
  },

  // 删除某条日志
  deleteLog(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除这条训练？',
      content: '不会影响其他记录',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          const all = trainingLog.getLogs().filter(l => l.id !== id);
          try { wx.setStorageSync('ff_training_logs', all); } catch (e) {}
          this.onShow();
        }
      }
    });
  }
});