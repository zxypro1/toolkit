import path from 'path';
// 注意，一定需要上面否则可能会影响真实环境的密钥配置
const serverless_devs_config_home = path.join(__dirname, 'fixtures','logs', 'index')
process.env.serverless_devs_config_home = serverless_devs_config_home;
process.env.BUILD_IMAGE_ENV = 'fc-backend'
process.env.HOME = '/kaniko'


import fs from 'fs-extra';
import Credential from '../src';
import { DEFAULT_PROMPT_MESSAGE } from '../src/constant';

const credential = new Credential();

beforeAll(async () => {
  fs.removeSync(serverless_devs_config_home);
  await credential.set({
    access: 'aws',
    force: true,
    AccessKeyID: 'AccessKeyID',
    SecretAccessKey: 'SecretAccessKey',
    // @ts-ignore
    Test: 'abc'
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

test.only('测试 getAll / default 方法', async () => {
  await expect(async () => {
    await credential.default();
  }).rejects.toThrow(DEFAULT_PROMPT_MESSAGE);

  await credential.default('azure');
  let result = await credential.getAll();
  expect(result?.aws?.__default).not.toBe('true');
  expect(result?.azure?.__default).toBe('true');


  await credential.default('aws');
  result = await credential.getAll();
  expect(result?.aws?.__default).toBe('true');
  expect(result?.azure?.__default).not.toBe('true');
});

test('测试 remove / rename 方法', async () => {
  await expect(async () => {
    await credential.rename();
  }).rejects.toThrow(DEFAULT_PROMPT_MESSAGE);

  await expect(async () => {
    await credential.rename({ source: 'baidu' });
  }).rejects.toThrow(DEFAULT_PROMPT_MESSAGE);

  await expect(async () => {
    await credential.rename({ target: 'baidu233' });
  }).rejects.toThrow(DEFAULT_PROMPT_MESSAGE);

  await credential.rename({
    source: 'baidu',
    target: 'baidu233',
  });

  let result = await credential.getAll();
  expect(result).toHaveProperty('baidu233');
  expect(result).not.toHaveProperty('baidu');

  await expect(async () => {
    await credential.remove();
  }).rejects.toThrow(DEFAULT_PROMPT_MESSAGE);
  
  await credential.remove('baidu233');
  result = await credential.getAll();
  expect(result).not.toHaveProperty('baidu233');
});

test('测试 decrypt', async () => {
  const result = await credential.decrypt({
    AccessKeyID: 'U2FsdGVkX1/vUriF3c62TFb2R8qgDP669jsyr6ilyD4=',
    SecretAccessKey: 'U2FsdGVkX1/HygYh+uGL+wxglAQuxDzj/UUARUMW9NE=',
  });

  expect(result).toEqual({
    AccessKeyID: 'AccessKeyID',
    SecretAccessKey: 'SecretAccessKey'
  });
});

