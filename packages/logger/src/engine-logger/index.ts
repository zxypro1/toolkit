import {
  Logger,
  LoggerLevel,
  EggLoggerOptions,
} from 'egg-logger';
import { set, get } from 'lodash';
import ConsoleTransport from './console-transport';
import FileTransport from './file-transport';
import os from 'os';
import { IOptions } from './type';


export default class EngineLogger extends Logger {
  private eol: string;

  constructor(props: IOptions) {
    super({} as EggLoggerOptions);

    const key = get(props, 'key');
    const file = get(props, 'file');
    // const consoleLogPath = get(props, 'consoleLogPath');
    const secrets = get(props, 'secrets', []);
    const eol = get(props, 'eol', os.EOL);
    const level = process.env.NODE_CONSOLE_LOGGRE_LEVEL as LoggerLevel;

    this.eol = eol;

    const consoleTransport = new ConsoleTransport({
      level: level || get(props, 'level', 'INFO'),
      eol,
      // file: consoleLogPath,
      key,
      secrets,
    });
    this.set('console', consoleTransport);

    const fileTransport = new FileTransport({
      level: level || get(props, 'level', 'DEBUG'),
      secrets,
      file,
      eol,
    });
    this.set('file', fileTransport);
  }

  /**
   * 用于文件流持续输出，例如：mvn命令在linux下通过文件流有换行异常
   * @param message 输入日志
   * @param level 输出的级别，默认 INFO
   */
  append(message: string, level: LoggerLevel = 'INFO') {
    // 将行尾符修改为 ''
    this.setEol('');

    // @ts-ignore: 输出
    super.log(level, [message]);

    // 修改为初始实例时的行尾
    this.setEol(this.eol);
  }

  private setEol(eol: string = os.EOL) {
    const c = this.get('console') as object;
    const f = this.get('file');
    
    set(c, 'options.eol', eol);
    if (f) {
      set(f, 'options.eol', eol);
    }
  }
}
