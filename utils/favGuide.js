/**
 * favGuide.js — 收藏（添加到「我的小程序」）引导逻辑模块
 *
 * 职责：场景判定、频率控制、防骚扰。UI 由 components/fav-guide 负责。
 * 微信限制：添加到「我的小程序」无 API 可主动触发，也无法直接查询是否已添加，
 * 只能通过场景推断（scene 1107 表示从我的小程序打开）+ 本地频率控制来引导。
 *
 * 频率控制规则：
 *  - 已添加（scene 1107）：永久关闭
 *  - 本次会话最多提示 1 次（内存标记）
 *  - 终身最多 3 次
 *  - 距上次提示 < 7 天不提示（冷却）
 *  - 累计拒绝 >= 2 次：永久关闭
 */

const KEY = 'ff_fav_guide';

// 模块级会话标记：每次小程序启动（模块重载）重置，仅内存不落盘
let sessionShown = false;

function read() {
  try { return wx.getStorageSync(KEY) || {}; } catch (e) { return {}; }
}
function save(d) {
  try { wx.setStorageSync(KEY, d); } catch (e) {}
}

// 获取进入场景值（scene）
function getScene() {
  try {
    if (wx.getEnterOptionsSync) {
      const o = wx.getEnterOptionsSync();
      if (o && o.scene) return o.scene;
    }
  } catch (e) {}
  try {
    if (wx.getLaunchOptionsSync) {
      const o = wx.getLaunchOptionsSync();
      if (o && o.scene) return o.scene;
    }
  } catch (e) {}
  return 0;
}

// 是否从「我的小程序」打开（scene 1107）——已添加，应永久关闭引导
function isFromMyMiniProgram() {
  if (getScene() === 1107) {
    const d = read();
    if (!d.added) { d.added = true; save(d); }
    return true;
  }
  return false;
}

// 是否通过分享卡片进入（scene 1007 单聊 / 1008 群聊）
function isShareEntry() {
  const s = getScene();
  return s === 1007 || s === 1008;
}

// 是否应该展示引导（核心频率控制）
function shouldShowGuide() {
  const d = read();
  if (d.added) return false;                 // 已添加：永久关
  if (isFromMyMiniProgram()) return false;   // 本次即从我的小程序打开
  const now = Date.now();
  if (d.lastShown && (now - d.lastShown) < 7 * 86400000) return false; // 7 天冷却
  if (d.count >= 3) return false;            // 终身最多 3 次
  if (d.dismissed >= 2) return false;        // 累计拒绝 2 次：永久关
  if (sessionShown) return false;            // 本次会话已提示
  return true;
}

function markShown() {
  const d = read();
  d.count = (d.count || 0) + 1;
  d.lastShown = Date.now();
  save(d);
  sessionShown = true;
}

function markDismissed() {
  const d = read();
  d.dismissed = (d.dismissed || 0) + 1;
  save(d);
  sessionShown = true;
}

// 触发引导：通过组件展示并落库计数
// component: 页面内 selectComponent('#favGuide')
// opts: { mode: 'bar' | 'modal', title, text }
function tryGuide(component, opts) {
  if (!component || typeof component.show !== 'function') return false;
  if (!shouldShowGuide()) return false;
  markShown();
  component.show(opts || {});
  return true;
}

// 浏览动作计数（用于 P2 高活跃兜底触发）
const BROWSE_KEY = 'ff_browsed';
function getBrowsedCount() {
  try { return wx.getStorageSync(BROWSE_KEY) || 0; } catch (e) { return 0; }
}
function incBrowsedCount() {
  const n = getBrowsedCount() + 1;
  try { wx.setStorageSync(BROWSE_KEY, n); } catch (e) {}
  return n;
}

module.exports = {
  KEY,
  getScene,
  isFromMyMiniProgram,
  isShareEntry,
  shouldShowGuide,
  markShown,
  markDismissed,
  tryGuide,
  getBrowsedCount,
  incBrowsedCount
};
