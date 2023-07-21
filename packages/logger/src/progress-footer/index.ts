import { IPropsOptions, IMateValue, IShowList } from './types';
import defaultOptions from './default-options';
const CliProgressFooter = require('cli-progress-footer');

export default class ProgressFooter {
  private progress: typeof CliProgressFooter;
  private showList: IShowList;
  private format: (showList: IShowList) => string[];

  constructor(options: IPropsOptions = {}) {
    this.progress = CliProgressFooter();
    this.showList = new Map();

    const o = { ...defaultOptions, ...options };
    this.format = o.format;

    // 确保 this 指向
    this.reader = this.reader.bind(this);
    this.clear = this.clear.bind(this);
    this.upsert = this.upsert.bind(this);
    this.removeItem = this.removeItem.bind(this);
  }

  public getKeys() {
    return this.showList.keys();
  }

  /**
   * 渲染方法
   */
  public reader() {
    // 如果不存在输出时，清空定时器
    if (this.showList.size === 0) {
      this.progress.updateProgress();
      return;
    }
    // 存在输出时再处理显示
    const show = this.format(this.showList);
    this.progress.updateProgress(show);
  }


  /**
   * 清理输出：将定时器、事件监听、动态输出都清理掉
   */
  public clear() {
    this.progress.updateProgress();
    this.showList.clear();
  }

  /**
   * 更新或者插入一条动态输出
   * @param id
   * @param message
   */
  public upsert(id: string, message: string) {
    if (this.showList.has(id)) {
      const config = this.showList.get(id) as IMateValue;
      this.showList.set(id, {
        ...config,
        message,
      });
    } else {
      this.showList.set(id, {
        timer: new Date().getTime(),
        message,
      });
    }

    this.reader();
  }

  /**
   * 删除指定ID的动态输出
   * @param id
   */
  public removeItem(id: string) {
    this.showList.delete(id);
  }
}
