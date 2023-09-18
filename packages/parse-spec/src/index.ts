export { default as compile } from './compile';
export { default as getInputs } from './get-inputs';
export * from './types';
export * from './contants';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { getDefaultYamlPath, isExtendMode } from './utils';
import compile from './compile';
import Order from './order';
import ParseContent from './parse-content';
import { each, filter, find, get, has, includes, isArray, isEmpty, keys, map, set, split } from 'lodash';
import { ISpec, IYaml, IActionType, IActionLevel, IStep, IRecord } from './types';
import { ENVIRONMENT_KEY, REGX } from './contants';
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
  private async doYamlinit() {
    await this.doExtend();
    await this.checkEnvironment();
    this.yaml.access = get(this.yaml.content, 'access');
    const projectKey = this.yaml.use3x ? 'resources' : 'services';
    this.yaml.projectNames = keys(get(this.yaml.content, projectKey, {}));
    this.yaml.vars = get(this.yaml.content, 'vars', {});
    this.yaml.flow = get(this.yaml.content, 'flow', {});
    this.yaml.useFlow = false;
    this.yaml.appName = get(this.yaml.content, 'name');
    expand(dotenv.config({ path: path.join(path.dirname(this.yaml.path), '.env') }));
  }
  private async doExtend() {
    this.yaml.content = utils.getYamlContent(this.yaml.path);
    this.yaml.useEnvironment = has(this.yaml.content, ENVIRONMENT_KEY);
    this.yaml.envPath = utils.getAbsolutePath(get(this.yaml.content, ENVIRONMENT_KEY), path.dirname(this.yaml.path));
    this.yaml.extend = get(this.yaml.content, 'extend');
    this.yaml.useExtend = isExtendMode(this.yaml.extend, path.dirname(this.yaml.path));
    if (this.yaml.useExtend) {
      if (this.yaml.useEnvironment) {
        // TODO: @封崇
        throw new utils.DevsError('environment and extend is conflict', {
          tips: 'please remove environment or extend in yaml',
        });
      }
      const extendPath = utils.getAbsolutePath(this.yaml.extend, path.dirname(this.yaml.path));
      expand(dotenv.config({ path: path.join(extendPath, '.env') }));
      const extendContent = utils.getYamlContent(extendPath);
      this.yaml.use3x = String(get(this.yaml.content, 'edition', get(extendContent, 'edition'))) === '3.0.0';
      // 1.x 不做extend动作
      if (!this.yaml.use3x) return;
      const { resources: extendResource, ...extendRest } = extendContent;
      const { resources: currentResource, ...currentRest } = this.yaml.content;
      const tempRest = extend2(true, {}, extendRest, currentRest);
      const base = await new ParseContent({ ...extendContent, ...tempRest }, this.getParsedContentOptions(extendPath)).start();
      const current = await new ParseContent({ ...this.yaml.content, ...tempRest }, this.getParsedContentOptions(this.yaml.path)).start();
      this.yaml.content = extend2(true, {}, get(base, 'content'), get(current, 'content'));
      return;
    }
    this.yaml.use3x = String(get(this.yaml.content, 'edition')) === '3.0.0';
  }
  private async checkEnvironment() {
    if (!this.yaml.useEnvironment) return;
    if (isEmpty(this.record.env)) {
      // TODO: @封崇
      throw new utils.DevsError('If you want to use environment, you must specify --env', {
        tips: 'please use --env to specify environment',
      });
    }
    const { project, environments } = utils.getYamlContent(this.yaml.envPath as string);
    debug(`environment content: ${JSON.stringify(environments)}`);
    const environment = find(environments, item => item.name === this.record.env);
    debug(`use environment: ${JSON.stringify(environment)}`);

    if (isEmpty(environment)) {
      // TODO: @封崇
      throw new utils.DevsError(`env [${this.record.env}] was not found`, {
        tips: 'please check env name',
      });
    }
    set(environment, 'overlays.resources.region', get(environment, 'region'));
    set(environment, '__project', project);
    this.yaml.environment = environment;
  }
  private getParsedContentOptions(basePath: string) {
    return {
      logger: this.options.logger,
      basePath,
      projectName: this.record.projectName,
      access: this.record.access,
      environment: this.yaml.environment,
    };
  }
  async start(): Promise<ISpec> {
    debug('parse start');
    // 第一次尝试解析参数，比如全局access给 extend 用
    this.parseArgv();
    await this.doYamlinit();
    // 再次解析参数，比如projectNames
    this.parseArgv();
    if (!this.yaml.use3x) return this.v1();
    const { steps, content, originStep } = await new ParseContent(this.yaml.content, this.getParsedContentOptions(this.yaml.path)).start();
    // 获取到真实值后，重新赋值
    this.yaml.content = content;
    this.yaml.vars = get(this.yaml.content, 'vars', {});
    const actions = get(this.yaml.content, 'actions', {});
    this.yaml.actions = this.parseActions(actions);
    const result = {
      steps: this.record.projectName ? steps : this.doFlow(steps, originStep),
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
      steps: this.record.projectName ? filter(steps, item => item.projectName === this.record.projectName) : steps,
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
    this.record.env = get(argv, 'env');
    if (includes(this.yaml.projectNames, _[0])) {
      this.record.projectName = _[0];
      this.record.command = _[1];
      return;
    }
    this.record.command = _[0];
  }
  private doFlow(steps: IStep[], originStep: IStep[]) {
    const newSteps: IStep[] = [];
    const flowObj = find(this.yaml.flow, (item, key) => this.matchFlow(key));
    const orderInstance = new Order(originStep).start();
    const { steps: orderSteps, dependencies } = orderInstance.sort(steps);
    if (!flowObj) return orderSteps;
    debug(`find flow: ${JSON.stringify(flowObj)}`);
    const projectOrder = {} as Record<string, number>;
    const fn = (projects: string[] = [], index: number) => {
      for (const project of projects) {
        for (const step of steps) {
          if (project === step.projectName) {
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
      if (!isArray(element)) {
        throw new utils.DevsError(`${level} action ${action} is invalid, it must be array`);
      }
      const actionInfo = this.matchAction(action);
      debug(`action: ${action}, useAction: ${JSON.stringify(actionInfo)}`);
      if (actionInfo.validate) {
        actionList.push(
          ...map(element, item => {
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
}

export default ParseSpec;
