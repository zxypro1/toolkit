import {
  FileTransportOptions as _FileTransportOptions,
  LoggerLevel,
} from 'egg-logger';

export interface FileTransportOptions extends _FileTransportOptions {
  secrets?: string[];
}

export interface ConsoleTransportOptions extends FileTransportOptions {
  key: string;
}

export interface IOptions {
  key: string;
  file: string;
  consoleLogPath: string;
  level?: LoggerLevel;
  secrets?: string[];
  eol?: string;
}
