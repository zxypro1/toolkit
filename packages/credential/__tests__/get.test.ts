import path from 'path';
// 注意，一定需要上面否则可能会影响真实环境的密钥配置
const serverless_devs_config_home = path.join(__dirname, 'fixtures','logs', 'get')
process.env.serverless_devs_config_home = serverless_devs_config_home;
process.env.BUILD_IMAGE_ENV = 'fc-backend'
process.env.HOME = '/kaniko'

import fs from 'fs-extra';
import Credential from '../src';

const credential = new Credential();

beforeAll(async () => {
  fs.removeSync(serverless_devs_config_home);
  await credential.set({
    access: 'aws',
    force: true,
    AccessKeyID: 'AccessKeyID',
    SecretAccessKey: 'SecretAccessKey',
  })

  await credential.set({
    access: 'azure',
    force: true,
    KeyVaultName: 'KeyVaultName',
    TenantID: 'TenantID',
    ClientID: 'ClientID',
    ClientSecret: 'ClientSecret',
  })

  await credential.set({
    access: 'baidu',
    force: true,
    AccessKeyID: 'AccessKeyID',
    SecretAccessKey: 'SecretAccessKey',
  })
})