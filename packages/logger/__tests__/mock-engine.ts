import ProgressFooter from '../src/progress-footer';
import EngineLogger from '../src/_logger';

import path from 'path';


// engine log 开发时，不可以将所有的日志都暴露出来，所以选择性的暴露给用户
function getFunctionProgress(key: string, progressFooter: ProgressFooter) {
  function show(message: string){
    progressFooter.upsert(key, message)
  };
  show.upsert = progressFooter.upsert;
  show.removeItem = progressFooter.removeItem;
  return show;
}

/**
 * 1. 写文件的时候分离： 1. console 文件， 2. 各个 service 的执行日志文件
 * 2. 使用方法尽可能优化一下
 */

async function run() {
  const progressFooter = new ProgressFooter();

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

  const uuid = Math.random().toString(16).slice(2);

  // 模拟 engine
  const promiseAll = Object.keys(yamlConfig).map(async (key) => {
    const inputs: any = yamlConfig[key];
    inputs.key = key;
  
    const logger = new EngineLogger({
      file: path.join(__dirname, 'fixtures', 'logs', uuid, `${key}.log`),
      secrets: ['abc'],
    });
    logger.progress = getFunctionProgress(key, progressFooter);

    logger.progress(`Start command ${key}`);
    const Component = require(`./fixtures/engine/${inputs.component}`).default;
    const fc = new Component({ logger });
    
    return await fc.deploy(inputs).then((res: any) => {
      logger.info(`${key} 运行结束`);
      // progressFooter.removeItem(key);
      return res;
    });
  });

  await Promise.all(promiseAll);

  progressFooter.clear();
}

run();

