// 云函数：login
// 返回调用者的 openid，用于数据按用户隔离。
// 部署：微信开发者工具 → 云开发 → 云函数 → 右键 login → 上传并部署（云端安装依赖，无 npm 依赖）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async () => {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext();
  return {
    openid: OPENID,
    appid: APPID,
    unionid: UNIONID || ''
  };
};
