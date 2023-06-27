import Logger from './logger';
import * as command from './command';

export default class Registry {
  logger: any;

  constructor({ logger = console }) {
    this.logger = Logger.set(logger);
  }

  /**
   * 设置 token
   * @param token 指定 token
   */
  async login(token?: string): Promise<void>{
    await command.login(token);
  }

  /**
   * 刷新token
   * @param token 指定 token
   */
  async resetToken() {
    const token = await command.getToken();
    await command.resetToken(token);
  }

  /**
   * 获取 token
   * @returns 
   */
  getToken(): string {
    return command.getToken();
  }

  async publish(codeUri?: string) {
    const token = await command.getToken();
    await command.publish(token, codeUri || process.cwd());
  }
}
