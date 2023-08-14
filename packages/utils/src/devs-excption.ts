interface IOptions {
  exitCode?: number;
  title?: string;
  tips?: string;
}

class BaseException extends Error {
  exitCode?: number;
  title?: string;
  tips?: string;
  constructor(message: string, options: IOptions = {}) {
    super(message);
    this.exitCode = options.exitCode;
    this.title = options.title;
    this.tips = options.tips;
  }
}

class DevsException extends BaseException {
  readonly CODE = 'DevsError';
  static readonly CODE = 'DevsError';
}

// TODO：暂时先注释
// class ApiException extends BaseException {
//     readonly CODE = 'ApiException';
//     static readonly CODE = 'ApiException';
//     constructor(message: string, options: {
//         code: string,
//         requestId?: string,
//     }) {
//         super(message);
//         this.title = options.title;
//         this.tips = options.tips;
//     }
// }
