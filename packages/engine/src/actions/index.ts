import {
  IAction,
  IActionLevel,
  IActionType,
  IAllowFailure,
  IComponentAction,
  IHookType,
  IPluginAction,
  IRunAction,
  getInputs,
} from '@serverless-devs/parse-spec';
import { isEmpty, filter, includes, set, get } from 'lodash';
import * as utils from '@serverless-devs/utils';
import { TipsError } from '@serverless-devs/utils';
import fs from 'fs-extra';
import execa from 'execa';
import loadComponent from '@serverless-devs/load-component';
import stringArgv from 'string-argv';
import { getAllowFailure, stringify } from '../utils';
import chalk from 'chalk';
import { ILoggerInstance } from '@serverless-devs/logger';
import { EXIT_CODE } from '../constants';
import { IStepOptions } from '../types';

const debug = require('@serverless-cd/debug')('serverless-devs:engine');

interface IRecord {
  magic: Record<string, any>; // 记录魔法变量
  componentProps: Record<string, any>; // 记录组件的inputs
  pluginOutput: Record<string, any>; // 记录plugin的outputs
  lable: string; // 记录执行的label
  step: IStepOptions; // 记录当前step是
  allowFailure: boolean | IAllowFailure; // step allow_failure > action allow_failure
  command: string; // 记录当前执行的command
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
    this.record.lable =
      this.option.hookLevel === IActionLevel.PROJECT
        ? `project ${this.option.projectName}`
        : IActionLevel.GLOBAL;
    this.logger.debug(`Start executing the ${hookType}-action in ${this.record.lable}`);
    const newHooks = getInputs(hooks, this.record.magic);
    for (const hook of newHooks) {
      debug(`${hook.level} action item: ${stringify(hook)}`);
      this.record.allowFailure =
        this.record.step && 'allow_failure' in this.record.step
          ? get(this.record, 'step.allow_failure')
          : hook.allow_failure;
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
    // pre-action执行完毕，清空pluginOutput, post-action应获取componentProps
    if (hookType === IHookType.PRE) {
      this.record.pluginOutput = {};
    }
    this.logger.debug(`The ${hookType}-action successfully to execute in ${this.record.lable}`);
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
        if (utils.isWindow()) {
          debug('Command run execution environment：CMD');
          debug(
            'Please check whether the actions section of yaml can be executed in the current environment.',
          );
        }
        if (
          getAllowFailure(this.record.allowFailure, {
            exitCode: EXIT_CODE.RUN,
            command: this.record.command,
          })
        )
          return;
        throw new TipsError(error.message, {
          exitCode: EXIT_CODE.RUN,
          prefix: `${this.record.lable} ${hook.hookType}-action failed to execute:`,
        });
      }
      return;
    }
    if (
      getAllowFailure(this.record.allowFailure, {
        exitCode: EXIT_CODE.DEVS,
        command: this.record.command,
      })
    )
      return;
    throw new TipsError(`The ${hook.path} directory does not exist.`, {
      exitCode: EXIT_CODE.DEVS,
      prefix: `${this.record.lable} ${hook.hookType}-action failed to execute:`,
    });
  }
  private async plugin(hook: IPluginAction) {
    try {
      const instance = await loadComponent(hook.value);
      const inputs = isEmpty(this.record.pluginOutput) ? this.inputs : this.record.pluginOutput;
      this.record.pluginOutput = await instance(inputs, hook.args);
    } catch (e) {
      const error = e as Error;
      if (
        getAllowFailure(this.record.allowFailure, {
          exitCode: EXIT_CODE.PLUGIN,
          command: this.record.command,
        })
      )
        return;
      throw new TipsError(error.message, {
        exitCode: EXIT_CODE.PLUGIN,
        prefix: `${this.record.lable} ${hook.hookType}-action failed to execute:`,
      });
    }
  }
  private async component(hook: IComponentAction) {
    const argv = stringArgv(hook.value);
    const { _ } = utils.parseArgv(argv);
    const [componentName, command] = _;
    const instance = await loadComponent(componentName, { logger: this.logger });
    if (instance[command]) {
      // 方法存在，执行报错，退出码101
      const newInputs = {
        ...this.record.componentProps,
        argv: filter(argv.slice(2), (o) => !includes([componentName, command], o)),
      };
      try {
        return await instance[command](newInputs);
      } catch (e) {
        const error = e as Error;
        if (
          getAllowFailure(this.record.allowFailure, {
            exitCode: EXIT_CODE.COMPONENT,
            command: this.record.command,
          })
        )
          return;
        throw new TipsError(error.message, {
          exitCode: EXIT_CODE.COMPONENT,
          prefix: `${this.record.lable} ${hook.hookType}-action failed to execute:`,
        });
      }
    }
    if (
      getAllowFailure(this.record.allowFailure, {
        exitCode: EXIT_CODE.DEVS,
        command: this.record.command,
      })
    )
      return;
    // 方法不存在，此时系统将会认为是未找到组件方法，系统的exit code为100；
    throw new TipsError(`The [${command}] command was not found.`, {
      exitCode: EXIT_CODE.DEVS,
      prefix: `${this.record.lable} ${hook.hookType}-action failed to execute:`,
      tips: `Please check the component ${componentName} has the ${command} command. Serverless Devs documents：${chalk.underline(
        'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command',
      )}`,
    });
  }
}

export default Actions;
