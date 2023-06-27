import Logger from './logger';
import * as command from './command';

export default class Registry {
  logger: any;

  constructor({ logger = console }) {
    this.logger = Logger.set(logger);
  }

  async login(token?: string): Promise<void>{
    await command.login(token);
  }

  async resetToken() {
    const token = await command.getToken();
    await command.resetToken(token);
  }

  getToken() {
    return command.getToken();
  }
}
