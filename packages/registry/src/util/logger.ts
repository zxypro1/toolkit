class Logger {
  protected logger: any = console;

  set(logger: any) {
    this.logger = logger || console;
    return this.logger;
  }

  log(...args: any[]): void {
    this.logger.log(...args);
  }

  write(...args: any[]): void {
    this.logger.write(...args);
  }

  debug(...args: any[]): void {
    this.logger.debug(...args);
  }

  info(...args: any[]): void {
    this.logger.info(...args);
  }

  error(...args: any[]): void {
    this.logger.error(...args);
  }

  warn(...args: any[]): void {
    this.logger.warn(...args);
  }
}

export default new Logger();
