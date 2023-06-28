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
  async login(token?: string): Promise<void> {
    await command.login(token);
  }

  /**
   * 刷新token
   * @param token 指定 token
   */
  async resetToken() {
    const token = command.getToken();
    await command.resetToken(token);
  }

  /**
   * 获取 token
   * @returns
   */
  getToken(): string {
    return command.getToken();
  }

  /**
   * 发布组件
   * @param codeUri 组件地址，默认为 process.cwd()
   */
  async publish(codeUri?: string) {
    const token = command.getToken();
    await command.publish(token, codeUri || process.cwd());
  }

  /**
   * 获取登陆用户发布的组件
   * @returns
   */
  async list() {
    const token = command.getToken();
    return await command.list(token);
  }

  /**
   * 获取发布的组件的信息
   * @param name 组件名称
   * @returns
   */
  async detail(name: string) {
    return await command.detail(name);
  }

  /**
   * 获取发布的组件的信息
   * @param name 组件名称
   * @returns
   */
  async remove(packageName: string, type: string) {
    if (!packageName || !packageName.includes('@')) {
      throw new Error(
        'Component name and version is required.\nPlease add --name-version, like: --name-version thinphp@0.0.1',
      );
    }
    if (!type || !['Component', 'Application', 'Plugin'].includes(type)) {
      throw new Error(
        'Component type and version is required.\nPlease add --name-version, like: --type Component',
      );
    }

    const token = command.getToken();
    const [name, version] = packageName.split('@');

    await command.remove(token, name, type, version);
  }
}
