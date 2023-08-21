import { IPropsOptions, IMateValue } from './types';
import { blackBright, greenBright } from 'chalk';
const CliProgressFooter = require('cli-progress-footer');

export default class ProgressFooter extends Map<string, IMateValue> {
  private progress: typeof CliProgressFooter;
  constructor(private options: IPropsOptions = {}) {
    super();
    this.progress = CliProgressFooter();
    this.options.format = typeof options.format === 'function' ? options.format : this.defaultFormat;
  }

  /**
   * 渲染方法
   */
  public reader = () => {
    if (this.size === 0) {
      this.progress.updateProgress();
      return;
    }
    // 存在输出时再处理显示
    const show = this.options.format?.(this.entries());
    this.progress.updateProgress(show);
  };
  private defaultFormat = (data: IterableIterator<[string, IMateValue]>) => {
    const show: string[] = [];
    for (const [key, value] of data) {
      const { message } = value;
      const showMessage = `${blackBright(key)} \n ${greenBright(message)}`;
      show.push(showMessage);
    }
    return show;
  };
  /**
   * 清理输出：将定时器、事件监听、动态输出都清理掉
   */
  public clear = () => {
    this.progress.updateProgress();
    // 避免循环引用
    super.clear();
  };

  /**
   * 更新或者插入一条动态输出
   * @param id
   * @param message
   */
  public upsert = (id: string, message: string) => {
    if (this.has(id)) {
      const config = this.get(id) as IMateValue;
      this.set(id, {
        ...config,
        message,
      });
    } else {
      this.set(id, {
        timer: new Date().getTime(),
        message,
      });
    }
    this.reader();
  };

  /**
   * 删除指定ID的动态输出
   * @param id
   */
  public removeItem = (id: string) => {
    this.delete(id);
  };
}
