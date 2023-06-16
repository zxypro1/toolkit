import path from 'path';
// 注意，一定需要上面否则可能会影响真实环境的密钥配置
const serverless_devs_config_home = path.join(__dirname, '..', 'fixtures','logs', 'set')
process.env.serverless_devs_config_home = serverless_devs_config_home;

import Credential from '../../src';

async function notParams () {
  const credential = new Credential();
  const result = await credential.set({
    // @ts-ignore
    test: 'abc', // TODO: 存在错误的参数没有警告
  });
  console.log('notParams', result);
}

/**
 * 传入 access, 如果没有命名冲突则直接返回 access
 */
async function accessParams () {
  const credential = new Credential();
  const result = await credential.set({
    access: 'xxx'
  });
  console.log('传入 access, 如果没有命名冲突则不选择命名', result);
}

async function setAlibaba () {
  const credential = new Credential();
  const result = await credential.set({
    access: 'xxx',
    AccessKeyID: 'LTAI5*****THK',
    AccessKeySecret: 'RgeGJ*****FyMW',
    AccountID: 'xxxxxx',
  });
  console.log('传入真实的密钥，然后 AccountID 是异常的，修改为真实的 AccountID：', result);
}

(async function () {
  // await notParams();

  // await accessParams();

  await setAlibaba();
})()
