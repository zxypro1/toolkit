
import fs from 'fs-extra';
import { buildComponentInstance, getProvider, getZipballUrl, getComponentCachePath, getLockFile } from './utils';
import download from '@serverless-devs/downloads';
const debug = require('@serverless-cd/debug')('serverless-devs:load-component');

class Componet {
  constructor(private name: string, private params?: Record<string, any>) { }
  async run() {
    // 本地路径
    if (fs.existsSync(this.name)) {
      return await buildComponentInstance(this.name, this.params);
    }
    return await this.getComponent();
  }
  // devs源
  async getComponent() {
    const [provider, componentName, componentVersion] = getProvider(this.name);
    debug(`provider: ${provider}, componentName: ${componentName}, componentVersion: ${componentVersion}`);
    const zipballUrl = await getZipballUrl(provider, componentName, componentVersion);
    debug(`zipballUrl: ${zipballUrl}`);
    const componentCachePath = getComponentCachePath(provider, componentName, componentVersion);
    debug(`componentCachePath: ${componentCachePath}`);
    const lockPath = getLockFile(componentCachePath);
    if (fs.existsSync(lockPath)) return await buildComponentInstance(componentCachePath, this.params);
    await download(zipballUrl, {
      dest: componentCachePath,
      filename: componentVersion ? `${provider}_${componentName}@${componentVersion}.zip` : `${provider}_${componentName}.zip`,
      extract: true,
      strip: 1,
    })
    fs.writeFileSync(lockPath, JSON.stringify({ version: componentVersion }, null, 2));
    return await buildComponentInstance(componentCachePath, this.params);
  }
}

const loadComponent = async (name: string, params?: Record<string, any>) => {
  return await new Componet(name, params).run();
};

export default loadComponent;
