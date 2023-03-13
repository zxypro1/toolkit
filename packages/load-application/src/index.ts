import path from 'path';
import fs from 'fs-extra';
import fetch from 'node-fetch';
import download from '@serverless-devs/downloads';
import artTemplate from 'art-template';
import { isEmpty, includes, split, get, find, has, set } from 'lodash';
import parse from './parse';
import { IProvider, IOptions } from './types';
import { REGISTRY } from './constants';
import { getYamlPath, getYamlContent } from './utils';

class LoadApplication {
  private provider: IProvider.DEVSAPP;
  /**
   * 组件名称
   */
  private name: string;
  /**
   * 组件版本
   */
  private version: string;
  /**
   * 文件保存的路径
   */
  private filePath: string;
  /**
   * 临时文件夹路径
   */
  private tempPath: string;
  /**
   * publish.yaml 里的数据
   */
  private publishData!: Record<string, any>;
  /**
   * s.yaml 的路径
   */
  private spath!: string;
  constructor(private template: string, private options: IOptions = {}) {
    this.options.dest = this.options.dest || process.cwd();
    this.options.logger = this.options.logger || console;
    this.options.access = this.options.access || 'default';
    this.validate();
    const { provider, name, version } = this.format();
    this.provider = provider as IProvider.DEVSAPP;
    this.name = name;
    this.version = version;
    this.options.projectName = this.options.projectName || name;
    this.filePath = path.join(this.options.dest, this.options.projectName);
    this.tempPath = `${this.filePath}_${Date.now()}`;
  }
  private validate() {
    if (isEmpty(this.template)) {
      throw new Error('template is required');
    }
  }
  private formatProvider() {
    const useProvider = includes(this.template, '/');
    if (useProvider) {
      const [provider, componentName] = split(this.template, '/');
      return {
        provider,
        componentName,
      };
    }
    return {
      provider: IProvider.DEVSAPP,
      componentName: this.template,
    };
  }
  private format() {
    const { provider, componentName } = this.formatProvider();
    if (provider !== IProvider.DEVSAPP) {
      throw new Error(`provider ${provider} is not supported, only support ${IProvider.DEVSAPP}`);
    }
    const [name, version] = split(componentName, '@');
    return {
      provider,
      name,
      version,
    };
  }
  async run(): Promise<string> {
    /**
     * 1. 下载模板
     */
    await this.doLoad();
    /**
     * 2. 执行 preInit 钩子
     */
    await this.preInit();
    /**
     * 3. 解析 publish.yaml
     */
    await this.parsePublishYaml();
    /**
     * 4. 执行 postInit 钩子
     */
    const postData = await this.postInit();
    /**
     * 5. 解析 s.yaml
     */
    const templateData = await this.parseTemplateYaml(postData);
    /**
     * 6. 解析 s.yaml里的 name 字段
     */
    this.parseAppName(templateData);
    /**
     * 7. 最后的动作, 比如：删除临时文件夹
     */
    await this.final();
    return this.filePath;
  }

  private async final() {
    fs.removeSync(this.tempPath);
  }

  private parseAppName(data: string) {
    const { appName } = this.options;
    if (isEmpty(appName)) return;
    const newData = parse({ appName }, data);
    fs.writeFileSync(this.spath, newData, 'utf-8');
  }

  private async parseTemplateYaml(data: Record<string, any>) {
    const newData = {
      ...this.publishData,
      ...data,
      access: this.options.access,
    };
    return this.doArtTemplate(this.spath, newData);
  }
  private doArtTemplate(filePath: string, data: Record<string, any>) {
    artTemplate.defaults.extname = path.extname(filePath);
    set(artTemplate.defaults, 'escape', false);
    const filterFilePath = path.join(this.tempPath, 'hook', 'filter.js');
    if (fs.existsSync(filterFilePath)) {
      const filterHook = require(filterFilePath);
      for (const key in filterHook) {
        artTemplate.defaults.imports[key] = filterHook[key];
      }
    }
    const newData = artTemplate(filePath, data);
    fs.writeFileSync(filePath, newData, 'utf-8');
    return newData;
  }

  private async postInit() {
    const hookPath = path.join(this.tempPath, 'hook');
    if (!fs.existsSync(hookPath)) return;
    const { logger } = this.options;
    const { parameters, access } = this.options;
    const hook = await require(hookPath);
    const data = {
      provider: this.provider,
      name: this.name,
      version: this.version,
      appPath: this.filePath,
      tempAppPath: this.tempPath,
      logger,
      fs,
      lodash: require('lodash'),
      artTemplate: (filePath: string) => {
        this.doArtTemplate(path.join(this.filePath, filePath), { ...parameters, access });
      },
    };
    try {
      return await hook.postInit(data);
    } catch (error) {
      logger.debug(error);
    }
  }

  /**
   * @tip parameters 的参数需要在 publish.yaml 里定义，另外会获取 publish.yaml 里的默认值
   */
  private async parsePublishYaml() {
    const publishPath = path.join(this.tempPath, 'publish.yaml');
    if (!fs.existsSync(publishPath)) {
      throw new Error('publish.yaml is not found');
    }
    fs.moveSync(path.join(this.tempPath, 'src'), this.filePath, { overwrite: true });
    const spath = getYamlPath(this.filePath, 's');
    if (isEmpty(spath)) {
      throw new Error('s.yaml/s.yml is not found');
    }
    this.spath = spath as string;
    const publishData = getYamlContent(publishPath);
    const properties = get(publishData, 'Parameters.properties', {});
    const requiredList = get(publishData, 'Parameters.required', []);
    const { parameters = {} } = this.options;
    const data = {};
    for (const key in properties) {
      const ele = properties[key];
      if (has(parameters, key)) {
        set(data, key, parameters[key]);
      } else if (ele.hasOwnProperty('default')) {
        set(data, key, ele.default);
      } else if (includes(requiredList, key)) {
        throw new Error(`parameter ${key} is required`);
      }
    }
    this.publishData = data;
  }

  private async preInit() {
    const hookPath = path.join(this.tempPath, 'hook');
    if (!fs.existsSync(hookPath)) return;
    const { logger } = this.options;
    const hook = await require(hookPath);
    const data = {
      provider: this.provider,
      name: this.name,
      version: this.version,
      appPath: this.filePath,
      tempAppPath: this.tempPath,
      logger,
      fs,
      lodash: require('lodash'),
    };
    try {
      await hook.preInit(data);
    } catch (error) {
      logger.debug(error);
    }
  }

  private async doLoad() {
    const { logger } = this.options;
    const zipball_url = this.version
      ? await this.doZipballUrlWithVersion()
      : await this.doZipballUrl();
    if (isEmpty(zipball_url)) {
      throw new Error('zipball_url is empty');
    }
    await download(zipball_url, { dest: this.tempPath, logger, extract: true, strip: 1 });
  }
  private async doZipballUrl() {
    const response = await fetch(`${REGISTRY}/${this.provider}/${this.name}/releases/latest`);
    const data = await response.json();
    return get(data, 'Response.zipball_url');
  }
  private async doZipballUrlWithVersion() {
    const response = await fetch(`${REGISTRY}/${this.provider}/${this.name}/releases`);
    const { Response } = await response.json();
    const obj = find(Response, (item: any) => item.tag_name === this.version);
    if (isEmpty(obj)) {
      throw new Error(`${this.name}@${this.version} is not found`);
    }
    return obj.zipball_url;
  }
}

export default async (template: string, options?: IOptions) => {
  const load = new LoadApplication(template, options);
  return await load.run();
};
