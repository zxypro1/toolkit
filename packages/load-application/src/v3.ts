import path from 'path';
import fs from 'fs-extra';
import download from '@serverless-devs/downloads';
import _artTemplate from 'art-template';
import _devsArtTemplate from '@serverless-devs/art-template';
import { getYamlContent, registry, isCiCdEnvironment, getYamlPath } from '@serverless-devs/utils';
import { isEmpty, includes, split, get, has, set, sortBy, map, concat, keys } from 'lodash';
import axios from 'axios';
import parse from './parse';
import { IOptions } from './types';
import { getInputs, getUrlWithLatest, getUrlWithVersion, getAllCredential, getDefaultValue } from './utils';
import assert from 'assert';
import YAML from 'yaml';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Credential from '@serverless-devs/credential';
import { CONFIGURE_LATER, DEFAULT_MAGIC_ACCESS, gray } from './constant';
const debug = require('@serverless-cd/debug')('serverless-devs:load-appliaction');

class LoadApplication {
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

  /**
  * publish.yaml 的路径
  */
  private publishPath!: string;
  /**
   * 密码类型的参数
   */
  private secretList: string[] = [];
  constructor(private template: string, private options: IOptions = {}) {
    assert(!includes(this.template, '/'), `The component name ${this.template} cannot contain /`);
    this.options.dest = this.options.dest || process.cwd();
    this.options.logger = this.options.logger || console;
    const [name, version] = split(this.template, '@');
    this.name = name;
    this.version = version;
    this.options.projectName = this.options.projectName || name;
    this.filePath = path.join(this.options.dest, this.options.projectName);
    this.tempPath = `${this.filePath}_${Date.now()}`;
  }
  async run(): Promise<string | undefined> {
    if (!(await this.check())) return;
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

    const { _custom_secret_list, ...restPostData } = postData || {};
    this.secretList = concat(this.secretList, keys(_custom_secret_list));
    /**
     * 5. 解析 s.yaml
     */
    const templateData = await this.parseTemplateYaml(restPostData);
    /**
     * 6. 解析 s.yaml里的 name 字段
     */
    this.parseAppName(templateData as string);
    /**
     * 7. 最后的动作, 比如：删除临时文件夹
     */
    await this.final();
    return this.filePath;
  }

  private async check() {
    if (this.options.y) return true;
    if (isCiCdEnvironment()) return true;
    if (!fs.existsSync(this.filePath)) return true;
    const res = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `File ${this.options.projectName} already exists, override this file ?`,
        default: true,
      },
    ]);
    return res.confirm;
  }

  private async final() {
    // 如果有密码类型的参数，就写入.env文件
    if (!isEmpty(this.secretList)) {
      const dotEnvPath = path.join(this.filePath, '.env');
      fs.ensureFileSync(dotEnvPath);
      const str = map(this.secretList, o => `\n${o}=${this.publishData[o]}`).join('');
      fs.appendFileSync(dotEnvPath, str, 'utf-8');
    }
    // 删除临时文件夹
    fs.removeSync(this.tempPath);
  }

  private parseAppName(_data: string) {
    if (isEmpty(this.spath)) return;
    const data = _data || fs.readFileSync(this.spath, 'utf-8');
    const { appName } = this.options;
    if (isEmpty(appName)) return;
    const newData = parse({ appName }, data);
    fs.writeFileSync(this.spath, newData, 'utf-8');
  }

  private async parseTemplateYaml(postData: Record<string, any>) {
    if (isEmpty(this.publishData)) return;
    this.publishData = { ...this.publishData, ...postData };
    return this.doArtTemplate(this.spath);
  }
  private doArtTemplate(filePath: string) {
    const publishData = getYamlContent(this.publishPath);
    const jsonParse = get(publishData, 'Parameters.jsonParse');
    const artTemplate = jsonParse ? _devsArtTemplate : _artTemplate;
    artTemplate.defaults.extname = path.extname(filePath);
    set(artTemplate.defaults, 'escape', false);
    const filterFilePath = path.join(this.tempPath, 'hook', 'filter.js');
    if (fs.existsSync(filterFilePath)) {
      const filterHook = require(filterFilePath);
      for (const key in filterHook) {
        artTemplate.defaults.imports[key] = filterHook[key];
      }
    }
    if (jsonParse) {
      const newData = getInputs(getYamlContent(filePath), this.publishData, artTemplate);
      fs.writeFileSync(filePath, YAML.stringify(newData), 'utf-8');
      return YAML.stringify(newData);
    }
    const newData = artTemplate(filePath, this.publishData);
    fs.writeFileSync(filePath, newData, 'utf-8');
    return newData;
  }

  private async postInit() {
    const hookPath = path.join(this.tempPath, 'hook');
    if (!fs.existsSync(hookPath)) return;
    const { logger } = this.options;
    const hook = await require(hookPath);
    const data = {
      name: this.name,
      version: this.version,
      appPath: this.filePath,
      tempAppPath: this.tempPath,
      logger,
      fs,
      lodash: require('lodash'),
      artTemplate: (filePath: string) => {
        this.doArtTemplate(path.join(this.filePath, filePath));
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
    this.publishPath = path.join(this.tempPath, 'publish.yaml');
    if (!fs.existsSync(this.publishPath)) return;
    // keep behavior of fs.moveSync()
    if (this.options.overwrite !== false) fs.emptyDirSync(this.filePath);
    fs.copySync(path.join(this.tempPath, 'src'), this.filePath);
    const spath = getYamlPath(path.join(this.filePath, 's.yaml'));
    if (isEmpty(spath)) return;
    this.spath = spath as string;
    const { parameters = {} } = this.options;
    // 如果有parameters参数，或者是 CI/CD 环境，就不需要提示用户输入参数了
    if (!isEmpty(parameters) || isCiCdEnvironment()) {
      const publishData = this.parsePublishWithParameters();
      this.publishData = { ...publishData, access: this.options.access };
      return;
    }
    if (this.options.y) return;
    this.publishData = await this.parsePublishWithInquire();
  }
  private async parsePublishWithInquire() {
    const publishData = getYamlContent(this.publishPath);
    const properties = get(publishData, 'Parameters.properties');
    const requiredList = get(publishData, 'Parameters.required');
    const promptList = [];
    if (properties) {
      let rangeList = [];
      for (const key in properties) {
        const ele = properties[key];
        ele['__key'] = key;
        rangeList.push(ele);
      }
      rangeList = sortBy(rangeList, o => o['x-range']);
      for (const item of rangeList) {
        const name = item.__key;
        const prefix = item.description ? `${gray(item.description)}\n${chalk.green('?')}` : undefined;
        const validate = (input: string) => {
          if (isEmpty(input)) {
            return includes(requiredList, name) ? 'value cannot be empty.' : true;
          }
          if (item.pattern) {
            return new RegExp(item.pattern).test(input) ? true : item.description;
          }
          return true;
        };
        // 布尔类型
        if (item.type === 'boolean') {
          promptList.push({
            type: 'confirm',
            name,
            prefix,
            message: item.title,
            default: item.default,
          });
        } else if (item.type === 'secret') {
          // 记录密码类型的参数写入.env文件
          this.secretList.push(name);
          // 密码类型
          promptList.push({
            type: 'password',
            name,
            prefix,
            message: item.title,
            default: item.default,
            validate,
          });
        } else if (item.enum) {
          // 枚举类型
          promptList.push({
            type: 'list',
            name,
            prefix,
            message: item.title,
            choices: item.enum,
            default: item.default,
          });
        } else if (item.type === 'string') {
          // 字符串类型
          promptList.push({
            type: 'input',
            message: item.title,
            name,
            prefix,
            default: getDefaultValue(item.default),
            validate,
          });
        }
      }
    }
    const credentialAliasList = map(await getAllCredential({ logger: this.options.logger }), o => ({
      name: o,
      value: o,
    }));
    let result: any = {};
    if (this.options.access) {
      result = await inquirer.prompt(promptList);
      result.access = await this.getCredentialDirectly();
    } else if (isEmpty(credentialAliasList)) {
      promptList.push({
        type: 'confirm',
        name: '__access',
        message: 'create credential?',
        default: true,
      });
      result = await inquirer.prompt(promptList);
      if (get(result, '__access')) {
        const data = await new Credential({ logger: this.options.logger }).set();
        result.access = data?.access;
      } else {
        result.access = DEFAULT_MAGIC_ACCESS;
      }
    } else {
      promptList.push({
        type: 'list',
        name: 'access',
        message: 'please select credential alias',
        choices: concat(credentialAliasList, {
          name: 'configure later.',
          value: CONFIGURE_LATER,
        }),
      });
      result = await inquirer.prompt(promptList);
      if (result.alias === CONFIGURE_LATER) {
        result.access = DEFAULT_MAGIC_ACCESS;
      }
    }
    return result;
  }
  private async getCredentialDirectly() {
    const { logger } = this.options;
    const c = new Credential({ logger: this.options.logger });
    try {
      const data = await c.get(this.options.access);
      return data?.access;
    } catch (e) {
      const error = e as Error;
      logger.tips(error.message);
      const data = await c.set();
      return data?.access;
    }
  }
  private parsePublishWithParameters() {
    const publishData = getYamlContent(this.publishPath);
    const properties = get(publishData, 'Parameters.properties', {});
    const requiredList = get(publishData, 'Parameters.required', []);
    const { parameters = {} } = this.options;
    const data = {};
    for (const key in properties) {
      const ele = properties[key];
      if (has(parameters, key)) {
        set(data, key, parameters[key]);
      } else if (ele.hasOwnProperty('default')) {
        set(data, key, getDefaultValue(ele.default));
      } else if (includes(requiredList, key)) {
        throw new Error(`parameter ${key} is required`);
      }
    }
    return data;
  }
  private async preInit() {
    const hookPath = path.join(this.tempPath, 'hook');
    if (!fs.existsSync(hookPath)) return;
    const { logger } = this.options;
    const hook = await require(hookPath);
    const data = {
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
    const zipball_url = this.options.uri || (await this.getZipballUrl());
    debug(`zipball_url: ${zipball_url}`);
    await download(zipball_url, {
      dest: this.tempPath,
      logger,
      extract: true,
      headers: {
        ...registry.getSignHeaders(),
        devs_mock_env: process.env.DEVS_MOCK_ENV || 'false',
      },
      filename: this.name,
    });
  }
  private getZipballUrl = async () => {
    const url = this.version ? getUrlWithVersion(this.name, this.version) : getUrlWithLatest(this.name);
    debug(`url: ${url}`);
    const res = await axios.get(url, { headers: registry.getSignHeaders() });
    debug(`res: ${JSON.stringify(res.data)}`);
    const zipball_url = get(res, 'data.body.zipball_url');
    const template = this.version ? `${this.name}@${this.version}` : this.name;
    if (isEmpty(zipball_url)) throw new Error(`Application ${template} is not found`);
    return zipball_url;
  };
}

export default LoadApplication;
