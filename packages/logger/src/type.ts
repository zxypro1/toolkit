import { LoggerLevel } from 'egg-logger';

export interface IOptions {
  /**
   * 目录输出目录
   */
  traceId: string;
  /**
   * 目录输出目录
   */
  logDir: string;
  /**
   * 终端日志输出级别
   */
  level?: LoggerLevel;
  /**
   * 控制台日志输出级别
   */
  secrets?: string[];
  /**
   * 自定义文件结尾
   */
  eol?: string;
}
