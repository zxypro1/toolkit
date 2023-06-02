import ProgressFooter from '../src/progress-footer';
import EngineLogger from '../src';

import path from 'path';


/**

- 有交互的时候
- 输出到文件效果需要确认 ( upsert => info )
- 进程结束，如果不调用 progressFooter.clear() 光标就没有了
- window ?
- winston / egg-logger
- 日志删除

*/

// engine log 开发时，不可以将所有的日志都暴露出来，所以选择性的暴露给用户
function getFunctionProgress(key: string, progressFooter: ProgressFooter) {
  function show(message: string){
    progressFooter.upsert(key, message)
  };

  show.upsert = progressFooter.upsert;
  show.removeItem = progressFooter.removeItem;

  // show.stop = progressFooter.stop;
  // show.start = progressFooter.start;

  // show.getKeys = progressFooter;

  return show;
}


async function run() {
  const progressFooter = new ProgressFooter();

  const yamlConfig: any = {
    'deploy-a': {
      component: 'fc',
      runTime: 25,
    },
    'deploy-b': {
      component: 'fc',
      addCustom: true,
      runTime: 15,
    },
    // 'deploy-c': {
    //   component: 'hang',
    // },
  };
  const uuid = Math.random().toString(16).slice(2);


  const promiseAll = Object.keys(yamlConfig).map(async (key) => {
    const inputs: any = yamlConfig[key];
    inputs.key = key;
  
    const logger = new EngineLogger({
      file: path.join(__dirname, 'fixtures', 'logs', uuid, `${key}.log`),
    });
    logger.progress = getFunctionProgress(key, progressFooter);

    logger.progress(`Start command ${key}`);
    const Component = require(`./fixtures/engine/${inputs.component}`).default;
    const fc = new Component({ logger });
    
    return await fc.deploy(inputs).then((res: any) => {
      logger.info(`${key} 运行结束`);
      progressFooter.removeItem(key);
      return res;
    });
  });

  await Promise.all(promiseAll);
  console.log('都结束了');

  progressFooter.clear();
}

run();

