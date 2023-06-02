// @ts-ignore
import CliProgressFooter from 'cli-progress-footer';
import ee from 'event-emitter';
import { IOptions, IMateValue } from './types';
import defaultOptions from './default-options';

export default class ProgressFooter {
  private progress: CliProgressFooter;
  private intervalId: NodeJS.Timer | undefined;
  private showList: Map<string, IMateValue>;
  private fps: number;
  private openRefresh: boolean;

  public emitter: ee.Emitter;

  /**
   * 自定义渲染内容
   */
  public format: (showList: Map<string, IMateValue>) => string[];

  constructor(options: IOptions = {}) {
    this.progress = CliProgressFooter();
    this.showList = new Map();

    const o = { ...defaultOptions, ...options };
    this.format = o.format;
    this.fps = o.fps;
    this.openRefresh = o.openRefresh;

    // 确保 this 指向
    this.reader = this.reader.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.clear = this.clear.bind(this);
    this.upsert = this.upsert.bind(this);
    this.upsert = this.upsert.bind(this);
    this.removeItem = this.removeItem.bind(this);

    this.emitter = ee();
    this.emitter.on('progress:upsert', this.upsert);
    this.emitter.on('progress:removeItem', this.removeItem);
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
      this.stop();
      return;
    }
    // 存在输出时再处理显示
    const show = this.format(this.showList);
    this.progress.updateProgress(show);
  }

  /**
   * 启动定时渲染
   * @param flag 如果为 true 强制启动
   */
  public start(flag?: boolean): void {
    if (flag || (this.openRefresh && this.showList.size)) {
      this.intervalId = setInterval(this.reader, this.fps);
    }
  }

  /**
   * 暂停定时器
   */
  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * 清理输出：将定时器、事件监听、动态输出都清理掉
   */
  public clear() {
    this.emitter.off('progress:upsert', this.upsert);
    this.emitter.off('progress:removeItem', this.removeItem);
    this.progress.updateProgress();
    this.showList.clear();
    this.stop();
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

    // 新增输入时，如果不存在定时器则开启定时器
    if (!this.intervalId && this.openRefresh) {
      this.intervalId = setInterval(this.reader, this.fps);
    }
  }

  /**
   * 删除指定ID的动态输出
   * @param id 
   */
  public removeItem(id: string) {
    this.showList.delete(id);
  }
}
