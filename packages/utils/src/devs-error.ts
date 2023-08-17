import { set } from 'lodash';
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
}
class DevsError extends Error {
  readonly CODE = 'DevsError';
  static readonly CODE = 'DevsError';
  constructor(message: string, options: IOptions = {}) {
    super(message);
    for (const key in options) {
      const k = key as keyof IOptions;
      set(this, k, options[k]);
    }
  }
}

export default DevsError;
