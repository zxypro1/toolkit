export { default as compile } from './compile';
export { default as order } from './order';
export { default as getInputs } from './get-inputs';
export * from './types';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import path from 'path';
import { getDefaultYamlPath, isExtendMode, getCredential } from './utils';
import compile from './compile';
import order from './order';
import getInputs from './get-inputs';
import { each, filter, find, get, includes, isEmpty, keys, map, omit, set, split } from 'lodash';
import { ISpec, IYaml, IActionType, IActionLevel, IStep, IRecord } from './types';
import { REGX } from './contants';
const extend2 = require('extend2');
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');

interface IOptions {
  argv?: string[];
  logger?: any;
}

class ParseSpec {
  private yaml = {} as IYaml;
  private record = {} as IRecord;
  constructor(filePath: string = '', private options: IOptions = {}) {
    this.options.argv = this.options.argv || process.argv.slice(2);
    this.options.logger = this.options.logger || console;
    this.init(filePath);
    debug(`yaml path: ${this.yaml.path}`);
    debug(`argv: ${JSON.stringify(this.options.argv)}`);
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
    this.yaml.appName = get(this.yaml.content, 'name');
    require('dotenv').config({ path: path.join(path.dirname(this.yaml.path), '.env') });
  }
  async start(): Promise<ISpec> {
    debug('parse start');
    this.doYamlinit();
    this.parseArgv();
    if (!this.yaml.use3x) {
      return this.v1();
    }
    const steps = await this.getSteps();
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
  // 简单兼容v1版本，不需要做魔法变量解析
  private v1(): ISpec {
    const steps = [];
    const services = get(this.yaml.content, 'services', {});
    for (const project in services) {
      const element = services[project];
      steps.push({
        ...element,
        projectName: project,
      });
    }
    return {
      steps: this.record.projectName
        ? filter(steps, (item) => item.projectName === this.record.projectName)
        : steps,
      yaml: this.yaml,
      ...this.record,
    };
  }
  private parseArgv() {
    const argv = utils.parseArgv(this.options.argv as string[]);
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
  private getCommonMagic() {
    return {
      cwd: path.dirname(this.yaml.path),
      vars: this.yaml.vars,
    };
  }
  private getMagicProps(item: Partial<IStep>) {
    const resources = get(this.yaml.content, 'resources', {});
    const temp = {};
    each(resources, (item, key) => {
      set(temp, `${key}.props`, item.props);
      set(temp, `${key}.output`, {});
    });
    const name = item.projectName as string;
    const res = {
      ...this.getCommonMagic(),
      resources: temp,
      credential: item.credential,
      that: {
        name,
        access: item.access,
        component: item.component,
        props: resources[name].props,
        output: resources[name].output,
      },
    };
    debug(`getMagicProps: ${JSON.stringify(res)}`);
    return res;
  }
  private async getSteps() {
    // resources字段， 其它字段
    const { resources, ...rest } = this.yaml.content;
    this.yaml.content = {
      ...this.yaml.content,
      ...getInputs(rest, this.getCommonMagic()),
    };
    const steps = [];
    // projectName 存在，说明指定了项目
    const temp = this.record.projectName
      ? { [this.record.projectName]: resources[this.record.projectName] }
      : resources;
    for (const project in temp) {
      const element = resources[project];
      const component = compile(get(element, 'component'), { cwd: path.dirname(this.yaml.path) });
      let template = get(this.yaml.template, get(element, 'extend.template'), {});
      template = getInputs(template, this.getCommonMagic());
      const access = this.getAccess(element);
      const credential = await getCredential(access, this.options.logger);

      const real = getInputs(
        element,
        this.getMagicProps({ projectName: project, access, component, credential }),
      );
      this.yaml.content = {
        ...this.yaml.content,
        resources: {
          ...this.yaml.content.resources,
          [project]: real,
        },
      };
      steps.push({
        ...real,
        props: extend2(true, {}, template, real.props),
        projectName: project,
        component,
        access,
        credential,
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
