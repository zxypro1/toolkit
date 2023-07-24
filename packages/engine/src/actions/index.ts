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
import { command } from 'execa';
import loadComponent from '@serverless-devs/load-component';
import stringArgv from 'string-argv';
import { getAllowFailure, getProcessTime, stringify } from '../utils';
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
  startTime: number; // 记录开始时间
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
  async start(hookType: `${IHookType}`, inputs: Record<string, any> = {}) {
    try {
      return await this.afterStart(hookType, inputs);
    } catch (error) {
      if (this.option.hookLevel === IActionLevel.GLOBAL) {
        this.logger.write(
          `${chalk.red('✖')} ${chalk.gray(
            `Global ${hookType}-action failed to [${this.record.command}] (${getProcessTime(
              this.record.startTime,
            )}s)`,
          )}`,
        );
      }
      throw error;
    }
  }
  private async afterStart(hookType: `${IHookType}`, inputs: Record<string, any> = {}) {
    if (this.option.skipActions) return {};
    this.inputs = inputs;
    const hooks = filter(this.actions, (item) => item.hookType === hookType);
    if (isEmpty(hooks)) return {};
    this.record.startTime = Date.now();
    this.record.lable =
      this.option.hookLevel === IActionLevel.PROJECT
        ? `project ${this.option.projectName}`
        : IActionLevel.GLOBAL;
    this.logger.debug(`Start executing the ${hookType}-action in ${this.record.lable}`);
    const newHooks = getInputs(hooks, this.record.magic);
    // post-action应获取componentProps, 先清空pluginOutput
    if (hookType !== IHookType.PRE) {
      this.record.pluginOutput = {};
    }
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
    this.logger.debug(`The ${hookType}-action successfully to execute in ${this.record.lable}`);

    if (this.option.hookLevel === IActionLevel.GLOBAL) {
      this.logger.write(
        `${chalk.green('✔')} ${chalk.gray(
          `Global ${hookType}-action completed (${getProcessTime(this.record.startTime)})`,
        )}`,
      );
    }
    return this.record;
  }
  private onFinish(cp: any) {
    return new Promise((resolve, reject) => {
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      cp.stdout.on('data', (chunk: Buffer) => {
        this.logger.append(chunk.toString());
        stdout.push(chunk);
      });

      cp.stderr.on('data', (chunk: Buffer) => {
        this.logger.append(chunk.toString());
        stderr.push(chunk);
      });
      cp.on('exit', (code: number) => {
        code === 0 ? resolve({}) : reject(new Error(Buffer.concat(stderr).toString()));
      });
    });
  }
  private async run(hook: IRunAction) {
    if (fs.existsSync(hook.path) && fs.lstatSync(hook.path).isDirectory()) {
      try {
        const cp = command(hook.value, {
          cwd: hook.path,
          shell: true,
        });
        await this.onFinish(cp);
      } catch (e) {
        const error = e as Error;
        if (utils.isWindow()) {
          debug('Command run execution environment：CMD');
          debug(
            'Please check whether the actions section of yaml can be executed in the current environment.',
          );
        }
        const useAllowFailure = getAllowFailure(this.record.allowFailure, {
          exitCode: EXIT_CODE.RUN,
          command: this.record.command,
        });
        if (useAllowFailure) return;
        throw new TipsError(error.message, {
          exitCode: EXIT_CODE.RUN,
          prefix: `${this.record.lable} ${hook.hookType}-action failed to execute:`,
        });
      }
      return;
    }
    const useAllowFailure = getAllowFailure(this.record.allowFailure, {
      exitCode: EXIT_CODE.DEVS,
      command: this.record.command,
    });
    if (useAllowFailure) return;
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
      const useAllowFailure = getAllowFailure(this.record.allowFailure, {
        exitCode: EXIT_CODE.PLUGIN,
        command: this.record.command,
      });
      if (useAllowFailure) return;
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
        const useAllowFailure = getAllowFailure(this.record.allowFailure, {
          exitCode: EXIT_CODE.COMPONENT,
          command: this.record.command,
        });
        if (useAllowFailure) return;
        throw new TipsError(error.message, {
          exitCode: EXIT_CODE.COMPONENT,
          prefix: `${this.record.lable} ${hook.hookType}-action failed to execute:`,
        });
      }
    }
    const useAllowFailure = getAllowFailure(this.record.allowFailure, {
      exitCode: EXIT_CODE.DEVS,
      command: this.record.command,
    });
    if (useAllowFailure) return;
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
