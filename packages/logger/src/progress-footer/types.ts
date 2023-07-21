

export type IShowList = Map<string, IMateValue>;

export interface IFormatOptions {
  /**
   * 动态配置
   */
  frames: string[];
}

export interface IPropsOptions {
  format?: (showList: IShowList) => string[];
}

export interface IMateValue {
  message: string;
  timer: number;
}
