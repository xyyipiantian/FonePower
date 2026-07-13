// AUTO-GENERATED from exercises-dataset · 训练计划预设
// 由 dataset-ref/build-plans.js 生成，请勿手动修改。
const PLANS = [
  {
    "id": "chest",
    "name": "胸肌塑形",
    "level": "初级",
    "duration": "约 18 分钟",
    "hue": "primary",
    "desc": "以推类动作为核心，激活胸肌与肱三头肌，改善上胸厚度与中缝线条。",
    "target": [
      "胸肌",
      "肱三头肌"
    ],
    "exerciseIds": [
      "3294",
      "0009",
      "1716",
      "2364",
      "1254",
      "0989"
    ]
  },
  {
    "id": "back",
    "name": "背部雕刻",
    "level": "中级",
    "duration": "约 22 分钟",
    "hue": "blue",
    "desc": "围绕划船与下拉动作，强化背阔肌与斜方肌，塑造倒三角体态。",
    "target": [
      "背阔肌",
      "斜方肌"
    ],
    "exerciseIds": [
      "0007",
      "3293",
      "0015",
      "0017",
      "1431",
      "1432"
    ]
  },
  {
    "id": "shoulders",
    "name": "肩部三角",
    "level": "初级",
    "duration": "约 16 分钟",
    "hue": "violet",
    "desc": "针对三角肌前中后束的推举与侧平举，打造立体肩线。",
    "target": [
      "三角肌"
    ],
    "exerciseIds": [
      "0977",
      "0978",
      "0993",
      "0997",
      "1022",
      "1012"
    ]
  },
  {
    "id": "legs",
    "name": "下肢力量",
    "level": "中级",
    "duration": "约 24 分钟",
    "hue": "amber",
    "desc": "深蹲与硬拉复合动作并行，强化股四头肌、腘绳肌与臀肌，提升爆发力。",
    "target": [
      "大腿",
      "小腿",
      "臀部"
    ],
    "exerciseIds": [
      "1512",
      "1368",
      "3214",
      "1708",
      "1709",
      "1710"
    ]
  },
  {
    "id": "core",
    "name": "核心燃脂",
    "level": "初级",
    "duration": "约 15 分钟",
    "hue": "accent",
    "desc": "卷腹与平板支撑组合，紧致腹直肌与腹外斜肌，稳定躯干。",
    "target": [
      "腹直肌"
    ],
    "exerciseIds": [
      "0001",
      "0002",
      "0003",
      "0006",
      "2355",
      "2333"
    ]
  },
  {
    "id": "fullbody",
    "name": "全身激活",
    "level": "进阶",
    "duration": "约 30 分钟",
    "hue": "rose",
    "desc": "覆盖胸、背、腿、肩、核心的多关节动作循环，高效燃脂并提升协调。",
    "target": [
      "全身",
      "综合"
    ],
    "exerciseIds": [
      "3294",
      "0009",
      "0007",
      "3293",
      "0977",
      "0978",
      "1512",
      "1368",
      "0001",
      "0002"
    ]
  }
];

function getPlanById(id) {
  return PLANS.find(function (p) { return p.id === id; }) || null;
}

module.exports = { PLANS: PLANS, getPlanById: getPlanById };
