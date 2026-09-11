const exercises = require('../../utils/exercises.js');
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    editingId: '',
    name: '',
    desc: '',
    searchKey: '',
    searchResults: [],
    picked: [],
    searching: false,
    bodyParts: [],     // 部位选项（横向滑动条）
    activeBodyPart: '', // 当前选中的部位 value
    bodyPartOpen: false // 部位条是否展开
  },

  onLoad(query) {
    // 加载部位选项（横向滑动）
    const parts = exercises.getOptions('bodyPart') || [];
    this.setData({
      bodyParts: parts.map(p => ({ value: p.value, label: p.label, count: p.count })),
      activeBodyPart: ''
    });
    if (query.id) {
      const plan = cloud.getPlans().find(p => p.id === query.id);
      if (plan) {
        const picked = (plan.exercises || []).map(it => {
          const ex = exercises.getById(it.id);
          return {
            id: it.id,
            name: ex ? (ex.nameZh || ex.name) : it.id,
            image: ex ? ex.image : '',
            sets: it.sets || 3,
            reps: it.reps || '12',
            rpe: it.rpe || 8,
            rest: it.rest || 60,
            note: it.note || '',
            cue: it.cue || ''
          };
        });
        this.setData({
          editingId: plan.id,
          name: plan.name || '',
          desc: plan.desc || '',
          picked
        });
        wx.setNavigationBarTitle({ title: '编辑 · ' + (plan.name || '') });
        return;
      }
    }
    wx.setNavigationBarTitle({ title: '创建训练计划' });
  },

  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onDescInput(e) { this.setData({ desc: e.detail.value }); },

  toggleBodyPartBar() {
    this.setData({ bodyPartOpen: !this.data.bodyPartOpen });
  },

  pickBodyPart(e) {
    const v = e.currentTarget.dataset.value;
    const next = (this.data.activeBodyPart === v) ? '' : v;
    this.setData({ activeBodyPart: next });
    // 重过滤当前搜索结果
    this._refilter();
  },

  onSearchInput(e) {
    const v = e.detail.value;
    this.setData({ searchKey: v, searching: !!v.trim(), bodyPartOpen: true });
    this._refilter();
  },

  _refilter() {
    const kw = (this.data.searchKey || '').trim().toLowerCase();
    const bp = this.data.activeBodyPart;
    let res = exercises.EXERCISES;
    if (bp) res = res.filter(ex => ex.bodyPart === bp);
    if (kw) {
      res = res.filter(ex =>
        (ex.name && ex.name.toLowerCase().indexOf(kw) > -1) ||
        (ex.nameZh && ex.nameZh.toLowerCase().indexOf(kw) > -1)
      );
    }
    // 部位模式下显示多些（50），搜索模式下30
    this.setData({ searchResults: res.slice(0, bp ? 50 : 30) });
  },

  pickExercise(e) {
    const id = e.currentTarget.dataset.id;
    const ex = exercises.getById(id);
    if (!ex) return;
    if (this.data.picked.find(p => p.id === id)) {
      wx.showToast({ title: '已在计划中', icon: 'none' });
      return;
    }
    const item = {
      id: ex.id,
      name: ex.nameZh || ex.name,
      image: ex.image || '',
      sets: 3,
      reps: '12',
      rpe: 8,
      rest: 60,
      note: '',
      cue: ''
    };
    this.setData({ picked: this.data.picked.concat(item) });
    // 选中后保持搜索状态，方便连续挑选
  },

  removePicked(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ picked: this.data.picked.filter(p => p.id !== id) });
  },

  moveUp(e) {
    const id = e.currentTarget.dataset.id;
    const arr = this.data.picked.slice();
    const idx = arr.findIndex(p => p.id === id);
    if (idx <= 0) return;
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    this.setData({ picked: arr });
  },

  moveDown(e) {
    const id = e.currentTarget.dataset.id;
    const arr = this.data.picked.slice();
    const idx = arr.findIndex(p => p.id === id);
    if (idx < 0 || idx >= arr.length - 1) return;
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    this.setData({ picked: arr });
  },

  editField(e) {
    const id = e.currentTarget.dataset.id;
    const field = e.currentTarget.dataset.field;
    const val = e.detail.value;
    this.setData({
      picked: this.data.picked.map(p => p.id === id ? Object.assign({}, p, { [field]: val }) : p)
    });
  },

  savePlan() {
    const name = (this.data.name || '').trim();
    if (!name) {
      wx.showToast({ title: '请给计划起个名字', icon: 'none' });
      return;
    }
    if (!this.data.picked.length) {
      wx.showToast({ title: '至少挑 1 个动作', icon: 'none' });
      return;
    }
    const now = Date.now();
    const exercisesArr = this.data.picked.map(p => ({
      id: p.id,
      sets: parseInt(p.sets, 10) || 3,
      reps: (p.reps || '12') + '',
      rpe: parseInt(p.rpe, 10) || 8,
      rest: parseInt(p.rest, 10) || 60,
      note: (p.note || '').trim(),
      cue: (p.cue || '').trim()
    }));
    const plans = cloud.getPlans();
    if (this.data.editingId) {
      const next = plans.map(p => p.id === this.data.editingId
        ? Object.assign({}, p, {
            name, desc: (this.data.desc || '').trim(),
            exercises: exercisesArr, updatedAt: now
          })
        : p
      );
      cloud.setPlans(next);
      wx.showToast({ title: '已更新', icon: 'success' });
    } else {
      const plan = {
        id: 'custom_' + now,
        name, desc: (this.data.desc || '').trim(),
        createdAt: now, updatedAt: now,
        exercises: exercisesArr
      };
      cloud.setPlans(plans.concat(plan));
      wx.showToast({ title: '已保存', icon: 'success' });
    }
    setTimeout(() => wx.navigateBack(), 600);
  }
});
