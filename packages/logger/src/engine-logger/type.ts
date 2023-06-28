import { ConsoleTransportOptions as _ConsoleTransportOptions, LoggerLevel } from 'egg-logger';

export interface ConsoleTransportOptions extends _ConsoleTransportOptions {
  key: string;
}

export interface IOptions {
  key: string;
  file: string;
  // consoleLogPath: string;
  level?: LoggerLevel;
  secrets?: string[];
  eol?: string;
}
