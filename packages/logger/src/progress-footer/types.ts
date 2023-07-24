export interface IPropsOptions {
  format?: (data: IterableIterator<[string, IMateValue]>) => string[];
}

export interface IMateValue {
  message: string;
  timer: number;
}
