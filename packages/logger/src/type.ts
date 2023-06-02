import {
  LoggerLevel,
  ConsoleTransportOptions,
  FileTransportOptions,
} from 'egg-logger';

export interface IMeta {
  date: string;
  message: string;
  level?: LoggerLevel;
  secrets?: string[];
}

export interface MyConsoleTransportOptions extends ConsoleTransportOptions {
  secrets?: string[];
}

export interface MyFileTransportOptions extends FileTransportOptions {
  secrets?: string[];
}

export interface IProps {
  file?: string;
  level?: LoggerLevel;
  secrets?: string[];
  eol?: string; // 文件结尾
}