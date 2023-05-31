import ProgressBar from 'progress';
import { green, white } from 'chalk';
import { ProgressBarOptions } from './types';

export enum ProgressType {
  Bar,
  Loading,
}

const DEFAULT_BAR_FORMAT = `Loading ${green(
  ':loading'
)} ((:bar)) :current/:total(Bytes) :percent :etas`;
const DEFAULT_LOADING_FORMAT = `Loading ${green(':loading')} ((:bar)) :etas`;

export default class ProgressService {
  private bar: ProgressBar;
  private readonly progressType: ProgressType;

  /**
   * @param type, Bar: a progress bar with total size known, Loading: a loading style with unknown total size
   * @param format, format of progress bar
   * @param options, options of progress bar, with type Loading, just set {width:50, total:100}
   */
  constructor(
    protected readonly type: ProgressType,
    protected readonly options?: ProgressBarOptions,
    format?: string,
  ) {
    if (type === ProgressType.Loading) {
      if (!options) {
        // @ts-ignore
        options = {};
      }
      if (!options?.total) {
        // @ts-ignore
        options.total = 100;
      }
    }
    const opts = ProgressService.initProgressBarOptions(type, options as ProgressBarOptions);
    const fmt = ProgressService.initFormat(type, format);
    this.progressType = type;

    const pb = new ProgressBar(fmt, opts);
    const loadingChars = ['⣴', '⣆', '⢻', '⢪', '⢫'];
    // set tick callback with loading chars
    const oldTick = pb.tick;
    // @ts-ignore
    pb.tick = (len, tokens) => {
      const newTokens = Object.assign(
        {
          loading: loadingChars[parseInt(String(Math.random() * 5))],
        },
        tokens,
      );
      // console.log(newTokens);
      oldTick.call(pb, len, newTokens);
    };
    this.bar = pb;
  }

  private static initFormat(type: ProgressType, format: string | undefined): string {
    if (!format) {
      if (type === ProgressType.Bar) {
        format = DEFAULT_BAR_FORMAT;
      } else if (type === ProgressType.Loading) {
        format = DEFAULT_LOADING_FORMAT;
      }
    }

    return format as string;
  }

  private static initProgressBarOptions(
    type: ProgressType,
    options: ProgressBarOptions,
  ): ProgressBarOptions {
    if (!options.width) {
      options.width = 30;
    }
    if (!options.complete) {
      options.complete = green('█');
    }

    if (!options.incomplete) {
      if (type === ProgressType.Loading) {
        options.incomplete = '░';
      } else {
        options.incomplete = white('░');
      }
    }
    if (!options.clear) {
      options.clear = true;
    }
    return options;
  }

  /**
   * update progress status
   * @param currentTransferred, when progress type is bar, increase progress ticks with
   */
  update(currentTransferred: number): void {
    if (this.progressType === ProgressType.Bar) {
      const increment = currentTransferred - this.bar.curr;
      this.bar.tick(increment);
    } else if (this.progressType === ProgressType.Loading) {
      this.bar.tick(currentTransferred || 0);
    }
  }

  terminate(): void {
    this.bar.terminate();
  }

  complete(): boolean {
    return this.bar.complete;
  }

  curr(): number {
    return this.bar.curr;
  }

  total(): number {
    return this.bar.total;
  }

  /**
   * "interrupt" the progress bar and write a message above it.
   */
  interrupt(message: string): void {
    this.bar.interrupt(message || '');
  }
}
