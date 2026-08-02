/**
 * FitFlow 提交信息规范（commitlint）
 *
 * 约束：
 *  - type 限定为 feat/fix/docs/style/refactor/test/ci + 通用 chore/perf
 *  - type 必须小写
 *  - subject 首字母不可大写（禁止 sentence/title/pascal/start/upper case）
 *  - header 总长不超过 100 字符
 *
 * 仅使用 commitlint 内置规则，不 extends 外部配置包，
 * 以便 GitHub Action（wagoid/commitlint-github-action）在自包含环境中直接读取，
 * 无需项目安装任何 npm 依赖。
 */
module.exports = {
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'ci', 'chore', 'perf'],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-case': [
      2,
      'never',
      ['upper-case', 'sentence-case', 'start-case', 'pascal-case', 'title-case'],
    ],
    'header-max-length': [2, 'always', 100],
  },
};
