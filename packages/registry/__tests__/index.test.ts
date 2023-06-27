import path from 'path';
// 注意，一定需要上面否则可能会影响真实环境的密钥配置
const serverless_devs_config_home = path.join(__dirname, 'fixtures','logs')
process.env.serverless_devs_config_home = serverless_devs_config_home;

import './mock'
import Registry from '../src';
import { getPlatformPath } from '../src/utils';
import fs from 'fs';

describe('Registry', () => {
  test('测试登陆包含参数', async () => {
    const token = 'xxxxxxxxxxxxxxxx';
    const registry = new Registry({});
    await registry.login(token);
  
    const platformPath = getPlatformPath();
    const result = fs.readFileSync(platformPath, 'utf-8');
    expect(result).toBe(token);
  });

  test('测试登陆不包含参数', async () => {
    const registry = new Registry({});
    await registry.login();

    const platformPath = getPlatformPath();
    const result = fs.readFileSync(platformPath, 'utf-8')
    expect(result).toBe('test-token');
  });
})

