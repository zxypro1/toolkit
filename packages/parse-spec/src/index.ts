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
import { concat, each, find, get, includes, isEmpty, keys, map, omit, rest, split } from 'lodash';
import { ISpec, IYaml, IActionType, IActionLevel, IStep, IRecord } from './types';
import { IGNORE, REGX } from './contants';
const extend2 = require('extend2');
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');

class ParseSpec {
  // yaml
  private yaml = {} as IYaml;
  private record = {} as IRecord;
  constructor(filePath: string = '', private argv: string[] = []) {
    this.yaml.path = fs.existsSync(filePath)
      ? utils.getAbsolutePath(filePath)
      : (getDefaultYamlPath() as string);
    debug(`yaml path: ${this.yaml.path}`);
    debug(`argv: ${JSON.stringify(argv)}`);
  }
  start(): ISpec {
    debug('parse start');
    this.yaml.content = utils.getYamlContent(this.yaml.path);
    this.yaml.projectNames = keys(get(this.yaml.content, 'services', {}));
    this.yaml.access = get(this.yaml.content, 'access');
    this.yaml.extend = get(this.yaml.content, 'extend');
    this.yaml.vars = get(this.yaml.content, 'vars', {});
    this.yaml.flow = get(this.yaml.content, 'flow', {});
    this.parseArgv();
    debug(`yaml content: ${JSON.stringify(this.yaml.content)}`);
    require('dotenv').config({ path: path.join(path.dirname(this.yaml.path), '.env') });
    const steps = isExtendMode(this.yaml.extend, path.dirname(this.yaml.path))
      ? this.doExtend()
      : this.doNormal();
    // 获取到真实值后，重新赋值
    this.yaml.vars = get(this.yaml.content, 'vars', {});
    const actions = get(this.yaml.content, 'actions', {});
    this.yaml.actions = this.parseActions(actions);
    const result = {
      steps: this.formatSteps(steps),
      yaml: this.yaml,
      ...this.record,
    };
    debug(`parse result: ${JSON.stringify(result)}`);
    debug('parse end');
    return result;
  }
  private formatSteps(steps: IStep[]) {
    if (this.record.projectName) return steps;
    return isEmpty(this.yaml.flow) ? order(steps) : this.doFlow(steps);
  }
  private parseArgv() {
    const argv = utils.parseArgv(this.argv);
    debug(`parse argv: ${JSON.stringify(argv)}`);
    const { _, ...rest } = argv;
    this.record.args = rest;
    // TODO:
    this.record.access = get(argv, 'access');
    if (includes(this.yaml.projectNames, _[0])) {
      this.record.projectName = _[0];
      return (this.record.method = _[1]);
    }
    this.record.method = _[0];
  }
  private doFlow(steps: IStep[]) {
    const newSteps: IStep[] = [];
    const flowObj = find(this.yaml.flow, (item, key) => this.matchFlow(key));
    debug(`find flow: ${JSON.stringify(flowObj)}`);
    const fn = (projects: string[] = [], index: number) => {
      for (const project of projects) {
        for (const step of steps) {
          if (includes(project, step.projectName)) {
            step.flowId = index;
            newSteps.push({ ...step, flowId: index });
          }
        }
      }
    };
    each(flowObj, fn);
    debug(`flow steps: ${JSON.stringify(newSteps)}`);
    return newSteps;
  }
  private matchFlow(flow: string) {
    const useMagic = REGX.test(flow);
    if (useMagic) {
      return compile(flow, { method: this.record.method });
    }
    return flow === this.record.method;
  }
  parseActions(actions: Record<string, any> = {}, level: string = IActionLevel.GLOBAL) {
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
                projectName: this.record.projectName,
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
                projectName: this.record.projectName,
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
                projectName: this.record.projectName,
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
      const newAction = compile(action, { method: this.record.method });
      const [type, method] = split(newAction, '-');
      return {
        validate: method === 'true',
        type,
      };
    }
    const [type, method] = split(action, '-');
    return {
      validate: method === this.record.method,
      type,
    };
  }
  private doExtend() {
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
      ignore: concat(IGNORE, this.yaml.projectNames),
    });
    debug(`yaml content: ${JSON.stringify(yamlContent)}`);
    this.yaml.content = extend2(true, {}, extendContent, yamlContent);
    debug(`merged yaml content: ${JSON.stringify(this.yaml.content)}`);
    const projects = get(this.yaml.content, 'services', {});
    debug(`projects: ${JSON.stringify(projects)}`);
    return this.getSteps(projects);
  }
  private doNormal() {
    debug('do normal');
    this.yaml.content = getInputs(this.yaml.content, {
      cwd: path.dirname(this.yaml.path),
      vars: this.yaml.vars,
      ignore: concat(IGNORE, this.yaml.projectNames),
    });
    const projects = get(this.yaml.content, 'services', {});
    debug(`projects: ${JSON.stringify(projects)}`);
    return this.getSteps(projects);
  }
  private getOneStep(project: Record<string, any>) {
    const component = compile(get(project, 'component'), { cwd: path.dirname(this.yaml.path) });
    return [
      {
        ...project,
        projectName: this.record.projectName,
        component,
        access: this.getAccess(project),
      },
    ];
  }
  private getSteps(projects: Record<string, any>) {
    if (this.record.projectName) return this.getOneStep(get(projects, this.record.projectName, {}));
    const steps = [];
    for (const project in projects) {
      const element = projects[project];
      const data = projects[project];

      const component = compile(get(data, 'component'), { cwd: path.dirname(this.yaml.path) });
      steps.push({
        ...element,
        projectName: project,
        component,
        access: this.getAccess(data),
      });
    }
    return steps;
  }
  private getAccess(data: Record<string, any>) {
    // 全局的access > 项目的access > yaml的access
    if (this.record.access) return this.record.access;
    if (get(data, 'access')) return get(data, 'access');
    if (this.yaml.access) return this.yaml.access;
  }
}

export default ParseSpec;
