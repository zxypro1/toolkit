import {
  LoggerLevel,
  ConsoleTransport as _ConsoleTransport,
  LoggerMeta,
} from 'egg-logger';
import chalk from 'chalk';
import { get } from 'lodash';
import { transportSecrets, sliceEggLoggerFormatterTime } from '../utils';
import { ConsoleTransportOptions } from './type';

export default class ConsoleTransport extends _ConsoleTransport {
  constructor(options: ConsoleTransportOptions) {
    const key = options?.key || '';

    super({
      formatter: (meta?: LoggerMeta) => {
        const secrets = get(meta, 'secrets', []);
        const message = get(meta, 'message', '');
        const level = get(meta, 'level', 'INFO') as LoggerLevel;
        const time = sliceEggLoggerFormatterTime(get(meta, 'date', ''));

        let msg = transportSecrets(message, secrets);

        msg = `[${time}][${level}][${key}] ${msg}`;

        if (!chalk.supportsColor) {
          return msg;
        }
          
        if (level === 'ERROR') {
          return chalk.red(msg);
        } else if (level === 'WARN') {
          return chalk.yellow(msg);
        } else if (level === 'DEBUG') {
          return chalk.grey(msg);
        }

        msg = msg.replace(/([0-9]+ms)/g, chalk.green('$1'));
        msg = msg.replace(/(\[[\w\-_.:]+\])/g, chalk.blue('$1'));
        msg = msg.replace(/(GET|POST|PUT|PATH|HEAD|DELETE) /g, chalk.cyan('$1 '));

        return msg;
      },
      level: options.level,
      eol: options.eol,
    });
  }
}
