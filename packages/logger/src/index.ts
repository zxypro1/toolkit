import {
  Logger,
  Transport,
  LoggerLevel,
  EggLoggerOptions,
} from 'egg-logger';
import { IProps } from './type';
import { mark, formatter } from './utils';
import { ConsoleTransport, FileTransport } from './transport';
import { set } from 'lodash';
import os from 'os';

export default class EngineLogger extends Logger {
  private eol: string;
  progress?: any;

  // private props: IProps;
  constructor(props?: IProps) {
    super({} as EggLoggerOptions);

    const { file, level = 'INFO', secrets, eol = os.EOL } = props || {};
    this.eol = eol;

    const consoleTransport = new ConsoleTransport({
      secrets,
      level,
      eol,
    });

    this.set('console', consoleTransport);

    if (file) {
      const fileTransport = new FileTransport({
        secrets,
        file,
        eol,
        level: props?.level || 'DEBUG',
      });
      this.set('file', fileTransport);
    }
  }

  /**
   * 用于文件流持续输出，例如：mvn命令在linux下通过文件流有换行异常
   * @param args 
   * @param level 
   */
  append(args: string, level: LoggerLevel = 'INFO') {
    // 将行尾符修改为 ''
    this.setEol('');

    // @ts-ignore: 输出
    super.log(level, [args]);

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

export {
  Logger,
  Transport,
  ConsoleTransport,
  FileTransport,
  LoggerLevel,
  formatter,
  mark,
};
