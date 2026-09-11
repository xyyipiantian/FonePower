// =====================================================================
// FitFlow · 云能力封装 (CloudBase)
// 职责：统一封装微信云开发的初始化、静默登录、数据读写。
// 说明：
//  1. 云环境 ID 填在 CLOUD_ENV（开通云开发后从「微信开发者工具 → 云开发」复制）。
//  2. 若 CLOUD_ENV 为空，本模块自动降级为本地 Storage（保证不报错、可离线用）。
//  3. 所有云端数据按 openid 隔离，用户之间互不冲突。
// =====================================================================

// 云环境 ID（开通云开发后填入，留空则走纯本地模式）
const CLOUD_ENV = 'cloud1-d7gfpvq2k9a1933c8';

// 本地 Storage 兜底 key
const FAV_KEY = 'ff_favorites';
const PLANS_KEY = 'ff_custom_plans';
const ENV_KEY = 'ff.env';
const PLAN_ORDER_KEY = 'ff_plan_order';

let _cloudReady = false;
let _openid = '';
let __cloudNotifiedNoUsers = false; // 控制台提示只发一次

// 启动期云环境自检（输出到 Console，便于排查"云开发没通"的问题）
(function _bootCheck() {
  const sysInfo = (typeof wx !== 'undefined' && wx.getSystemInfoSync) ? wx.getSystemInfoSync() : {};
  const isDev = sysInfo.platform === 'devtools';
  const msg = CLOUD_ENV
    ? '[FitFlow/Cloud] ✓ env=' + CLOUD_ENV + ' platform=' + sysInfo.platform + ' brand=' + sysInfo.brand
    : '[FitFlow/Cloud] ⚠️ NO CLOUD_ENV (local-only mode)';
  if (CLOUD_ENV && isDev) {
    console.warn(msg + ' (运行于开发者工具模拟器，云端写请扫码验证)');
  } else if (CLOUD_ENV) {
    console.log(msg);
  } else {
    console.warn(msg);
  }
  // 全局埋点，方便在任意页面读
  try {
    if (typeof getApp === 'function') {
      const app = getApp();
      if (app) app.globalData.cloudEnv = CLOUD_ENV;
    }
  } catch (e) {}
})();

function _isCloudEnabled() {
  return !!CLOUD_ENV;
}

function _initCloud() {
  if (_cloudReady) return true;
  if (!_isCloudEnabled()) return false;
  if (!wx.cloud) return false;
  try {
    wx.cloud.init({ env: CLOUD_ENV, traceUser: true });
    _cloudReady = true;
    return true;
  } catch (e) {
    console.warn('[cloud] init fail:', e);
    return false;
  }
}

// 静默登录：拿 openid（无需用户点击，无授权弹窗）
// 返回 Promise<string>，失败返回空串
function ensureLogin() {
  return new Promise((resolve) => {
    if (_openid) return resolve(_openid);
    if (!_initCloud()) return resolve('');
    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        const r = res && res.result;
        if (r && r.openid) {
          _openid = r.openid;
          resolve(r.openid);
        } else {
          resolve('');
        }
      },
      fail: (err) => {
        console.warn('[cloud] login fail:', err);
        resolve('');
      }
    });
  });
}

// 判断当前是否已具备云端能力（含 openid）
function isCloudReady() {
  return _isCloudEnabled() && !!_openid;
}

// ---------------------------------------------------------------------
// 收藏
// ---------------------------------------------------------------------
function getFavsLocal() {
  try { return wx.getStorageSync(FAV_KEY) || []; } catch (e) { return []; }
}
function setFavsLocal(arr) {
  try { wx.setStorageSync(FAV_KEY, arr); } catch (e) {}
}

function getFavs() {
  return getFavsLocal();
}

// 安全写入云端：先 update，失败 add 兜底；任何失败都明确告知
function _writeCloud(field, arr) {
  if (!isCloudReady()) {
    console.warn('[cloud] skip write: not cloudReady (openid=' + _openid + ')');
    return;
  }
  const db = wx.cloud.database();
  const docId = _openid;
  const data = { updatedAt: Date.now() };
  data[field] = arr;
  console.log('[cloud] write start: field=' + field + ' openid=' + docId + ' count=' + arr.length);
  db.collection('users').doc(docId).update({
    data
  }).then((res) => {
    const updated = (res && res.stats && res.stats.updated) || 0;
    console.log('[cloud] update result: field=' + field + ' updated=' + updated);
    if (updated === 0) {
      // 关键修复：update 成功但 0 条更新 = 文档不存在。强制走 add 建档。
      console.log('[cloud] doc not found, switching to add...');
      return db.collection('users').add({
        data: Object.assign({ _id: docId }, data)  // 注意：不要写 _openid，那是系统字段
      }).then((addRes) => {
        console.log('[cloud] ✓ add ok (after empty update): field=' + field + ' new_id=' + (addRes && addRes._id));
      });
    } else {
      console.log('[cloud] ✓ update ok: field=' + field + ' updated=' + updated);
    }
  }).catch((err) => {
    console.warn('[cloud] update fail:', (err && (err.errMsg || err.message)) || err);
    db.collection('users').add({
      data: Object.assign({ _id: docId }, data)  // 注意：不要写 _openid
    }).then((res) => {
      console.log('[cloud] ✓ add ok (after update err): field=' + field + ' new_id=' + (res && res._id));
    }).catch((e2) => {
      const msg = (e2 && (e2.errMsg || e2.message)) || '';
      console.error('[cloud] ADD FAIL (' + field + '):', msg);
      const sysInfo = (typeof wx !== 'undefined' && wx.getSystemInfoSync) ? wx.getSystemInfoSync() : {};
      const isDev = sysInfo.platform === 'devtools';
      const tip = isDev
        ? '当前在开发者工具模拟器中运行，云端写入可能受限。\n\n请用工具栏「预览」扫码在真机上验证。'
        : '请检查：\n1. 云开发控制台是否创建了 users 集合\n2. 集合权限是否为「仅创建者可读写」\n3. 当前环境 ID 是否与开发者工具一致';
      _showCloudError('云端写入失败', msg + '\n\n' + tip);
    });
  });
}

// 一次性弹窗提示云端异常（用户绝对看得到）
function _showCloudError(title, content) {
  try {
    wx.showModal({
      title: title,
      content: content,
      confirmText: '我知道了',
      showCancel: false
    });
  } catch (e) {}
}
function setFavs(arr) {
  setFavsLocal(arr);
  _writeCloud('favorites', arr);
}

// 拉取云端收藏并合并（登录后调用一次，以云端为准覆盖本地）
function pullFavs() {
  if (!isCloudReady()) return Promise.resolve(getFavsLocal());
  return new Promise((resolve) => {
    wx.cloud.database().collection('users').doc(_openid).get({
      success: (res) => {
        const favs = (res.data && res.data.favorites) || [];
        setFavsLocal(favs);
        resolve(favs);
      },
      fail: (err) => {
        // 集合不存在 / 记录不存在都不算错，本地优先
        const msg = (err && (err.errMsg || err.message)) || '';
        console.warn('[cloud] pullFavs fail:', msg);
        resolve(getFavsLocal());
      }
    });
  });
}

// ---------------------------------------------------------------------
// 自定义训练计划
// ---------------------------------------------------------------------
function getPlansLocal() {
  try { return wx.getStorageSync(PLANS_KEY) || []; } catch (e) { return []; }
}
function setPlansLocal(arr) {
  try { wx.setStorageSync(PLANS_KEY, arr); } catch (e) {}
}

function getPlans() {
  return getPlansLocal();
}

function setPlans(arr) {
  setPlansLocal(arr);
  _writeCloud('plans', arr);
}

function pullPlans() {
  if (!isCloudReady()) return Promise.resolve(getPlansLocal());
  return new Promise((resolve) => {
    wx.cloud.database().collection('users').doc(_openid).get({
      success: (res) => {
        const plans = (res.data && res.data.plans) || [];
        setPlansLocal(plans);
        resolve(plans);
      },
      fail: (err) => {
        const msg = (err && (err.errMsg || err.message)) || '';
        console.warn('[cloud] pullPlans fail:', msg);
        resolve(getPlansLocal());
      }
    });
  });
}

// ---------------------------------------------------------------------
// 器械条件（环境切换）
// ---------------------------------------------------------------------
function getEnv() {
  try {
    const v = wx.getStorageSync(ENV_KEY);
    return ['gym', 'home', 'bodyweight'].indexOf(v) > -1 ? v : 'gym';
  } catch (e) { return 'gym'; }
}
function setEnv(v) {
  try { wx.setStorageSync(ENV_KEY, v); } catch (e) {}
}

// 暴露给 trainingLog 用：写入任意字段（云端）
function _writeCloudDirect(field, arr) {
  _writeCloud(field, arr);
}

// ---------------------------------------------------------------------
// 计划排序（用户自定义 builtin + custom 的展示顺序）
// ---------------------------------------------------------------------
function getPlanOrderLocal() {
  try { return wx.getStorageSync(PLAN_ORDER_KEY) || []; } catch (e) { return []; }
}
function setPlanOrderLocal(arr) {
  try { wx.setStorageSync(PLAN_ORDER_KEY, arr); } catch (e) {}
}
function getPlanOrder() {
  return getPlanOrderLocal();
}
function setPlanOrder(arr) {
  setPlanOrderLocal(arr);
  _writeCloud('planOrder', arr);
}
function pullPlanOrder() {
  if (!isCloudReady()) return Promise.resolve(getPlanOrderLocal());
  return new Promise((resolve) => {
    wx.cloud.database().collection('users').doc(_openid).get({
      success: (res) => {
        const order = (res.data && res.data.planOrder) || [];
        setPlanOrderLocal(order);
        resolve(order);
      },
      fail: () => resolve(getPlanOrderLocal())
    });
  });
}

// ---------------------------------------------------------------------
// 内置计划个性化（用户对本机内置计划做的修改：不污染公共数据）
// 结构：{ planId: { dayIndex: { itemIndex: { id, name, note, cue } } } }
// ---------------------------------------------------------------------
const OVERRIDE_KEY = 'ff_plan_overrides';
function getOverridesLocal() {
  try { return wx.getStorageSync(OVERRIDE_KEY) || {}; } catch (e) { return {}; }
}
function setOverridesLocal(obj) {
  try { wx.setStorageSync(OVERRIDE_KEY, obj); } catch (e) {}
}
function getOverrides() {
  return getOverridesLocal();
}
function getPlanOverride(planId) {
  const all = getOverridesLocal();
  return all[planId] || {};
}
function setItemOverride(planId, dayIndex, itemIndex, override) {
  const all = getOverridesLocal();
  if (!all[planId]) all[planId] = {};
  if (!all[planId][dayIndex]) all[planId][dayIndex] = {};
  all[planId][dayIndex][itemIndex] = override;
  setOverridesLocal(all);
  _writeCloud('planOverrides', all);
}
function clearItemOverride(planId, dayIndex, itemIndex) {
  const all = getOverridesLocal();
  if (all[planId] && all[planId][dayIndex]) {
    delete all[planId][dayIndex][itemIndex];
    if (!Object.keys(all[planId][dayIndex]).length) delete all[planId][dayIndex];
    if (!Object.keys(all[planId]).length) delete all[planId];
  }
  setOverridesLocal(all);
  _writeCloud('planOverrides', all);
}
function clearPlanOverride(planId) {
  const all = getOverridesLocal();
  delete all[planId];
  setOverridesLocal(all);
  _writeCloud('planOverrides', all);
}
function pullOverrides() {
  if (!isCloudReady()) return Promise.resolve(getOverridesLocal());
  return new Promise((resolve) => {
    wx.cloud.database().collection('users').doc(_openid).get({
      success: (res) => {
        const o = (res.data && res.data.planOverrides) || {};
        setOverridesLocal(o);
        resolve(o);
      },
      fail: () => resolve(getOverridesLocal())
    });
  });
}

// 应用 overlay 到计划上（只对有 days 的结构化计划有效）
function applyOverrides(plan) {
  const overrides = getPlanOverride(plan.id);
  if (!plan.days || !Object.keys(overrides).length) return plan;
  const days = plan.days.map((day, di) => {
    const dayOv = overrides[di];
    if (!dayOv) return day;
    const items = day.items.map((it, ii) => {
      const itOv = dayOv[ii];
      if (!itOv) return it;
      // 替换：找到当前 env 对应 variant 替换
      const variants = Object.assign({}, it.variants);
      const curEnv = getEnv();
      const variant = variants[curEnv] || variants.gym || Object.values(variants)[0];
      if (variant) {
        variants[curEnv] = Object.assign({}, variant, {
          id: itOv.id, name: itOv.name,
          note: itOv.note || variant.note,
          cue: itOv.cue || variant.cue
        });
      }
      return Object.assign({}, it, { variants });
    });
    return Object.assign({}, day, { items });
  });
  return Object.assign({}, plan, { days });
}

// 订阅消息封装
const TEMPLATE_IDS = {
  TRAIN_DONE: 'TEMPLATE_ID_TRAIN_DONE'
};
function requestSubscribeTemplate(tmplId) {
  return new Promise((resolve) => {
    if (!wx.requestSubscribeMessage) return resolve(false);
    wx.requestSubscribeMessage({
      tmplIds: [tmplId],
      success: (res) => resolve(res[tmplId] === 'accept'),
      fail:    (err) => { console.warn('[cloud] subscribe fail:', err); resolve(false); }
    });
  });
}
function sendSubscribeMessage(tmplId, data) {
  if (!isCloudReady()) return Promise.resolve({ ok: false, reason: 'cloud-not-ready' });
  return new Promise((resolve) => {
    wx.cloud.callFunction({
      name: 'sendSubscribeMessage',
      data: { tmplId, data },
      success: (res) => resolve(res && res.result ? res.result : { ok: false }),
      fail:    (err) => { console.warn('[cloud] sendSub fail:', err); resolve({ ok: false }); }
    });
  });
}
function getSubscribedFlag() {
  try { return !!wx.getStorageSync('ff.subscribed.trainDone'); } catch (e) { return false; }
}
function setSubscribedFlag(v) {
  try { wx.setStorageSync('ff.subscribed.trainDone', !!v); } catch (e) {}
}

module.exports = {
  CLOUD_ENV,
  ensureLogin,
  isCloudReady,
  getFavs, setFavs, pullFavs,
  getPlans, setPlans, pullPlans,
  getEnv, setEnv,
  getPlanOrder, setPlanOrder, pullPlanOrder,
  getOverrides, getPlanOverride, setItemOverride, clearItemOverride, clearPlanOverride, pullOverrides,
  applyOverrides,
  TEMPLATE_IDS,
  requestSubscribeTemplate,
  sendSubscribeMessage,
  getSubscribedFlag,
  setSubscribedFlag,
  _writeCloudDirect
};
