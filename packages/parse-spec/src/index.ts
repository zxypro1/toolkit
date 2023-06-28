export { default as use3version } from './use3version';
export { default as compile } from './compile';
export { default as order } from './order';
export { default as getInputs } from './get-inputs';
export * from './types';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import path from 'path';
import { getDefaultYamlPath, isExtendMode } from './utils';
import compile from './compile';
import order from './order';
import getInputs from './get-inputs';
import { concat, get, keys, map, omit } from 'lodash';
import { ISpec, IOptions, IYaml, IActionType, IActionLevel } from './types';
import { IGNORE, REGX } from './contants';
const extend2 = require('extend2');
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');

class ParseSpec {
  // yaml
  private yaml = {} as IYaml;
  constructor(filePath: string = '', private options = {} as IOptions) {
    this.yaml.path = fs.existsSync(filePath)
      ? utils.getAbsolutePath(filePath)
      : (getDefaultYamlPath() as string);
    debug(`yaml path: ${this.yaml.path}`);
    debug(`options: ${JSON.stringify(this.options)}`);
  }
  async start(): Promise<ISpec> {
    debug('parse start');
    this.yaml.content = utils.getYamlContent(this.yaml.path);
    this.yaml.access = get(this.yaml.content, 'access');
    this.yaml.extend = get(this.yaml.content, 'extend');
    this.yaml.vars = get(this.yaml.content, 'vars', {});

    debug(`yaml content: ${JSON.stringify(this.yaml.content)}`);
    require('dotenv').config({ path: path.join(path.dirname(this.yaml.path), '.env') });
    const steps = isExtendMode(this.yaml.extend, path.dirname(this.yaml.path))
      ? await this.doExtend()
      : await this.doNormal();
    // 获取到真实值后，重新赋值
    this.yaml.vars = get(this.yaml.content, 'vars', {});
    const actions = get(this.yaml.content, 'actions', {});
    this.yaml.actions = await this.parseActions(actions);
    const result = { steps: order(steps), yaml: this.yaml };
    debug(`parse result: ${JSON.stringify(result)}`);
    debug('parse end');
    return result;
  }
  async parseActions(actions: Record<string, any> = {}, level: string = IActionLevel.GLOBAL) {
    const actionList = [];
    for (const action in actions) {
      const element = actions[action];
      const actionInfo = this.matchAction(action);
      debug(`action: ${action}, useAction: ${JSON.stringify(actionInfo)}`);
      if (actionInfo.validate) {
        actionList.push(
          ...map(element, (item) => {
            if (item[IActionType.RUN]) {
              const { run, ...rest } = item;
              return {
                ...rest,
                value: run,
                path: utils.getAbsolutePath(get(item, 'path', './'), path.dirname(this.yaml.path)),
                actionType: IActionType.RUN,
                hookType: actionInfo.type,
                level,
              };
            }
            if (item[IActionType.PLUGIN]) {
              const { plugin, ...rest } = item;
              const value = utils.getAbsolutePath(plugin, path.dirname(this.yaml.path));
              return {
                ...rest,
                value: fs.existsSync(value) ? value : plugin,
                actionType: IActionType.PLUGIN,
                hookType: actionInfo.type,
                level,
              };
            }
            if (item[IActionType.COMPONENT]) {
              const { component, ...rest } = item;
              return {
                ...rest,
                value: component,
                actionType: IActionType.COMPONENT,
                hookType: actionInfo.type,
                level,
              };

            }
          }),
        );
      }
    }
    debug(`parse actions: ${JSON.stringify(actionList)}`);
    return actionList;
  }
  private matchAction(action: string) {
    const useMagic = REGX.test(action);
    if (useMagic) {
      const newAction = compile(action, { method: this.options.method });
      const [type, method] = newAction.split('-');
      return {
        validate: method === 'true',
        type,
      };
    }
    const [type, method] = action.split('-');
    return {
      validate: method === this.options.method,
      type,
    };
  }
  private async doExtend() {
    debug('do extend');
    const extendPath = utils.getAbsolutePath(this.yaml.extend, path.dirname(this.yaml.path));
    const extendYaml = utils.getYamlContent(extendPath);
    const extendVars = get(extendYaml, 'vars', {});
    const extendContent = getInputs(extendYaml, {
      cwd: path.dirname(extendPath),
      vars: extend2(true, {}, extendVars, this.yaml.vars),
      ignore: concat(IGNORE, keys(get(extendYaml, 'services', {}))),
    });
    debug(`extend yaml content: ${JSON.stringify(extendContent)}`);
    const yamlContent = getInputs(omit(this.yaml.content, 'extend'), {
      cwd: path.dirname(this.yaml.path),
      vars: extend2(true, {}, extendVars, this.yaml.vars),
      ignore: concat(IGNORE, keys(get(this.yaml.content, 'services', {}))),
    });
    debug(`yaml content: ${JSON.stringify(yamlContent)}`);
    this.yaml.content = extend2(true, {}, extendContent, yamlContent);
    debug(`merged yaml content: ${JSON.stringify(this.yaml.content)}`);
    const projects = get(this.yaml.content, 'services', {});
    debug(`projects: ${JSON.stringify(projects)}`);
    return await this.getSteps(projects);
  }
  private async doNormal() {
    debug('do normal');
    this.yaml.content = getInputs(this.yaml.content, {
      cwd: path.dirname(this.yaml.path),
      vars: this.yaml.vars,
      ignore: concat(IGNORE, keys(get(this.yaml.content, 'services', {}))),
    });
    const projects = get(this.yaml.content, 'services', {});
    debug(`projects: ${JSON.stringify(projects)}`);
    return await this.getSteps(projects);
  }
  private async getSteps(projects: Record<string, any>) {
    const steps = [];
    for (const project in projects) {
      const element = projects[project];
      const data = projects[project];
      const component = compile(get(data, 'component'), { cwd: path.dirname(this.yaml.path) });
      steps.push({ ...element, projectName: project, component, access: this.getAccess(data) });
    }
    return steps;
  }
  private getAccess(data: Record<string, any>) {
    // 全局的access > 项目的access > yaml的access
    if (this.options.access) return this.options.access;
    if (get(data, 'access')) return get(data, 'access');
    if (this.yaml.access) return this.yaml.access;
  }
}

export default ParseSpec;
