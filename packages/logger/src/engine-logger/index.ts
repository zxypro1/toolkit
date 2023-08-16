import { Logger, LoggerLevel, EggLoggerOptions } from 'egg-logger';
import { getGlobalConfig } from '@serverless-devs/utils';
import { set, get } from 'lodash';
import prettyjson, { RendererOptions } from 'prettyjson';
import os from 'os';
import ConsoleTransport from './console-transport';
import FileTransport from './file-transport';
import { transport } from './utils';
import { IOptions } from './type';
import chalk from 'chalk';

export default class EngineLogger extends Logger {
  private eol: string;

  constructor(props: IOptions) {
    super({} as EggLoggerOptions);

    const secrets = get(props, 'secrets', []);
    transport.setSecret(secrets);

    const key = get(props, 'key');
    const file = get(props, 'file');
    // const consoleLogPath = get(props, 'consoleLogPath');
    const eol = get(props, 'eol', os.EOL);
    const level = process.env.NODE_CONSOLE_LOGGRE_LEVEL as LoggerLevel;

    this.eol = eol;

    const consoleTransport = new ConsoleTransport({
      level: level || get(props, 'level', 'INFO'),
      eol,
      // file: consoleLogPath,
      key,
    });
    this.set('console', consoleTransport);

    if (getGlobalConfig('log') !== 'disable') {
      const fileTransport = new FileTransport({
        level: level || get(props, 'level', 'DEBUG'),
        file,
        eol,
      });
      this.set('file', fileTransport);
    }
  }

  /**
   * 用于文件流持续输出，例如：mvn命令在linux下通过文件流有换行异常
   * @param message 输入日志
   * @param level 输出的级别，默认 INFO
   */
  append(message: string, level: LoggerLevel = 'NONE') {
    // 将行尾符修改为 ''
    this.setEol('');
    this.write(message);
    // 修改为初始实例时的行尾
    this.setEol(this.eol);
  }

  output(content: Record<string, any>, indent?: number, options?: RendererOptions) {
    const message = prettyjson.render(
      content,
      { keysColor: 'bold', emptyArrayMsg: '[]', ...options },
      indent,
    );
    this.write(message);
  }
  // TODO: 仅提示但不报错
  tips(message: string, tips?: string) {
    let msg = `\n${chalk.hex('#000').bgYellow('WARNING:')}\n\n${message}\n`;
    if (tips) {
      msg += `\n${chalk.gray(tips)}\n`;
    }
    this.write(msg);
  }

  write(msg: string) {
    super.write(transport.transportSecrets(msg));
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
