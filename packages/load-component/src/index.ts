import fs from 'fs-extra';
import {
  buildComponentInstance,
  getProvider,
  getZipballUrl,
  getComponentCachePath,
  getLockFile,
} from './utils';
import download from '@serverless-devs/downloads';
import { get, replace } from 'lodash';
import { getGlobalConfig, registry } from '@serverless-devs/utils';
import { BASE_URL, PROVIDER } from './constant';
const debug = require('@serverless-cd/debug')('serverless-devs:load-component');

class Componet {
  constructor(private name: string, private params: Record<string, any> = {}) {}
  async run() {
    if (!this.name) return;
    // 本地路径
    if (fs.existsSync(this.name)) {
      return await buildComponentInstance(this.name, this.params);
    }
    return await this.getDevComponent();
    const isDev = getGlobalConfig('registry') === BASE_URL;
    return isDev ? await this.getDevComponent() : await this.getOtherComponent();
  }
  // devs源
  async getDevComponent() {
    const [componentName, componentVersion] = getProvider(this.name);
    debug(`componentName: ${componentName}, componentVersion: ${componentVersion}`);
    const componentCachePath = getComponentCachePath(componentName, componentVersion);
    debug(`componentCachePath: ${componentCachePath}`);
    const lockPath = getLockFile(componentCachePath);
    if (fs.existsSync(lockPath)) {
      return await buildComponentInstance(componentCachePath, this.params);
    }
    const zipballUrl = await getZipballUrl(componentName, componentVersion);
    debug(`zipballUrl: ${zipballUrl}`);
    await download(zipballUrl, {
      logger: get(this.params, 'engineLogger', get(this.params, 'logger')),
      dest: componentCachePath,
      filename: `${componentName}${componentVersion ? `@${componentVersion}` : ''}.zip`,
      extract: true,
      headers: registry.getSignHeaders(),
    });
    fs.writeFileSync(lockPath, JSON.stringify({ version: componentVersion }, null, 2));
    return await buildComponentInstance(componentCachePath, this.params);
  }
  async getOtherComponent() {
    throw new Error('not support');
  }
}

const loadComponent = async (name: string, params?: Record<string, any>) => {
  return await new Componet(name, params).run();
};

export default loadComponent;
