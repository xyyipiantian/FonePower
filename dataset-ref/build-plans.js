// 由 exercises-dataset 生成训练计划预设 · utils/plans.js
// 用法：node dataset-ref/build-plans.js
const path = require('path');
const fs = require('fs');
const exercises = require('../utils/exercises.js');

const byTarget = (v, n) =>
  exercises.EXERCISES.filter(e => (e.target || '').toLowerCase() === v.toLowerCase())
    .slice(0, n).map(e => e.id);
const byBody = (v, n) =>
  exercises.EXERCISES.filter(e => (e.bodyPart || '').toLowerCase() === v.toLowerCase())
    .slice(0, n).map(e => e.id);
const byBodyAny = (vs, n) =>
  exercises.EXERCISES.filter(e => vs.indexOf((e.bodyPart || '').toLowerCase()) > -1)
    .slice(0, n).map(e => e.id);

const specs = [
  {
    id: 'chest', name: '胸肌塑形', level: '初级', duration: '约 18 分钟', hue: 'primary',
    desc: '以推类动作为核心，激活胸肌与肱三头肌，改善上胸厚度与中缝线条。',
    target: ['胸肌', '肱三头肌'],
    ids: byTarget('pectorals', 6)
  },
  {
    id: 'back', name: '背部雕刻', level: '中级', duration: '约 22 分钟', hue: 'blue',
    desc: '围绕划船与下拉动作，强化背阔肌与斜方肌，塑造倒三角体态。',
    target: ['背阔肌', '斜方肌'],
    ids: byBody('back', 6)
  },
  {
    id: 'shoulders', name: '肩部三角', level: '初级', duration: '约 16 分钟', hue: 'violet',
    desc: '针对三角肌前中后束的推举与侧平举，打造立体肩线。',
    target: ['三角肌'],
    ids: byTarget('delts', 6)
  },
  {
    id: 'legs', name: '下肢力量', level: '中级', duration: '约 24 分钟', hue: 'amber',
    desc: '深蹲与硬拉复合动作并行，强化股四头肌、腘绳肌与臀肌，提升爆发力。',
    target: ['大腿', '小腿', '臀部'],
    ids: byBodyAny(['upper legs', 'lower legs'], 6)
  },
  {
    id: 'core', name: '核心燃脂', level: '初级', duration: '约 15 分钟', hue: 'accent',
    desc: '卷腹与平板支撑组合，紧致腹直肌与腹外斜肌，稳定躯干。',
    target: ['腹直肌'],
    ids: byTarget('abs', 6)
  },
  {
    id: 'fullbody', name: '全身激活', level: '进阶', duration: '约 30 分钟', hue: 'rose',
    desc: '覆盖胸、背、腿、肩、核心的多关节动作循环，高效燃脂并提升协调。',
    target: ['全身', '综合'],
    ids: [].concat(
      byBody('chest', 2),
      byBody('back', 2),
      byTarget('delts', 2),
      byBodyAny(['upper legs', 'lower legs'], 2),
      byBody('waist', 2)
    )
  }
];

const PLANS = specs.map(s => ({
  id: s.id, name: s.name, level: s.level, duration: s.duration,
  hue: s.hue, desc: s.desc, target: s.target, exerciseIds: s.ids
}));

const out =
`// AUTO-GENERATED from exercises-dataset · 训练计划预设
// 由 dataset-ref/build-plans.js 生成，请勿手动修改。
const PLANS = ${JSON.stringify(PLANS, null, 2)};

function getPlanById(id) {
  return PLANS.find(function (p) { return p.id === id; }) || null;
}

module.exports = { PLANS: PLANS, getPlanById: getPlanById };
`;

fs.writeFileSync(path.join(__dirname, '..', 'utils', 'plans.js'), out, 'utf8');

console.log('plans generated:', PLANS.length, '| total exercises:', PLANS.reduce((a, p) => a + p.exerciseIds.length, 0));
PLANS.forEach(p => console.log(' -', p.name, '(' + p.level + ')', p.exerciseIds.length, '个动作'));
