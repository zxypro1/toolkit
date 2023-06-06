import { get, set, each } from 'lodash';
import inquirer from 'inquirer';
import path from 'path';
import { IOptions } from './type';
import EngineLogger from './engine-logger';
import ProgressFooter from './progress-footer';
import ShowLog from './show-log';

/**
解决思路：输出的日志一定会滞后
  1. 可以将动态效果、交互逻辑、日志全都包起来
  2. 日志文件输出多份：一份作为真实的各个 service 的执行日志文件，一份作为控制台输出文件
  3. 当遇到交互时，记录日志输出的行号，将控制台日志终止输出到终端，但是此时日志还是会往日志文件输入的。待交互运行完，再将阻塞的日志输出到终端。
*/

async function log(keys: string[], options: IOptions) {
  const { logDir, traceId, level, secrets, eol } = options;
  const consoleLogPath = path.join(logDir, traceId, `${traceId}.log`);
  
  const progressFooter = new ProgressFooter();
  const showLog = new ShowLog(consoleLogPath);
  const loggers: Record<string, any> = {};

  each(keys, (key: string) => {
    const logger = new EngineLogger({
      file: path.join(logDir, traceId, `${key}.log`),
      consoleLogPath,
      secrets,
      level,
      key,
      eol,
    });

    const progress = getFunctionProgress(key, progressFooter);

    // @ts-ignore
    logger.progress = progress;

    set(loggers, key, logger);
  });

  showLog.start();

  return {
    loggers,
    progressFooter,
    clear: () => {
      showLog.stop();
      progressFooter.clear();
    }
  }
}

// engine log 开发时，不可以将所有的日志都暴露出来，所以选择性的暴露给用户
function getFunctionProgress(key: string, progressFooter: ProgressFooter) {
  function show(message: string){
    progressFooter.upsert(key, message)
  };
  show.upsert = progressFooter.upsert;
  show.removeItem = progressFooter.removeItem;
  return show;
}

export default log;
