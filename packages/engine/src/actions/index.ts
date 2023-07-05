import {
  IAction,
  IActionLevel,
  IActionType,
  IComponentAction,
  IHookType,
  IPluginAction,
  IRunAction,
  getInputs,
} from '@serverless-devs/parse-spec';
import { isEmpty, filter, includes, set } from 'lodash';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import execa from 'execa';
import loadComponent from '@serverless-devs/load-component';
import stringArgv from 'string-argv';
import { throwError, stringify, throw101Error, throw100Error } from '../utils';
import chalk from 'chalk';
import { ILoggerInstance } from '@serverless-devs/logger';

const debug = require('@serverless-cd/debug')('serverless-devs:engine');

interface IRecord {
  magic: Record<string, any>;
  componentProps: Record<string, any>;
  pluginOutput: Record<string, any>;
}

interface IOptions {
  hookLevel: `${IActionLevel}`;
  projectName?: string;
  logger: ILoggerInstance;
  skipActions?: boolean;
}

class Actions {
  private record = {} as IRecord;
  private logger: ILoggerInstance;
  private inputs: Record<string, any> = {};
  constructor(private actions: IAction[] = [], private option = {} as IOptions) {
    this.logger = option.logger;
  }
  public setValue(key: string, value: any) {
    if (this.option.skipActions) return;
    set(this.record, key, value);
  }
  public async start(hookType: `${IHookType}`, inputs: Record<string, any> = {}) {
    if (this.option.skipActions) return {};
    this.inputs = inputs;
    const hooks = filter(this.actions, (item) => item.hookType === hookType);
    if (isEmpty(hooks)) return {};
    this.logger.info(
      `Start the ${hookType}-action in ${
        this.option.hookLevel === IActionLevel.PROJECT
          ? `${this.option.projectName} project`
          : IActionLevel.GLOBAL
      }`,
    );
    const newHooks = getInputs(hooks, this.record.magic);
    for (const hook of newHooks) {
      debug(`${hook.level} action item: ${stringify(hook)}`);
      if (hook.actionType === IActionType.RUN) {
        await this.run(hook);
      }
      if (hook.actionType === IActionType.PLUGIN) {
        await this.plugin(hook);
      }
      // 项目action才有component
      if (hook.actionType === IActionType.COMPONENT && hook.level === IActionLevel.PROJECT) {
        await this.component(hook);
      }
    }
    this.logger.info(
      `End the ${hookType}-action in ${
        this.option.hookLevel === IActionLevel.PROJECT
          ? `${this.option.projectName} project`
          : IActionLevel.GLOBAL
      }`,
    );
    return this.record;
  }
  private async run(hook: IRunAction) {
    if (fs.existsSync(hook.path) && fs.lstatSync(hook.path).isDirectory()) {
      try {
        execa.sync(hook.value, {
          cwd: hook.path,
          stdio: 'inherit',
          shell: true,
        });
      } catch (e) {
        const error = e as Error;
        // pre hook, throw error
        if (hook.hookType !== IHookType.PRE) return;
        if (utils.isWindow()) {
          debug('Command run execution environment：CMD');
          debug(
            'Please check whether the actions section of yaml can be executed in the current environment.',
          );
        }
        throwError('Global pre-action failed to execute:' + error.message);
      }
    }
  }
  private async plugin(hook: IPluginAction) {
    const instance = await loadComponent(hook.value);
    // TODO: inputs
    const inputs = isEmpty(this.record.pluginOutput) ? this.inputs : this.record.pluginOutput;
    this.record.pluginOutput = await instance(inputs, hook.args);
  }
  private async component(hook: IComponentAction) {
    const argv = stringArgv(hook.value);
    const { _ } = utils.parseArgv(argv);
    const [componentName, method] = _;
    const instance = await loadComponent(componentName, { logger: this.logger });
    if (instance[method]) {
      // 方法存在，执行报错，退出码101
      const newInputs = {
        ...this.record.componentProps,
        argv: filter(argv.slice(2), (o) => !includes([componentName, method], o)),
      };
      try {
        return await instance[method](newInputs);
      } catch (error) {
        throw101Error(error as Error, `${hook.actionType}-action failed to execute:`);
      }
    }
    // 方法不存在，此时系统将会认为是未找到组件方法，系统的exit code为100；
    throw100Error(
      `The [${method}] command was not found.`,
      `Please check the component ${componentName} has the ${method} method. Serverless Devs documents：${chalk.underline(
        'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command',
      )}`,
    );
  }
}

export default Actions;
