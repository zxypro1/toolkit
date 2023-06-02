import { FileTransport, ConsoleTransport } from 'egg-logger';
import {
  MyConsoleTransportOptions,
  MyFileTransportOptions,
  IMeta,
} from './type';
import { formatter } from './utils';

class _ConsoleTransport extends ConsoleTransport {
  constructor(options: MyConsoleTransportOptions) {
    super({
      formatter: (data: object | undefined) => formatter({ ...(data as IMeta), secrets: options.secrets }),
      ...options,
    });
  }
}

class _FileTransport extends FileTransport {
  constructor(options: MyFileTransportOptions) {
    super({
      formatter: (data: object | undefined) => formatter({ ...(data as IMeta), secrets: options.secrets }),
      ...options,
    });
  }
}

export {
  _ConsoleTransport as ConsoleTransport,
  _FileTransport as FileTransport,
}
