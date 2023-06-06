import { set, each } from 'lodash';
import path from 'path';
import { IOptions } from './type';
import EngineLogger from './engine-logger';
import ProgressFooter from './progress-footer';

async function log(keys: string[], options: IOptions) {
  const { logDir, traceId, level, secrets, eol } = options;
  
  const progressFooter = new ProgressFooter();
  const loggers: Record<string, any> = {};

  each(keys, (key: string) => {
    const logger = new EngineLogger({
      file: path.join(logDir, traceId, `${key}.log`),
      secrets,
      level,
      key,
      eol,
    });

    // @ts-ignore
    logger.progress = (message: string) => {
      progressFooter.upsert(key, message)
    };

    set(loggers, key, logger);
  });

  loggers.__progressFooter = progressFooter;
  loggers.__clear = () => {
    progressFooter.clear();
  };

  return loggers;
}

export default log;
