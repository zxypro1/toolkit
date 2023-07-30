interface IOptions {
  exitCode?: number;
  prefix?: string;
  tips?: string;
}
class DevsError extends Error {
  readonly CODE = 'DevsError';
  static readonly CODE = 'DevsError';
  exitCode?: number;
  prefix?: string;
  tips?: string;
  constructor(message: string, options: IOptions = {}) {
    super(message);
    this.exitCode = options.exitCode;
    this.prefix = options.prefix;
    this.tips = options.tips;
  }
}

export default DevsError;
