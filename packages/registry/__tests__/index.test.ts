import path from 'path';

// 注意，一定需要上面否则可能会影响真实环境的密钥配置
const serverless_devs_config_home = path.join(__dirname, 'fixtures', 'logs');
process.env.serverless_devs_config_home = serverless_devs_config_home;

import Registry from '../src';

describe('Publish', () => {
  beforeAll(() => {
    require('dotenv').config({
      path: path.join(__dirname, '.env'),
    });
  });

  afterAll(() => {
    delete process.env.serverless_devs_registry_token;
  });

  test('publish', async () => {
    const registry = new Registry({});

    const component = path.join(__dirname, 'fixtures', 'component');
    await registry.publish(component);
  });
});

describe.only('API', () => {
  beforeEach(() => {
    require('dotenv').config({
      path: path.join(__dirname, '.env'),
    });
  });

  afterAll(() => {
    delete process.env.serverless_devs_registry_token;
  });

  test('list', async () => {
    const registry = new Registry({});
    const result = await registry.list();
    expect(Array.isArray(result)).toBeTruthy();
  });

  test('detail', async () => {
    const registry = new Registry({});
    const result = await registry.detail('wss-test');
    console.log('result: ', result);
    expect(Array.isArray(result)).toBeTruthy();
  });

  test('remove', async () => {
    const registry = new Registry({});
    await registry.remove('wss-test', '0.0.5');
  });

  test.only('package detail', async () => {
    const registry = new Registry({});
    const result = await registry.packageDetail('wss-test', '0.0.6');
    console.log('result detail: ', result);
  });

  test.only('package latest', async () => {
    const registry = new Registry({});
    const result = await registry.packageDetail('wss-test');
    console.log('result latest: ', result);
  });
});
