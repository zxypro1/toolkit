import path from 'path';
// 注意，一定需要上面否则可能会影响真实环境的密钥配置
const serverless_devs_config_home = path.join(__dirname, 'fixtures','logs', 'set')
process.env.serverless_devs_config_home = serverless_devs_config_home;
process.env.BUILD_IMAGE_ENV = 'fc-backend'
process.env.HOME = '/kaniko'

import fs from 'fs-extra';
import Credential from '../src';
import { DEFAULT_PROMPT_MESSAGE } from '../src/constant';

const credential = new Credential();

describe('Set', () => {
  
  beforeAll(() => {
    fs.removeSync(serverless_devs_config_home);
  })

  test('新增 alibaba 密钥', async () => {
    await expect(async () => {
      await credential.set({
        access: 'alibaba',
        AccessKeyID: 'AccessKeyID',
        AccessKeySecret: 'AccessKeySecret',
      })
    }).rejects.toThrow();

    const result = await credential.set({
      access: 'alibaba',
      AccessKeyID: 'AccessKeyID',
      AccessKeySecret: 'AccessKeySecret',
      AccountID: 'AccountID',
    })

    expect(result?.access).toBe('alibaba');
    expect(result?.credential).toEqual({
      __provider: 'Alibaba Cloud',
      AccountID: 'AccountID',
      AccessKeyID: 'AccessKeyID',
      AccessKeySecret: 'AccessKeySecret'
    });
  });

  test('创建 aws 密钥', async () => {
    const result = await credential.set({
      access: 'aws',
      force: true,
      AccessKeyID: 'AccessKeyID',
      SecretAccessKey: 'SecretAccessKey',
      // @ts-ignore
      Test: 'abc',
    })

    expect(result?.access).toBe('aws');
    expect(result?.credential).toEqual({
      AccessKeyID: 'AccessKeyID',
      SecretAccessKey: 'SecretAccessKey'
    });
  });

  test('创建 azure 密钥', async () => {
    const result = await credential.set({
      access: 'azure',
      force: true,
      KeyVaultName: 'KeyVaultName',
      TenantID: 'TenantID',
      ClientID: 'ClientID',
      ClientSecret: 'ClientSecret',
    })

    expect(result).toEqual({
      access: 'azure',
      credential: {
        KeyVaultName: 'KeyVaultName',
        TenantID: 'TenantID',
        ClientID: 'ClientID',
        ClientSecret: 'ClientSecret',
      },
    });
  });

  test('创建 baidu 密钥', async () => {
    const result = await credential.set({
      access: 'baidu',
      force: true,
      AccessKeyID: 'AccessKeyID',
      SecretAccessKey: 'SecretAccessKey',
    })

    expect(result).toEqual({
      access: 'baidu',
      credential: {
        AccessKeyID: 'AccessKeyID',
        SecretAccessKey: 'SecretAccessKey',
      },
    });
  });

  test('创建 google 密钥', async () => {
    const result = await credential.set({
      access: 'google',
      force: true,
      PrivateKeyData: 'PrivateKeyData',
      SecretAccessKey: 'SecretAccessKey',
    })

    expect(result).toEqual({
      access: 'google',
      credential: {
        PrivateKeyData: 'PrivateKeyData',
      },
    });
  });

  test('创建 huawei 密钥', async () => {
    const result = await credential.set({
      access: 'huawei',
      force: true,
      AccessKeyID: 'AccessKeyID',
      SecretAccessKey: 'SecretAccessKey',
      // @ts-ignore
      Test: 'abc'
    })

    expect(result?.access).toBe('huawei');
    expect(result?.credential).toEqual({
      AccessKeyID: 'AccessKeyID',
      SecretAccessKey: 'SecretAccessKey'
    });
  });

  test('创建 tencent 密钥', async () => {
    const result = await credential.set({
      access: 'tencent',
      force: true,
      AccountID: 'AccountID',
      SecretID: 'SecretID',
      SecretKey: 'SecretKey',
    })

    expect(result).toEqual({
      access: 'tencent',
      credential: {
        AccountID: 'AccountID',
        SecretID: 'SecretID',
        SecretKey: 'SecretKey',
      },
    });
  });

  test('创建自定义密钥', async () => {
    const result = await credential.set({
      access: 'custom',
      force: true,
      keyList: 'SecretID,SecretKey,Test',
      infoList: 'abc,yyy,123',
    })

    expect(result).toEqual({
      access: 'custom',
      credential: {
        __provider: 'Custom',
        Test: '123',
        SecretID: 'abc',
        SecretKey: 'yyy',
      },
    });
  });


  test('测试 cicd 环境不能出现交互异常', async () => {
    expect(async () => {
      await credential.set({
        access: 'custom',
        force: true,
        keyList: 'SecretID,SecretKey,Test',
        // @ts-ignore
        value: 'abc,yyy,123',
      })
    }).rejects.toThrow(DEFAULT_PROMPT_MESSAGE);
  });

});
