import { IAction, IActionLevel, IActionType, IAllowFailure, IComponentAction, IHookType, IPluginAction, IRunAction, getInputs } from '@serverless-devs/parse-spec';
import { isEmpty, filter, includes, set, get } from 'lodash';
import * as utils from '@serverless-devs/utils';
import { DevsError, ETrackerType } from '@serverless-devs/utils';
import fs from 'fs-extra';
import { spawn } from 'child_process';
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
  step: IStepOptions; // 记录当前step
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
  // Set value to the record of the action.
  public setValue(key: string, value: any) {
    if (this.option.skipActions) return;
    set(this.record, key, value);
  }

  /**
   * Initiates the execution of actions based on the given hook type.
   *
   * This function will attempt to execute the appropriate actions based on the hook type provided.
   * If there's an error during the process, especially for GLOBAL hook level, it logs the failure.
   *
   * @param hookType The type of hook (e.g. PRE, POST) that determines which actions should be executed.
   * @param inputs Optional inputs that might be used during the execution of actions.
   * @returns Returns a record containing relevant data from the execution.
   *
   * @throws {DevsError} Throws a DevsError if there's an error during the action execution.
   *
   * @example
   * const result = await actionsInstance.start('pre');
   */
  async start(hookType: `${IHookType}`, inputs: Record<string, any> = {}) {
    try {
      return await this.afterStart(hookType, inputs);
    } catch (error) {
      let err = error as Error;
      if (this.option.hookLevel === IActionLevel.GLOBAL) {
        this.logger.write(
          `${chalk.red('✖')} ${chalk.gray(`${IActionLevel.GLOBAL} ${hookType}-action failed to [${this.record.command}] (${getProcessTime(this.record.startTime)}s)`)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Executes actions post the initial starting phase based on the given hook type.
   *
   * This is an internal function primarily used after the initial start of the actions
   * to handle the actual execution of the actions based on the hook type.
   * It filters the actions to be executed based on the hook type, logs their start,
   * and then dispatches them to their respective handler methods based on their action type.
   *
   * @private
   *
   * @param {string} hookType - The type of hook (e.g. PRE, POST) determining which actions should be executed.
   * @param {Record<string, any>} [inputs={}] - Optional inputs that might be used during the execution of actions.
   *
   * @returns {Promise<Record<string, any>>} - Returns a record containing relevant data from the execution.
   *
   * @throws {DevsError} - Throws a DevsError if there's an error during the action execution.
   *
   * @example
   * const result = await actionsInstance.afterStart('PRE');
   */
  private async afterStart(hookType: `${IHookType}`, inputs: Record<string, any> = {}) {
    if (this.option.skipActions) return {};
    this.inputs = inputs;
    // Attempt to fit post_<command> hook.
    if(hookType === IHookType.COMPLETE && this.actions.find(item => item.hookType === IHookType.POST)) {
      this.actions = this.actions.map(item => item.hookType === IHookType.POST ? {...item, hookType: IHookType.COMPLETE} : item);      
      this.logger.warn(`The action hook 'post-<command>' has been renamed to 'complete-<command>'. 
You can still use them now, but we suggest to modify them.`)
    }
    const hooks = filter(this.actions, item => item.hookType === hookType);
    if (isEmpty(hooks)) return {};
    this.record.startTime = Date.now();
    this.record.lable = this.option.hookLevel === IActionLevel.PROJECT ? `[${this.option.projectName}]` : IActionLevel.GLOBAL;
    this.logger.debug(`Start executing the ${hookType}-action in ${this.record.lable}`);
    // 确保 hooks 中的变量均为解析过后的真实值
    const newHooks = getInputs(hooks, this.record.magic);  
    // post-action应获取componentProps, 先清空pluginOutput
    if (hookType !== IHookType.PRE) {
      this.record.pluginOutput = {};
    }
    for (const hook of newHooks) {
      debug(`${hook.level} action item: ${stringify(hook)}`);
      this.record.allowFailure = this.record.step && 'allow_failure' in this.record.step ? get(this.record, 'step.allow_failure') : hook.allow_failure;
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
      this.logger.write(`${chalk.green('✔')} ${chalk.gray(`${IActionLevel.GLOBAL} ${hookType}-action completed (${getProcessTime(this.record.startTime)})`)}`);
    }
    return this.record;
  }

  /**
   * Monitors the completion of a given command process.
   *
   * @param cp - The command process to be monitored.
   *
   * @returns Promise<object> - Resolves with an empty object if the command process completes successfully.
   *                            Rejects with an error if the command process encounters an error.
   */
  private onFinish(cp: any) {
    return new Promise((resolve, reject) => {
      // Arrays to store stdout and stderr data from the command process.
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];

      // Listen to the 'data' event of stdout. Append the data chunk to the logger and the stdout array.
      cp.stdout.on('data', (chunk: Buffer) => {
        this.logger.append(chunk.toString());
        stdout.push(chunk);
      });

      // Listen to the 'data' event of stderr. Append the data chunk to the logger and the stderr array.
      cp.stderr.on('data', (chunk: Buffer) => {
        this.logger.append(chunk.toString());
        stderr.push(chunk);
      });

      // Listen to the 'exit' event of the command process.
      // If the process exits with a code of 0, resolve the promise.
      // If the process exits with a non-zero code, reject the promise with the accumulated stderr as the error message.
      cp.on('exit', (code: number) => {
        code === 0 ? resolve({}) : reject(new Error(Buffer.concat(stderr).toString()));
      });
    });
  }

  /**
   * Executes the action specified by the provided hook.
   *
   * @param hook - The action hook specifying the command to run and its associated configurations.
   *
   * @throws DevsError - Throws an error if the command execution fails or if the specified directory does not exist.
   *
   * @returns Promise<void> - Resolves once the command has been executed.
   */
  private async run(hook: IRunAction) {
    // Check if the provided path exists and is a directory.
    if (fs.existsSync(hook.path) && fs.lstatSync(hook.path).isDirectory()) {
      try {
        // Execute the command in the specified directory.
        const cp = spawn(hook.value, {
          cwd: hook.path,
          shell: true,
        });
        await this.onFinish(cp);
      } catch (e) {
        const error = e as Error;
        // If the current environment is Windows, log additional debugging information.
        if (utils.isWindow()) {
          debug('Command run execution environment：CMD');
          debug('Please check whether the actions section of yaml can be executed in the current environment.');
        }
        // Check if the error can be safely ignored.
        const useAllowFailure = getAllowFailure(this.record.allowFailure, {
          exitCode: EXIT_CODE.RUN,
          command: this.record.command,
        });
        if (useAllowFailure) return;
        throw new DevsError(error.message, {
          data: get(e, 'data'),
          stack: error.stack,
          exitCode: EXIT_CODE.RUN,
          prefix: `${this.record.lable} ${hook.hookType}-action failed to [${this.record.command}]:`,
          trackerType: ETrackerType.runtimeException,
        });
      }
      return;
    }
    // Check if the error related to a non-existent directory can be safely ignored.
    const useAllowFailure = getAllowFailure(this.record.allowFailure, {
      exitCode: EXIT_CODE.DEVS,
      command: this.record.command,
    });
    if (useAllowFailure) return;
    throw new DevsError(`The ${hook.path} directory does not exist.`, {
      exitCode: EXIT_CODE.DEVS,
      prefix: `${this.record.lable} ${hook.hookType}-action failed to [${this.record.command}]:`,
      trackerType: ETrackerType.parseException,
    });
  }

  /**
   * Loads and executes a specified plugin.
   *
   * This function attempts to load a plugin component, then invokes it with the appropriate inputs.
   * If the plugin execution fails and the failure is allowed (based on the record's allowFailure setting),
   * it gracefully handles the error without throwing. Otherwise, it throws a DevsError.
   *
   * @param hook - An object representing the plugin action to be executed.
   *
   * @throws DevsError - Throws a DevsError if the plugin execution fails and the failure is not allowed.
   */
  private async plugin(hook: IPluginAction) {
    try {
      // Load the plugin component.
      const instance = await loadComponent(hook.value);
      // Determine the inputs for the plugin based on the record's pluginOutput.
      const inputs = isEmpty(this.record.pluginOutput) ? this.inputs : this.record.pluginOutput;
      // Execute the plugin with the determined inputs and provided arguments.
      this.record.pluginOutput = await instance(inputs, hook.args, this.logger);
    } catch (e) {
      const error = e as Error;
      // Check if the failure is allowed based on the record's allowFailure setting.
      const useAllowFailure = getAllowFailure(this.record.allowFailure, {
        exitCode: EXIT_CODE.PLUGIN,
        command: this.record.command,
      });
      if (useAllowFailure) return;
      throw new DevsError(error.message, {
        data: get(e, 'data'),
        stack: error.stack,
        exitCode: EXIT_CODE.PLUGIN,
        prefix: `${this.record.lable} ${hook.hookType}-action failed to [${this.record.command}]:`,
        trackerType: ETrackerType.runtimeException,
      });
    }
  }

  /**
   * Loads and executes a specified component command.
   *
   * This function tries to load a given component and run the specified command for it.
   * If the component command execution fails and the failure is allowed (based on the record's allowFailure setting),
   * it gracefully handles the error without throwing. If the command does not exist for the component,
   * it throws an error indicating the missing command.
   *
   * @param hook - An object representing the component action to be executed.
   *
   * @throws DevsError - Throws a DevsError if:
   *                     1. The component command execution fails and the failure is not allowed.
   *                     2. The specified command does not exist for the component.
   */
  private async component(hook: IComponentAction) {
    // Parse the command and arguments from the hook value.
    const argv = stringArgv(hook.value);
    const { _ } = utils.parseArgv(argv);
    const [componentName, command] = _;

    // Load the specified component.
    const instance = await loadComponent(componentName, { logger: this.logger });

    // Check if the specified command exists for the component.
    if (instance[command]) {
      // 方法存在，执行报错，退出码101
      const newInputs = {
        ...this.record.componentProps,
        argv: filter(argv.slice(2), o => !includes([componentName, command], o)),
      };
      try {
        // Execute the command for the component with the prepared inputs.
        return await instance[command](newInputs);
      } catch (e) {
        const error = e as Error;
        // Check if the failure is allowed based on the record's allowFailure setting.
        const useAllowFailure = getAllowFailure(this.record.allowFailure, {
          exitCode: EXIT_CODE.COMPONENT,
          command: this.record.command,
        });
        if (useAllowFailure) return;
        throw new DevsError(error.message, {
          data: get(e, 'data'),
          stack: error.stack,
          exitCode: EXIT_CODE.COMPONENT,
          prefix: `${this.record.lable} ${hook.hookType}-action failed to [${this.record.command}]:`,
          trackerType: ETrackerType.runtimeException,
        });
      }
    }

    // Check if the failure (due to missing command) is allowed.
    const useAllowFailure = getAllowFailure(this.record.allowFailure, {
      exitCode: EXIT_CODE.DEVS,
      command: this.record.command,
    });
    if (useAllowFailure) return;
    // 方法不存在，此时系统将会认为是未找到组件方法，系统的exit code为100；
    throw new DevsError(`The [${command}] command was not found.`, {
      exitCode: EXIT_CODE.DEVS,
      prefix: `${this.record.lable} ${hook.hookType}-action failed to [${this.record.command}]:`,
      tips: `Please check the component ${componentName} has the ${command} command. Serverless Devs documents：${chalk.underline(
        'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command',
      )}`,
      trackerType: ETrackerType.parseException,
    });
  }
}

export default Actions;
