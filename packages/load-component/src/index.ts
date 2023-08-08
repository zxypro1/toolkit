import fs from 'fs-extra';
import {
  buildComponentInstance,
  getProvider,
  getZipballUrl,
  getComponentCachePath,
  getLockFile,
} from './utils';
import download from '@serverless-devs/downloads';
import { get } from 'lodash';
import { readJson, registry } from '@serverless-devs/utils';
import assert from 'assert';
import semver from 'semver';
const debug = require('@serverless-cd/debug')('serverless-devs:load-component');

export class Component {
  constructor(private name: string, private params: Record<string, any> = {}) {
    assert(name, 'component name is required');
   }
  async run() {
    // 本地路径
    if (fs.existsSync(this.name)) {
      return await buildComponentInstance(this.name, this.params);
    }
    return await this.getDevComponent();
  }
  async update() {
    const [componentName, componentVersion] = getProvider(this.name);
    debug(`componentName: ${componentName}, componentVersion: ${componentVersion}`);
    const componentCachePath = getComponentCachePath(componentName, componentVersion);
    debug(`componentCachePath: ${componentCachePath}`);
    const lockPath = getLockFile(componentCachePath);
    const lockInfo = readJson(lockPath);
    const { zipballUrl, version } = await getZipballUrl(componentName, componentVersion);
    if (semver.lte(version, lockInfo.version)) {
      return fs.writeFileSync(lockPath, JSON.stringify({ version: lockInfo.version, lastUpdateCheck: Date.now() }));
    }
    await download(zipballUrl, {
      dest: componentCachePath,
      filename: `${componentName}${componentVersion ? `@${componentVersion}` : ''}`,
      extract: true,
      headers: registry.getSignHeaders({ ignoreError: true }),
    });
    fs.writeFileSync(lockPath, JSON.stringify({ version, lastUpdateCheck: Date.now() }));
  }

  // devs源
  private async getDevComponent() {
    const [componentName, componentVersion] = getProvider(this.name);
    debug(`componentName: ${componentName}, componentVersion: ${componentVersion}`);
    const componentCachePath = getComponentCachePath(componentName, componentVersion);
    debug(`componentCachePath: ${componentCachePath}`);
    const lockPath = getLockFile(componentCachePath);
    if (fs.existsSync(lockPath)) {
      return await buildComponentInstance(componentCachePath, this.params);
    }
    const { zipballUrl, version } = await getZipballUrl(componentName, componentVersion);
    debug(`zipballUrl: ${zipballUrl}`);
    await download(zipballUrl, {
      logger: get(this.params, 'engineLogger', get(this.params, 'logger')),
      dest: componentCachePath,
      filename: `${componentName}${componentVersion ? `@${componentVersion}` : ''}`,
      extract: true,
      headers: registry.getSignHeaders({ ignoreError: true }),
    });
    fs.writeFileSync(lockPath, JSON.stringify({ version, lastUpdateCheck: Date.now() }));
    return await buildComponentInstance(componentCachePath, this.params);
  }
}

const loadComponent = async (name: string, params?: Record<string, any>) => {
  return await new Component(name, params).run();
};

export default loadComponent;
