import path from 'path';

// 注意，一定需要上面否则可能会影响真实环境的密钥配置
const serverless_devs_config_home = path.join(__dirname, 'fixtures', 'logs');
process.env.serverless_devs_config_home = serverless_devs_config_home;

import { GENERATE_TOKEN, RESET_TOKEN } from './mock';
import Registry from '../src';

describe('Login', () => {
  test('测试登陆包含参数', async () => {
    const token = 'xxxxxxxxxxxxxxxx';
    const registry = new Registry({});
    await registry.login(token);

    const result = registry.getToken();
    expect(result).toBe(token);
  });

  test('测试登陆不包含参数', async () => {
    const registry = new Registry({});
    await registry.login();

    const result = registry.getToken();
    expect(result).toBe(GENERATE_TOKEN);
  });

  test('测试重新登陆', async () => {
    const registry = new Registry({});
    await registry.login();
    await registry.resetToken();

    const result = registry.getToken();
    expect(result).toBe(RESET_TOKEN);
  });
});

describe('Publish', () => {
  beforeAll(() => {
    require('dotenv').config({
      path: path.join(__dirname, '.env'),
    });
  });

  afterAll(() => {
    delete process.env.TOKEN;
  });

  test('publish', () => {});
});
