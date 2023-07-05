interface IOptions {
  exitCode?: number;
  prefix?: string;
  tips?: string;
}
class TipsError extends Error {
  readonly CODE = 'TIPS';
  static readonly CODE = 'TIPS';
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

export default TipsError;
