// FitFlow · 订阅消息发送代理
// 限制：当前登录用户的 openid 是订阅消息的唯一目标。前端拿不到 openid 也不能调 openapi，
//       所以走云函数用 SDK 调 cloud.openapi.subscribeMessage.send。
// 入参：{ tmplId, data: { thing1: { value }, thing2: { value }, ... } }
// 返回：{ ok: bool, err?: string }

const cloud = require('wx-server-sdk');

exports.main = async (event /*, context*/) => {
  const { tmplId, data } = event || {};
  if (!tmplId) return { ok: false, err: 'missing tmplId' };
  if (!data)    return { ok: false, err: 'missing data' };

  // 取当前调用者 openid（必须从云函数上下文拿，前端塞的 _openid 系统会拒绝）
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  if (!openid) return { ok: false, err: 'no openid' };

  // 模板 ID 占位（前端会把用户在公众平台申请的 templateId 传过来）
  // 如果用户没填，会被前端云函数入口过滤掉
  if (tmplId === 'TEMPLATE_ID_TRAIN_DONE' || !tmplId.startsWith('TEMPLATE_ID_') === false && tmplId === 'TEMPLATE_ID_TRAIN_DONE') {
    return { ok: false, err: 'template-id-not-configured' };
  }

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      templateId: tmplId,
      // 默认走「进入小程序查看」入口
      page: 'pages/index/index',
      // 模板字段（每个模板字段名不同，这里按通用结构传入）
      data: data,
      // 跳转小程序的版本（release/trial/develop）
      miniprogramState: 'develop'
    });
    return { ok: true, result };
  } catch (err) {
    // 常见 errCode：
    //   40037 template_id 不正确（用户没填或填错）
    //   43101 订阅被拒 / 已用完（一次性订阅用一次即失效）
    //   43104 没有订阅关系（用户没点过授权）
    console.error('[sendSubscribeMessage] fail:', err && err.errCode, err && err.errMsg);
    return {
      ok: false,
      errCode: err && err.errCode,
      errMsg: err && err.errMsg
    };
  }
};