import { each, unset } from 'lodash';
import path from 'path';
import { IOptions } from './type';
import EngineLogger from './engine-logger';
import ProgressFooter from './progress-footer';
import { transport } from './utils';
import * as stdoutFormatter from './stdout-formatter';

export { default as EngineLogger } from './engine-logger';
export { default as ProgressFooter } from './progress-footer';

export interface ILoggerInstance extends EngineLogger {
  spin: (
    type: 'getting' | 'setting' | 'creating' | 'updating' | 'removing' | 'checking' | 'got' | 'set' | 'created' | 'updated' | 'removed' | 'checked' | 'using' | 'retrying',
    ...rest: any[]
  ) => void;
  progress: (message: string) => void;
  tips: (message: string, tips?: string) => void;
}

/**
 * 最高权限密钥获取
 * 文档书写
 * 测试书写
 */
export default class Logger extends Map<string, ILoggerInstance> {
  readonly CODE = 'DevsLogger';
  static readonly CODE = 'DevsLogger';
  private __options: IOptions;
  __progressFooter: ProgressFooter;

  constructor(options: IOptions) {
    super();
    this.__options = options;
    this.__progressFooter = new ProgressFooter();

    if (options?.instanceKeys) {
      each(options.instanceKeys, (value: string) => {
        this.__generate(value);
      });
    }
  }

  __generate = (instanceKey: string) => {
    if (super.has(instanceKey)) {
      return super.get(instanceKey) as ILoggerInstance;
    }
    const logger = new EngineLogger(this.__getEggLoggerConfig(instanceKey)) as ILoggerInstance;

    logger.progress = (message: string) => {
      logger.debug(message);
      this.__progressFooter.upsert(instanceKey, message);
    };

    logger.spin = (type: keyof typeof stdoutFormatter, ...rest: any[]) => {
      const formatFunction = stdoutFormatter[type];
      let message = rest.join('');
      if (typeof formatFunction === 'function') {
        // @ts-ignore
        message = formatFunction(...rest);
      }
      logger.debug(message);
      this.__progressFooter.upsert(instanceKey, transport.transportSecrets(message));
    };

    super.set(instanceKey, logger);
    return logger;
  };

  __unset = (instanceKey: string) => {
    unset(this, instanceKey);
    this.__progressFooter.removeItem(instanceKey);
  };

  __clear = () => {
    this.__progressFooter.clear();
  };

  __setSecret = (secret: string[]) => {
    transport.setSecret(secret);
  };

  private __getEggLoggerConfig = (key: string) => {
    return {
      file: path.join(this.__options.logDir, this.__options.traceId, `${key}.log`),
      secrets: this.__options.secrets,
      level: this.__options.level,
      eol: this.__options.eol,
      key,
    };
  };
}
