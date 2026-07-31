// 将 exercises-dataset 的 exercises.json 转换为小程序可用的数据模块
// 输出: /d/小程序项目/FitFlow/utils/exercises.js
// 策略: 仅保留中文(zh)说明以控制包体积; 动作要领由 instructions 按标点切分得到; 媒体走 jsDelivr CDN。
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'exercises.json');
const OUT_DIR = path.join(__dirname, '..', 'utils');
const OUT = path.join(OUT_DIR, 'exercises.js');
const BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/';

// 中文动作名映射（id -> 中文名），由 dataset-ref/translate-names.js 生成。
// 缺失时 nameZh 回退为英文原名，不影响构建。
let ZHMAP = {};
try { ZHMAP = require('./name-zh.json'); } catch (e) { console.warn('未找到 name-zh.json，nameZh 将回退为英文原名。'); }

// 中文标签映射（覆盖 exercisedb 标准词表，未命中则做美化兜底）
const MAP = {
  bodyPart: {
    'waist': '腰腹', 'chest': '胸部', 'upper arms': '上臂', 'lower arms': '前臂',
    'shoulders': '肩部', 'back': '背部', 'legs': '腿部', 'cardio': '有氧',
    'neck': '颈部', 'hips': '髋部', 'abdominals': '腹部', 'lower legs': '小腿',
    'upper legs': '大腿'
  },
  equipment: {
    'body weight': '自重', 'barbell': '杠铃', 'dumbbell': '哑铃', 'kettlebell': '壶铃',
    'cable': '绳索器械', 'machine': '器械', 'band': '弹力带', 'exercise ball': '健身球',
    'medicine ball': '药球', 'e-z curl bar': 'EZ曲杆', 'stability ball': '瑞士球',
    'foam roll': '泡沫轴', 'rope': '战绳', 'tire': '轮胎', 'sled machine': '雪橇机',
    'olympic barbell': '奥杆', 'lever': '杠杆器械', 'stationary bike': '固定单车',
    'elliptical machine': '椭圆机', 'rowing machine': '划船机', 'smith machine': '史密斯机',
    'booty band': '臀环', 'bosu ball': '波速球', 'resistance band': '弹力带',
    'roller': '泡沫轴', 'bench': '训练凳', 'none': '无器械', 'other': '其他',
    'leverage machine': '杠杆器械', 'weighted': '负重', 'ez barbell': 'EZ杠铃',
    'assisted': '辅助器械', 'wheel roller': '健腹轮', 'upper body ergometer': '上肢功率车',
    'skierg machine': '滑雪机', 'hammer': '锤式', 'trap bar': '六角杠铃', 'stepmill machine': '阶梯机'
  },
  target: {
    'abs': '腹直肌', 'abductors': '髋外展肌', 'adductors': '髋内收肌', 'biceps': '肱二头肌',
    'calves': '小腿', 'chest': '胸大肌', 'forearms': '前臂', 'glutes': '臀大肌',
    'hamstrings': '腘绳肌', 'lats': '背阔肌', 'lower back': '下背', 'middle back': '中背',
    'neck': '颈部', 'quadriceps': '股四头肌', 'shoulders': '三角肌', 'traps': '斜方肌',
    'triceps': '肱三头肌', 'upper back': '上背', 'hips': '髋部', 'levator scapulae': '肩胛提肌',
    'soleus': '比目鱼肌', 'tibialis anterior': '胫骨前肌', 'gastrocnemius': '腓肠肌',
    'obliques': '腹斜肌', 'serratus anterior': '前锯肌', 'spinal erectors': '竖脊肌',
    'infraspinatus': '冈下肌', 'teres major': '大圆肌', 'transverse abdominis': '腹横肌',
    'hip flexors': '髋屈肌', 'groin': '腹股沟', 'pectorals': '胸肌', 'delts': '三角肌',
    'quads': '股四头肌', 'gluteus maximus': '臀大肌', 'lower spine': '下脊柱',
    'cardiovascular system': '心血管系统', 'spine': '脊柱'
  }
};

function prettify(s) {
  return (s || '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}
function label(dim, v) {
  return (MAP[dim] && MAP[dim][v]) || prettify(v);
}

function main() {
  // 输入源：优先 exercises.json（hasaneyldrm/exercises-dataset 原始数据）；
  // 若缺失（如仅需重新注入 nameZh），则回退到已生成的 utils/exercises.js 的 EXERCISES。
  let raw;
  if (fs.existsSync(SRC)) {
    raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  } else {
    const mod = require(path.join(__dirname, '..', 'utils', 'exercises.js'));
    raw = mod.EXERCISES || mod;
  }
  console.log('原始记录数:', raw.length);

  const exes = raw
    .map(e => {
      const instr = e.instructionsZh || (e.instructions && (e.instructions.zh || e.instructions.en)) || '';
      return {
        id: e.id,
        name: e.name,
        nameZh: (ZHMAP && ZHMAP[e.id]) || e.name || '',
        bodyPart: e.bodyPart || e.body_part || '',
        equipment: e.equipment || '',
        target: e.target || '',
        secondaryMuscles: e.secondaryMuscles || e.secondary_muscles || [],
        gif: e.gif || (e.gif_url ? BASE + e.gif_url : ''),
        image: e.image || (e.image ? BASE + e.image : ''),
        attribution: e.attribution || '',
        instructionsZh: instr
      };
    })
    .filter(e => e.name);

  function buildOptions(dim) {
    const m = {};
    exes.forEach(e => {
      const v = e[dim];
      if (v) m[v] = (m[v] || 0) + 1;
    });
    return Object.entries(m)
      .map(([value, count]) => ({ value, label: label(dim, value), count }))
      .sort((a, b) => b.count - a.count);
  }

  const OPTIONS = {
    bodyPart: buildOptions('bodyPart'),
    equipment: buildOptions('equipment'),
    target: buildOptions('target')
  };

  // 输出未命中的值，便于后续补全翻译
  ['bodyPart', 'equipment', 'target'].forEach(dim => {
    const unmapped = OPTIONS[dim].filter(o => !(MAP[dim] && MAP[dim][o.value])).map(o => o.value);
    if (unmapped.length) console.log('UNMAPPED ' + dim + ':', unmapped.join(', '));
  });

  const DIM_LABELS = { bodyPart: '身体部位', equipment: '训练器械', target: '目标肌群' };

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const header =
    '// AUTO-GENERATED from hasaneyldrm/exercises-dataset (exercises.json)\n' +
    '// 数据来源: https://github.com/hasaneyldrm/exercises-dataset  (代码/数据 MIT, 媒体 © Gym visual)\n' +
    '// 说明: 仅保留中文(zh)说明以控制包体积; 动作要领由 instructions 按标点切分; 媒体经 jsDelivr CDN 远程加载。\n' +
    '// 重新生成: node dataset-ref/build.js  （中文名经 name-zh.json 注入，支持中英双语搜索）\n\n';

  const body =
    'module.exports = (function () {\n' +
    '  const EXERCISES = ' + JSON.stringify(exes) + ';\n' +
    '  const OPTIONS = ' + JSON.stringify(OPTIONS) + ';\n' +
    '  const DIM_LABELS = ' + JSON.stringify(DIM_LABELS) + ';\n' +
    '  const MAP = ' + JSON.stringify(MAP) + ';\n\n' +
    '  function prettify(s) {\n' +
    '    return (s || "").replace(/[-_]/g, " ").replace(/\\b\\w/g, function (c) { return c.toUpperCase(); }).trim();\n' +
    '  }\n' +
    '  function label(dim, v) {\n' +
    '    return (MAP[dim] && MAP[dim][v]) || prettify(v);\n' +
    '  }\n' +
    '  function splitSteps(text) {\n' +
    '    if (!text) return [];\n' +
    '    var parts = text.split(/[。\\n.!?]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });\n' +
    '    return parts.length ? parts : [text];\n' +
    '  }\n' +
    '  function decorate(ex) {\n' +
    '    if (!ex) return ex;\n' +
    '    return Object.assign({}, ex, {\n' +
    '      bodyPartLabel: label("bodyPart", ex.bodyPart),\n' +
    '      equipmentLabel: label("equipment", ex.equipment),\n' +
    '      targetLabel: label("target", ex.target),\n' +
    '      secondaryMusclesLabel: (ex.secondaryMuscles || []).map(function (m) { return label("target", m); }),\n' +
    '      initial: (ex.name || "?").charAt(0),\n' +
    '      nameZh: ex.nameZh || ex.name || "",\n' +
    '      steps: splitSteps(ex.instructionsZh)\n' +
    '    });\n' +
    '  }\n' +
    '  function filter(opts) {\n' +
    '    opts = opts || {};\n' +
    '    var kw = (opts.keyword || "").trim().toLowerCase();\n' +
    '    return EXERCISES.filter(function (ex) {\n' +
    '      if (opts.bodyPart && ex.bodyPart !== opts.bodyPart) return false;\n' +
    '      if (opts.equipment && ex.equipment !== opts.equipment) return false;\n' +
    '      if (opts.target && ex.target !== opts.target) return false;\n' +
    '      if (kw && (ex.name || "").toLowerCase().indexOf(kw) === -1 && (ex.nameZh || "").toLowerCase().indexOf(kw) === -1) return false;\n' +
    '      return true;\n' +
    '    }).map(decorate);\n' +
    '  }\n' +
    '  // 列表专用投影：仅保留列表渲染所需的轻量字段，剔除非必要的重字段\n' +
    '  // (instructionsZh / steps / gif / attribution / secondaryMuscles*)，避免 setData 传输过大。\n' +
    '  function listItem(ex) {\n' +
    '    if (!ex) return ex;\n' +
    '    return {\n' +
    '      id: ex.id,\n' +
    '      name: ex.name,\n' +
    '      image: ex.image,\n' +
    '      bodyPartLabel: label("bodyPart", ex.bodyPart),\n' +
    '      equipmentLabel: label("equipment", ex.equipment),\n' +
    '      targetLabel: label("target", ex.target),\n' +
    '      initial: (ex.name || "?").charAt(0),\n' +
    '      nameZh: ex.nameZh || ex.name || "",\n' +
    '    };\n' +
    '  }\n' +
    '  function filterList(opts) {\n' +
    '    opts = opts || {};\n' +
    '    var kw = (opts.keyword || "").trim().toLowerCase();\n' +
    '    return EXERCISES.filter(function (ex) {\n' +
    '      if (opts.bodyPart && ex.bodyPart !== opts.bodyPart) return false;\n' +
    '      if (opts.equipment && ex.equipment !== opts.equipment) return false;\n' +
    '      if (opts.target && ex.target !== opts.target) return false;\n' +
    '      if (kw && (ex.name || "").toLowerCase().indexOf(kw) === -1 && (ex.nameZh || "").toLowerCase().indexOf(kw) === -1) return false;\n' +
    '      return true;\n' +
    '    }).map(listItem);\n' +
    '  }\n' +
    '  function getListById(id) {\n' +
    '    return listItem(EXERCISES.find(function (e) { return e.id === id; }));\n' +
    '  }\n' +
    '  function getById(id) {\n' +
    '    return decorate(EXERCISES.find(function (e) { return e.id === id; }));\n' +
    '  }\n' +
    '  function getOptions(dim) {\n' +
    '    return OPTIONS[dim] || [];\n' +
    '  }\n' +
    '  return { EXERCISES: EXERCISES, OPTIONS: OPTIONS, DIM_LABELS: DIM_LABELS, getOptions: getOptions, filter: filter, filterList: filterList, getById: getById, getListById: getListById };\n' +
    '})();\n';

  fs.writeFileSync(OUT, header + body, 'utf8');
  const sizeKB = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('已生成:', OUT);
  console.log('数据模块大小:', sizeKB, 'KB');
  console.log('分类统计 -> 身体部位:', OPTIONS.bodyPart.length, '器械:', OPTIONS.equipment.length, '目标肌群:', OPTIONS.target.length);
}

main();
