export { default as getInputs } from './get-inputs';
export * from './types';
export * from './contants';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { getDefaultYamlPath, isExtendMode } from './utils';
const compile = require('@serverless-devs/art-template/lib/devs-compile');
import Order from './order';
import ParseContent from './parse-content';
import { each, filter, find, get, has, includes, isArray, isEmpty, keys, map, set, split } from 'lodash';
import { ISpec, IYaml, IActionType, IActionLevel, IStep, IRecord } from './types';
import { ENVIRONMENT_FILE_NAME, ENVIRONMENT_FILE_PATH, ENVIRONMENT_KEY, REGX } from './contants';
import assert from 'assert';
import { DevsError, ETrackerType } from '@serverless-devs/utils';
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
    this.doEnvironment();
    this.yaml.access = get(this.yaml.content, 'access');
    const projectKey = this.yaml.use3x ? 'resources' : 'services';
    const projects = get(this.yaml.content, projectKey, {});
    this.yaml.projectNames = keys(get(this.yaml.content, projectKey, {}));
    this.yaml.vars = get(this.yaml.content, 'vars', {});
    this.yaml.flow = get(this.yaml.content, 'flow', {});
    this.yaml.useFlow = false;
    this.yaml.appName = get(this.yaml.content, 'name');

    // 兼容2.0: 加入项目的.env环境变量
    for (const i of this.yaml.projectNames) {
      if (get(projects, `${i}.props.code`)) {
        const codePath = utils.getAbsolutePath(get(projects, `${i}.props.code`, ''));
        expand(dotenv.config({ path: path.join(codePath, '.env') }));
      }
    }

    expand(dotenv.config({ path: path.join(path.dirname(this.yaml.path), '.env') }));
  }
  private async doExtend() {
    // this.yaml = { path: '' }
    this.yaml.content = utils.getYamlContent(this.yaml.path);
    this.yaml.extend = get(this.yaml.content, 'extend');
    this.yaml.useExtend = isExtendMode(this.yaml.extend, path.dirname(this.yaml.path));
    if (this.yaml.useExtend) {
      // if useExtend, 则直接解析前后内容
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
  /**
   * # 指定--env时：
  - s.yaml使用extend，则报错
  - 如果s.yaml声明了env yaml，则使用指定的env.yaml,  否则使用默认的env.yaml
  - 如果env.yaml不存在，则报错
  - 指定的env找不到，则报错
  - s deploy --env test

  # 不指定--env时
  ## s.yaml使用extend
  - s.yaml声明了env yaml, 则报错，没声明env yaml，则不使用多环境
  - s deploy
  ## s.yaml未使用extend
  - s.yaml声明了env yaml，如果env.yaml不存在，则报错
  - 使用指定env.yaml的默认环境，如果没有指定默认环境，则报错
  - 如果指定的默认环境找不到，则报错。
  - s deploy
  */
  private doEnvironment() {
    if (!this.yaml.use3x) return;
    const envInfo = this.record.env ? this.doEnvWithSpecify() : this.doEnvWithNotSpecify();
    // 不使用多环境, 则直接返回
    if (isEmpty(envInfo)) return;
    const { project, environment } = envInfo as { project: string; environment: Record<string, any> };
    debug(`use environment: ${JSON.stringify(environment)}`);
    set(environment, 'overlays.resources.region', get(environment, 'region'));
    set(environment, '__project', project);
    this.yaml.environment = environment;
  }
  // not specify --env
  private doEnvWithNotSpecify() {
    if (this.yaml.useExtend) {
      if (has(this.yaml.content, ENVIRONMENT_KEY)) {
        throw new DevsError('Environment and extend is conflict', {
          trackerType: ETrackerType.parseException,
        });
      }
    }
    if (has(this.yaml.content, ENVIRONMENT_KEY)) {
      const envPath: string = utils.getAbsolutePath(get(this.yaml.content, ENVIRONMENT_KEY), path.dirname(this.yaml.path));
      const envYamlContent = utils.getYamlContent(envPath);
      // env.yaml is not exist
      if (isEmpty(envYamlContent)) {
        throw new DevsError(`Environment file [${envPath}] is not found`, {
          tips: 'You can create a new environment file by running `s env init`',
          trackerType: ETrackerType.parseException,
        });
      }
      // default-env.json is not exist
      if (!fs.existsSync(ENVIRONMENT_FILE_PATH)) {
        throw new DevsError('Default env is not found', {
          tips: 'You can set a default environment by running `s env default`',
          trackerType: ETrackerType.parseException,
        });
      }
      const { environments } = envYamlContent;
      // 若存在环境变量，默认项目为devsProject
      const devsProject = process.env.ALIYUN_DEVS_REMOTE_PROJECT_NAME;
      const project = devsProject ? devsProject : get(this.yaml.content, 'name');
      const defaultEnvContent = require(ENVIRONMENT_FILE_PATH);
      const defaultEnv = get(find(defaultEnvContent, { project: project }), 'default');
      // project is not found in default-env.json
      if (!defaultEnv) {
        throw new DevsError('Default env is not found', {
          tips: 'You can set a default environment by running `s env default`',
          trackerType: ETrackerType.parseException,
        });
      }
      const environment = find(environments, item => item.name === defaultEnv);
      // default env is not found in env.yaml
      if (isEmpty(environment)) {
        throw new DevsError(`Default env [${defaultEnv}] was not found`, {
          trackerType: ETrackerType.parseException,
        });
      }
      return { project, environment };
    }
  }
  // specify --env
  private doEnvWithSpecify() {
    // env and extend is conflict
    if (this.yaml.useExtend) {
      // TODO: @封崇
      throw new DevsError('Environment and extend is conflict', {
        trackerType: ETrackerType.parseException,
      });
    }
    const envPath: string = utils.getAbsolutePath(get(this.yaml.content, ENVIRONMENT_KEY, ENVIRONMENT_FILE_NAME), path.dirname(this.yaml.path));
    const envYamlContent = utils.getYamlContent(envPath);
    // env file is not exist
    if (isEmpty(envYamlContent)) {
      throw new DevsError(`Environment file [${envPath}] is not exist`, {
        trackerType: ETrackerType.parseException,
      });
    }
    debug(`environment content: ${JSON.stringify(envYamlContent)}`);
    const { environments } = envYamlContent;
    // 若存在环境变量，默认项目为devsProject
    const devsProject = process.env.ALIYUN_DEVS_REMOTE_PROJECT_NAME;
    const project = devsProject ? devsProject : get(this.yaml.content, 'name');
    const environment = find(environments, item => item.name === this.record.env);
    // env name is not found
    if (isEmpty(environment)) {
      // TODO: @封崇
      throw new DevsError(`Env [${this.record.env}] was not found`, {
        trackerType: ETrackerType.parseException,
      });
    }
    return { project, environment };
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
    // 将命令行参数更新给 this.record
    this.parseArgv();   
    // 处理继承、多环境后, 将 s.yaml 文件信息传入 this.yaml
    await this.doYamlinit();
    // 再次解析参数，比如projectNames
    this.parseArgv();
    if (!this.yaml.use3x) return this.v1();
    const { steps, content, originSteps } = await new ParseContent(this.yaml.content, this.getParsedContentOptions(this.yaml.path)).start();
    // steps 存放每个FC组件/函数的 yaml 配置 ([content.resource] => steps)
    // content 为 yaml 已解析的整体完整信息
    // originSteps 为 steps 的未解析版
    // 获取到真实值后，重新赋值
    this.yaml.content = content;
    this.yaml.vars = get(this.yaml.content, 'vars', {});
    const actions = get(this.yaml.content, 'actions', {});
    this.yaml.actions = this.parseActions(actions);
    const result = {
      steps: this.record.projectName ? steps : this.doFlow(steps, originSteps),
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
  private doFlow(steps: IStep[], originSteps: IStep[]) {
    const newSteps: IStep[] = [];
    const flowObj = find(this.yaml.flow, (item, key) => this.matchFlow(key));
    const orderInstance = new Order(originSteps).start();
    const { steps: orderSteps, dependencies, useOrder } = orderInstance.sort(steps);
    if (!flowObj) return orderSteps;
    debug(`find flow: ${JSON.stringify(flowObj)}`);
    const projectOrder = {} as Record<string, number>;
    const fn = (projects: string[] = [], index: number) => {
      assert(isArray(projects), `flow ${this.record.command} data format is invalid`);
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
    if (useOrder) {
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
        throw new DevsError(`${level} action ${action} is invalid, it must be array`, {
          trackerType: ETrackerType.parseException,
        });
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
