const baseUrl = 'http://api.devsapp.cn/v3';
// *** 登陆 *** //
// 登陆
export const REGISTRY_INFORMATION_GITHUB = `${baseUrl}/user/check`;

// github回调
export const GITHUB_LOGIN_URL = `https://github.com/login/oauth/authorize?client_id=ef1df7f4f6b9e5a343af&redirect_uri=${baseUrl}/user/login`;
// 刷新 token
export const RESET_URL = `${baseUrl}/user/token`;

// *** 发布 *** //
export const PUBLISH_URL = `${baseUrl}/packages/releases`;

// *** 已发布列表 *** //
export const CENTER_PUBLISH_URL = `${baseUrl}/packages/releases`;

// *** 指定仓库详情 *** //
export const getDetailUrl = (name: string) => `${baseUrl}/packages/${name}/release`;

// *** 删除 url *** //
export const getRemoveUrl = (name: string, versionId: string) =>
  `${baseUrl}/packages/${name}/release/tags/${versionId}`;
