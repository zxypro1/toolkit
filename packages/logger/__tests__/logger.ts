import { get, set } from 'lodash';
import Logger from '../src';
import path from 'path';

/**
 * 1. 写文件的时候分离： 1. console 文件， 2. 各个 service 的执行日志文件
 * 2. 使用方法尽可能优化一下
 */
async function run() {
  const yamlConfig: any = {
    'deploy-a': {
      component: 'fc',
      runTime: 5,
    },
    'deploy-b': {
      component: 'fc',
      addCustom: true,
      runTime: 7,
    },
    // 'deploy-c': {
    //   component: 'hang',
    // },
  };

  const traceId = Math.random().toString(16).slice(2);
  const keys = Object.keys(yamlConfig);

  const loggers = new Logger({
    traceId,
    logDir: path.join(__dirname, 'fixtures', 'logs'),
    secrets: ['abc'],
    level: 'INFO',
    // instanceKeys: keys,
  });

  // 模拟 engine
  const promiseAll = keys.map(async (key: string) => {
    const inputs: any = yamlConfig[key];
    const logger = loggers.__generate(key);
    // const logger = get(loggers, key);
    logger.progress(`Start command ${key}`);

    const Component = require(`./fixtures/engine/${inputs.component}`).default;
    const fc = new Component({ logger });
    
    return await fc.deploy(inputs).then((res: any) => {
      logger.info(`${key} 运行结束`);
      loggers.__unset(key);
      return res;
    });
  });

  await Promise.all(promiseAll);

  console.log('traceId: ', traceId);
}

run();

