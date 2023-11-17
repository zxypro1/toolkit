import { set } from 'lodash';

export enum ETrackerType {
  parseException = 'parseException',
  runtimeException = 'runtimeException',
}

type ITrackerType = `${ETrackerType}`;
interface IOptions {
  exitCode?: number;
  prefix?: string;
  tips?: string;
  data?: {
    RequestID: string;
    Code: string;
    Message: string;
    statusCode: number;
  };
  stack?: string;
  trackerType?: ITrackerType;
}
class DevsError extends Error {
  readonly CODE = 'DevsError';
  static readonly CODE = 'DevsError';
  exitCode?: number;
  prefix?: string;
  tips?: string;
  data?: {
    RequestID: string;
    Code: string;
    Message: string;
    statusCode: number;
  };
  stack?: string;
  trackerType?: ITrackerType;
  constructor(message: string, options: IOptions = {}) {
    super(message);
    for (const key in options) {
      const k = key as keyof IOptions;
      set(this, k, options[k]);
    }
  }
}

export default DevsError;
