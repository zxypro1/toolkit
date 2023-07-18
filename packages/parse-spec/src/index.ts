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
import { concat, each, find, get, includes, isEmpty, keys, map, omit, split } from 'lodash';
import { ISpec, IYaml, IActionType, IActionLevel, IStep, IRecord } from './types';
import { IGNORE, REGX } from './contants';
const extend2 = require('extend2');
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');

class ParseSpec {
  private yaml = {} as IYaml;
  private record = {} as IRecord;
  constructor(filePath: string = '', private argv: string[] = process.argv.slice(2)) {
    this.init(filePath);
    debug(`yaml path: ${this.yaml.path}`);
    debug(`argv: ${JSON.stringify(argv)}`);
  }
  private init(filePath: string) {
    if (isEmpty(filePath)) {
      return (this.yaml.path = getDefaultYamlPath() as string);
    }
    if (fs.existsSync(filePath)) {
      return (this.yaml.path = utils.getAbsolutePath(filePath));
    }
    throw new Error(`The specified template file does not exist: ${filePath}`);
  }
  private doYamlinit() {
    this.yaml.content = utils.getYamlContent(this.yaml.path);
    this.yaml.extend = get(this.yaml.content, 'extend');
    this.yaml.useExtend = isExtendMode(this.yaml.extend, path.dirname(this.yaml.path));
    if (this.yaml.useExtend) {
      const extendPath = utils.getAbsolutePath(this.yaml.extend, path.dirname(this.yaml.path));
      require('dotenv').config({ path: path.join(extendPath, '.env') });
      const extendYaml = utils.getYamlContent(extendPath);
      this.yaml.content = extend2(true, {}, extendYaml, this.yaml.content);
    }
    this.yaml.access = get(this.yaml.content, 'access');
    const use3x = String(get(this.yaml.content, 'edition')) === '3.0.0';
    const projectKey = use3x ? 'resources' : 'services';
    this.yaml.use3x = use3x;
    this.yaml.projectNames = keys(get(this.yaml.content, projectKey, {}));
    this.yaml.vars = get(this.yaml.content, 'vars', {});
    this.yaml.flow = get(this.yaml.content, 'flow', {});
    this.yaml.useFlow = false;
    this.yaml.template = get(this.yaml.content, 'template', {});
    this.yaml.projects = get(this.yaml.content, projectKey, {});
    require('dotenv').config({ path: path.join(path.dirname(this.yaml.path), '.env') });
  }
  start(): ISpec {
    debug('parse start');
    this.doYamlinit();
    this.parseArgv();
    // projectName 存在，说明指定了项目
    const steps = this.record.projectName ? this.getOneStep() : this.getSteps();
    // 获取到真实值后，重新赋值
    this.yaml.vars = get(this.yaml.content, 'vars', {});
    const actions = get(this.yaml.content, 'actions', {});
    this.yaml.actions = this.parseActions(actions);
    const result = {
      steps: this.record.projectName ? steps : this.doFlow(steps),
      yaml: this.yaml,
      ...this.record,
    };
    debug(`parse result: ${JSON.stringify(result)}`);
    debug('parse end');
    return result;
  }
  private parseArgv() {
    const argv = utils.parseArgv(this.argv);
    debug(`parse argv: ${JSON.stringify(argv)}`);
    const { _ } = argv;
    this.record.access = get(argv, 'access');
    this.record.version = get(argv, 'version');
    this.record.help = get(argv, 'help');
    this.record.output = get(argv, 'output');
    this.record.skipActions = get(argv, 'skip-actions');
    this.record.debug = get(argv, 'debug');
    if (includes(this.yaml.projectNames, _[0])) {
      this.record.projectName = _[0];
      this.record.command = _[1];
      return;
    }
    this.record.command = _[0];
  }
  private doFlow(steps: IStep[]) {
    const newSteps: IStep[] = [];
    const flowObj = find(this.yaml.flow, (item, key) => this.matchFlow(key));
    const { steps: orderSteps, dependencies } = order(steps);
    if (!flowObj) return orderSteps;
    debug(`find flow: ${JSON.stringify(flowObj)}`);
    const projectOrder = {} as Record<string, number>;
    const fn = (projects: string[] = [], index: number) => {
      for (const project of projects) {
        for (const step of steps) {
          if (includes(project, step.projectName)) {
            newSteps.push({ ...step, flowId: index });
            projectOrder[step.projectName] = index;
          }
        }
      }
    };
    each(flowObj, fn);
    debug(`flow steps: ${JSON.stringify(newSteps)}`);
    this.yaml.useFlow = true;
    debug(`flow projectOrder: ${JSON.stringify(projectOrder)}`);
    // 指定flow后，如果存在依赖关系，校验是否可以正常执行
    if (!isEmpty(dependencies)) {
      debug(`project dependencies: ${JSON.stringify(dependencies)}`);
      for (const p1 in dependencies) {
        const ele = dependencies[p1];
        for (const p2 in ele) {
          if (projectOrder[p2] >= projectOrder[p1]) {
            throw new Error(`flow is invalid, ${p2} must be executed before ${p1}`);
          }
        }
      }
    }
    return newSteps;
  }
  private matchFlow(flow: string) {
    const useMagic = REGX.test(flow);
    if (useMagic) {
      return compile(flow, { command: this.record.command });
    }
    return flow === this.record.command;
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
      const newAction = compile(action, { command: this.record.command });
      const [type, command] = split(newAction, '-');
      return {
        validate: command === 'true',
        type,
      };
    }
    const [type, command] = split(action, '-');
    return {
      validate: command === this.record.command,
      type,
    };
  }
  private getOneStep() {
    const projectName = this.record.projectName as string;
    const project = get(this.yaml.projects, projectName, {});
    const component = compile(get(project, 'component'), { cwd: path.dirname(this.yaml.path) });
    return [
      {
        ...project,
        projectName,
        component,
        access: this.getAccess(project),
      },
    ];
  }
  private getSteps() {
    this.yaml.content = getInputs(this.yaml.content, {
      cwd: path.dirname(this.yaml.path),
      vars: this.yaml.vars,
      ignore: concat(IGNORE, this.yaml.projectNames),
    });

    const steps = [];
    for (const project in this.yaml.projects) {
      const element = this.yaml.projects[project];
      const component = compile(get(element, 'component'), { cwd: path.dirname(this.yaml.path) });
      const name = get(this.yaml.template, get(element, 'extend.name'), {});
      const template = getInputs(omit(name, get(element, 'extend.ignore', [])), {
        vars: this.yaml.vars,
      });
      const props = getInputs(get(element, 'props', {}), {
        cwd: path.dirname(this.yaml.path),
        vars: this.yaml.vars,
        ignore: concat(IGNORE, this.yaml.projectNames),
      });
      steps.push({
        ...element,
        props: extend2(true, {}, template, props),
        projectName: project,
        component,
        access: this.getAccess(element),
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
