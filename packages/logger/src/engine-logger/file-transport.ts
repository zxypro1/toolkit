import { FileTransport as _FileTransport, LoggerMeta, FileTransportOptions } from 'egg-logger';
import { get } from 'lodash';
import { transport, sliceEggLoggerFormatterTime } from '../utils';

export default class FileTransport extends _FileTransport {
  constructor(options: FileTransportOptions) {
    super({
      formatter: (meta?: LoggerMeta) => {
        const message = get(meta, 'message', '');
        const level = get(meta, 'level', 'INFO');
        const time = sliceEggLoggerFormatterTime(get(meta, 'date', ''));

        const msg = transport.transportSecrets(message);

        return `[${time}][${level}] ${msg}`;
      },
      level: 'DEBUG',
      ...options,
    });
  }
}
