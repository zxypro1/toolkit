import { set, each, unset } from 'lodash';
import path from 'path';
import { IOptions } from './type';
import EngineLogger from './engine-logger';
import ProgressFooter from './progress-footer';

interface ILoggerInstance extends EngineLogger {
  progress: (message: string) => void;
}

/**
 * 最高权限密钥获取
 * 文档书写
 * 测试书写
 */
export default class Logger {
  private __options: IOptions;
  __progressFooter: ProgressFooter;

  constructor(options: IOptions) {
    this.__options = options;
    this.__progressFooter = new ProgressFooter();
    if (options?.instanceKeys) {
      each(options.instanceKeys, (value: string) => {
        this.__generate(value);
      })
    }
  }

  __generate(instanceKey: string) {
    const logger = new EngineLogger(this.__getEggLoggerConfig(instanceKey)) as ILoggerInstance;

    logger.progress = (message: string) => {
      this.__progressFooter.upsert(instanceKey, message)
    };

    set(this, instanceKey, logger);
    return logger;
  }

  __unset(instanceKey: string) {
    unset(this, instanceKey);
    this.__progressFooter.removeItem(instanceKey);
  }

  __clear = () => {
    this.__progressFooter.clear();
  }

  private __getEggLoggerConfig(key: string) {
    return {
      file: path.join(this.__options.logDir, this.__options.traceId, `${key}.log`),
      secrets: this.__options.secrets,
      level: this.__options.level,
      eol: this.__options.eol,
      key,
    };
  }
}
