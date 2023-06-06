import {
  FileTransportOptions as _FileTransportOptions,
  ConsoleTransportOptions as _ConsoleTransportOptions,
  LoggerLevel,
} from 'egg-logger';

export interface FileTransportOptions extends _FileTransportOptions {
  secrets?: string[];
}

export interface ConsoleTransportOptions extends _ConsoleTransportOptions {
  key: string;
  secrets?: string[];
}

export interface IOptions {
  key: string;
  file: string;
  // consoleLogPath: string;
  level?: LoggerLevel;
  secrets?: string[];
  eol?: string;
}
