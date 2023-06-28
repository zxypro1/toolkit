import path from 'path';

// 注意，一定需要上面否则可能会影响真实环境的密钥配置
const serverless_devs_config_home = path.join(__dirname, 'fixtures', 'logs');
process.env.serverless_devs_config_home = serverless_devs_config_home;

import { GENERATE_TOKEN, RESET_TOKEN } from './mock/constants';

describe.skip('Login', () => {
  // 为了不影响其他的测试 case
  let registry: any;
  beforeAll(() => {
    require('./mock');
    const LoginRegistry = require('../src').default;
    registry = new LoginRegistry({});
  });

  test('测试登陆包含参数', async () => {
    const token = 'xxxxxxxxxxxxxxxx';
    await registry.login(token);

    const result = registry.getToken();
    expect(result).toBe(token);
  });

  test('测试登陆不包含参数', async () => {
    await registry.login();

    const result = registry.getToken();
    expect(result).toBe(GENERATE_TOKEN);
  });

  test('测试重新登陆', async () => {
    await registry.login();
    await registry.resetToken();

    const result = registry.getToken();
    expect(result).toBe(RESET_TOKEN);
  });
});
