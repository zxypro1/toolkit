
export interface IOptions {
  /**
   * 开启刷新
   * 
   * @default true
   */
  openRefresh?: boolean;
  /**
   * 刷新的频率，ms 为单位
   * 
   * @default 100
   */
  fps?: number;
  /**
   * 自定义格式化输出
   */
  format?: (showList: Map<string, IMateValue>) => string[];
}

export interface IMateValue {
  message: string;
  timer: number;
}
