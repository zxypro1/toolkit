import {
  FileTransport as _FileTransport,
  LoggerMeta,
} from 'egg-logger';
import { get } from 'lodash';
import { transportSecrets, sliceEggLoggerFormatterTime } from '../utils';
import { FileTransportOptions } from './type';


export default class FileTransport extends _FileTransport {
  constructor(options: FileTransportOptions) {
    super({
      formatter: (meta?: LoggerMeta) => {
        const secrets = get(meta, 'secrets', []);
        const message = get(meta, 'message', '');
        const level = get(meta, 'level', 'INFO');
        const time = sliceEggLoggerFormatterTime(get(meta, 'date', ''));

        const msg = transportSecrets(message, secrets);

        return `[${time}][${level}] ${msg}`;
      },
      level: 'DEBUG',
      ...options,
    });
  }
}
