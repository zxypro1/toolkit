import cliSpinners from 'cli-spinners';

type ISpinner = cliSpinners.SpinnerName | cliSpinners.Spinner;

export type IShowList = Map<string, IMateValue>;

export interface IFormatOptions {
  /**
   * 动态配置
   */
  frames: string[];
}

export interface IPropsOptions {
  /**
   * 开启刷新
   * 
   * @default true
   */
  openRefresh?: boolean;
  /**
   * 动态效果
   */
  spinner?: ISpinner;
  /**
   * 自定义格式化输出
   */
  format?: (showList: IShowList) => string[];
}

export interface IMateValue {
  message: string;
  timer: number;
}
