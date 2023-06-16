
class Logger {
  logger: any = console;

  set(logger: any = console) {
    this.logger = logger;
  }
}

export default new Logger();
