import { LoggerLevel } from 'egg-logger';

export interface IOptions {
  /**
   * 程序运行关键字
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
   * 需加密字符
   */
  secrets?: string[];
  /**
   * 自定义文件结尾
   */
  eol?: string;
  /**
   * 实例列表
   */
  instanceKeys?: string[];
}
