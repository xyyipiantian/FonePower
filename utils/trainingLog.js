// =====================================================================
// FitFlow · 训练日志 (Training Log)
// 职责：记录每次训练的完整过程，支持云端同步 + 按计划回溯。
// =====================================================================

// 本地 Storage 兜底 key
const LOG_KEY = 'ff_training_logs';
const MAX_LOCAL_LOGS = 200; // 本地最多保留 200 条，超出滚动覆盖

function getLogsLocal() {
  try { return wx.getStorageSync(LOG_KEY) || []; } catch (e) { return []; }
}

function setLogsLocal(arr) {
  try {
    const trimmed = arr.slice(-MAX_LOCAL_LOGS);
    wx.setStorageSync(LOG_KEY, trimmed);
  } catch (e) {}
}

function getLogs() {
  return getLogsLocal();
}

// 新增一条日志，同时写本地 + 云端
function appendLog(entry) {
  const logs = getLogs();
  logs.push(entry);
  setLogsLocal(logs);
  // 云端同步（lazy require 避免循环依赖）
  try {
    const cloud = require('./cloud.js');
    if (cloud.isCloudReady && cloud.isCloudReady()) {
      cloud._writeCloudDirect('trainingLogs', logs);
    }
  } catch (e) {
    console.warn('[trainingLog] cloud sync fail:', e);
  }
}

// 查询某计划的最近一次训练
function getLastLogForPlan(planId) {
  const logs = getLogs();
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].planId === planId) return logs[i];
  }
  return null;
}

// 计算某计划距上次训练多少天
function getDaysSinceLast(planId) {
  const last = getLastLogForPlan(planId);
  if (!last) return null;
  const now = Date.now();
  const diffMs = now - last.endAt;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// 计算焚诀等循环计划：今天该练哪一天（8 天循环：推拉腿休推拉腿休）
function getCurrentDayIndex(planId, cycleLength, pattern) {
  const last = getLastLogForPlan(planId);
  if (!last) return 0; // 从第一天开始
  const now = new Date();
  const lastDate = new Date(last.endAt);
  const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  // 上次练的是 pattern[lastDayIndex]，所以今天该练的是 pattern[(lastDayIndex + daysSince) % cycleLength]
  // 需要从日志里找上次练的 dayIndex
  const lastDayIdx = typeof last.dayIndex === 'number' ? last.dayIndex : 0;
  return (lastDayIdx + daysSince) % cycleLength;
}


// 最近一次训练的时间戳（毫秒），用于 3 天未练检测
function getLastTrainingTime() {
  const logs = getLogs() || [];
  if (!logs.length) return 0;
  // 日志按时间倒序（新→旧），但保险起见取最大值
  let max = 0;
  for (const l of logs) {
    const t = l && (l.endAt || l.startedAt);
    if (typeof t === 'number' && t > max) max = t;
  }
  return max;
}

// 距上次训练多少天（0 表示今天，-1 表示从未练）
function getIdleDays() {
  const t = getLastTrainingTime();
  if (!t) return -1;
  const ms = Date.now() - t;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

module.exports = {
  getLogs,
  appendLog,
  getLastLogForPlan,
  getDaysSinceLast,
  getCurrentDayIndex,
  getLastTrainingTime,
  getIdleDays
};