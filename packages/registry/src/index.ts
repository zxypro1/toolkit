import Logger from './util/logger';
import * as actions from './actions';
import { registry } from '@serverless-devs/utils';

export default class Registry {
  logger: any;

  constructor({ logger }: any = {}) {
    this.logger = Logger.set(logger);
  }

  /**
   * 设置 token
   * @param token 指定 token
   */
  async login(token?: string): Promise<void> {
    await actions.login(token);
  }

  /**
   * 刷新token
   * @param token 指定 token
   */
  async resetToken() {
    await actions.resetToken();
  }

  /**
   * 获取 token
   * @returns
   */
  getToken(): string {
    return registry.getToken();
  }

  /**
   * 发布组件
   * @param codeUri 组件地址，默认为 process.cwd()
   */
  async publish(codeUri?: string) {
    await actions.publish(codeUri || process.cwd());
  }

  /**
   * 获取登陆用户发布的组件
   * @returns
   */
  async list(options?: actions.IList) {
    return await actions.list(options);
  }

  /**
   * 获取发布的组件的信息
   * @param name 组件名称
   * @returns
   */
  async detail(name: string, page?: string) {
    if (!name) {
      throw new Error(`${name} not specified in actions`);
    }
    return await actions.detail(name, page);
  }

  async packageDetail(name: string, versionId?: string) {
    if (!name) {
      throw new Error(`${name} not specified in actions`);
    }
    return await actions.packageDetail(name, versionId);
  }

  /**
   * 获取发布的组件的信息
   * @param name 组件名称
   * @returns
   */
  async remove(name: string, versionId: string) {
    if (!name || !versionId) {
      throw new Error(
        'Component name and version is required. like: --name think --version-id 0.0.1',
      );
    }

    await actions.remove(name, versionId);
  }
}
