import { createMachine, interpret } from 'xstate';
import {
  isEmpty,
  get,
  each,
  map,
  isFunction,
  has,
  uniqueId,
  filter,
  omit,
  includes,
  set,
} from 'lodash';
import {
  IStepOptions,
  IRecord,
  IStatus,
  IEngineOptions,
  IContext,
  IEngineError,
  STEP_STATUS,
} from './types';
import { getProcessTime, getCredential, stringify, randomId, getAllowFailure } from './utils';
import ParseSpec, {
  getInputs,
  ISpec,
  IHookType,
  IStep as IParseStep,
  IActionLevel,
} from '@serverless-devs/parse-spec';
import path from 'path';
import chalk from 'chalk';
import Actions from './actions';
import Credential from '@serverless-devs/credential';
import loadComponent from '@serverless-devs/load-component';
import Logger, { ILoggerInstance } from '@serverless-devs/logger';
import * as utils from '@serverless-devs/utils';
import { DevsError } from '@serverless-devs/utils';
import { EXIT_CODE } from './constants';
import assert from 'assert';

export { IEngineOptions, IContext, IEngineError } from './types';

const debug = require('@serverless-cd/debug')('serverless-devs:engine');

class Engine {
  public context = {
    status: STEP_STATUS.PENING,
    completed: false,
    error: [] as IEngineError[],
  } as IContext;
  private record = { status: STEP_STATUS.PENING, editStatusAble: true } as IRecord;
  private spec = {} as ISpec;
  private glog!: Logger;
  private logger!: ILoggerInstance;
  private parseSpecInstance!: ParseSpec;
  private globalActionInstance!: Actions; // 全局的 action
  private actionInstance!: Actions; // 项目的 action
  constructor(private options: IEngineOptions) {
    debug('engine start');
    // 初始化参数
    this.options.args = get(this.options, 'args', process.argv.slice(2));
    this.options.cwd = get(this.options, 'cwd', process.cwd());
    this.options.template = utils.getAbsolutePath(get(this.options, 'template'), this.options.cwd);
    debug(`engine options: ${stringify(options)}`);
  }
  private async beforeStart() {
    // 初始化 spec
    this.parseSpecInstance = new ParseSpec(get(this.options, 'template'), this.options.args);
    this.spec = this.parseSpecInstance.start();
    // 初始化行参环境变量 > .env (parse-spec require .env)
    each(this.options.env, (value, key) => {
      process.env[key] = value;
    });
    const { steps: _steps } = this.spec;
    // 参数校验
    this.validate();
    // 初始化 logger
    this.glog = this.getLogger() as Logger;
    this.logger = this.glog.__generate('engine');
    this.context.steps = await this.download(_steps);
  }
  // engine应收敛所有的异常，不应该抛出异常
  async start() {
    this.context.status = STEP_STATUS.RUNNING;
    try {
      await this.beforeStart();
    } catch (error) {
      this.context.status = STEP_STATUS.FAILURE;
      this.context.completed = true;
      this.context.error.push(error as IEngineError);
      return this.context;
    }
    const { steps: _steps, yaml, command, access = yaml.access } = this.spec;
    this.logger.write(
      `⌛ Steps for [${command}] of [${get(this.spec, 'yaml.appName')}]\n${chalk.gray(
        '====================',
      )}`,
    );
    // 初始化全局的 action
    this.globalActionInstance = new Actions(yaml.actions, {
      hookLevel: IActionLevel.GLOBAL,
      logger: this.logger,
      skipActions: this.spec.skipActions,
    });
    const credential = await getCredential(access, this.logger);
    // 处理 global-pre
    try {
      this.globalActionInstance.setValue('magic', this.getFilterContext());
      this.globalActionInstance.setValue('command', command);
      await this.globalActionInstance.start(IHookType.PRE, { access, credential });
    } catch (error) {
      this.context.error.push(error as DevsError);
      this.context.status = STEP_STATUS.FAILURE;
      await this.doCompleted();
      return this.context;
    }
    this.context.steps = map(this.context.steps, (item) => {
      return { ...item, stepCount: uniqueId(), status: STEP_STATUS.PENING, done: false };
    });
    const res: IContext = await new Promise(async (resolve) => {
      const states: any = {
        init: {
          on: {
            INIT: get(this.context.steps, '[0].stepCount'),
          },
        },
        final: {
          type: 'final',
          invoke: {
            src: async () => {
              // 执行终态是 error-with-continue 的时候，改为 success
              const status =
                this.record.status === STEP_STATUS.ERROR_WITH_CONTINUE
                  ? STEP_STATUS.SUCCESS
                  : this.record.status;
              this.context.status = status;
              await this.doCompleted();
              this.context.steps = map(this.context.steps, (item) => omit(item, ['instance']));
              this.context.output = this.getOutput();
              debug(`context: ${stringify(this.context)}`);
              debug('engine end');
              resolve(this.context);
            },
          },
        },
      };

      each(this.context.steps, (item, index) => {
        const target = this.context.steps[index + 1]
          ? get(this.context.steps, `[${index + 1}].stepCount`)
          : 'final';
        const flowProject = yaml.useFlow
          ? filter(this.context.steps, (o) => o.flowId === item.flowId)
          : [item];
        states[item.stepCount as string] = {
          invoke: {
            id: item.stepCount,
            src: async () => {
              // 并行时如果已经执行，则跳过。
              if (item.done) return;
              this.record.startTime = Date.now();
              // 记录 context
              this.recordContext(item, { status: STEP_STATUS.RUNNING });
              // 检查全局的执行状态，如果是failure，则不执行该步骤, 并记录状态为 skipped
              if (this.record.status === STEP_STATUS.FAILURE) {
                return await Promise.all(map(flowProject, (o) => this.doSkip(o)));
              }
              return await Promise.all(map(flowProject, (o) => this.handleSrc(o)));
            },
            onDone: {
              target,
            },
            onError: target,
          },
        };
      });

      const fetchMachine = createMachine({
        predictableActionArguments: true,
        id: 'step',
        initial: 'init',
        states,
      });

      const stepService = interpret(fetchMachine)
        .onTransition((state) => state.value)
        .start();
      stepService.send('INIT');
    });
    this.glog.__clear();
    return res;
  }
  private getOutput() {
    const output = {};
    each(this.context.steps, (item) => {
      if (!isEmpty(item.output)) {
        set(output, item.projectName, item.output);
      }
    });
    return output;
  }
  private validate() {
    const { steps, command } = this.spec;
    assert(!isEmpty(steps), 'steps is required');
    assert(command, 'command is required');
  }
  private async download(steps: IParseStep[]) {
    const newSteps = [];
    for (const step of steps) {
      const logger = this.glog.__generate(step.projectName);
      const instance = await loadComponent(step.component, {
        logger,
        engineLogger: this.logger,
      });
      newSteps.push({ ...step, instance, logger });
    }
    return newSteps;
  }
  private getLogger() {
    const customLogger = get(this.options, 'logConfig.customLogger');
    if (customLogger) {
      debug('use custom logger');
      if (customLogger?.CODE === Logger.CODE) {
        return customLogger;
      }
      throw new Error('customLogger must be instance of Logger');
    }
    return new Logger({
      traceId: get(process.env, 'serverless_devs_trace_id', randomId()),
      logDir: path.join(utils.getRootHome(), 'logs'),
      ...this.options.logConfig,
      level: get(this.options, 'logConfig.level', this.spec.debug ? 'DEBUG' : undefined),
    });
  }
  private recordContext(item: IStepOptions, options: Record<string, any> = {}) {
    const { status, error, output, process_time, props, done } = options;
    this.context.stepCount = item.stepCount as string;
    this.context.steps = map(this.context.steps, (obj) => {
      if (obj.stepCount === item.stepCount) {
        if (status) {
          obj.status = status;
        }
        if (error) {
          obj.error = error;
          this.context.error.push(error);
        }
        if (props) {
          obj.props = props;
        }
        if (output) {
          obj.output = output;
        }
        if (done) {
          obj.done = done;
        }
        if (has(options, 'process_time')) {
          obj.process_time = process_time;
        }
      }
      return obj;
    });
  }
  private getFilterContext(item?: IStepOptions) {
    const data = {
      cwd: path.dirname(this.spec.yaml.path),
      vars: this.spec.yaml.vars,
    } as Record<string, any>;
    for (const obj of this.context.steps) {
      data[obj.projectName] = { output: obj.output || {}, props: obj.props || {} };
    }
    if (item) {
      data.credential = item.credential;
      data.that = {
        name: item.projectName,
        access: item.access,
        component: item.component,
        props: data[item.projectName].props,
        output: data[item.projectName].output,
      };
    }
    return data;
  }
  private async doCompleted() {
    this.context.completed = true;
    if (this.context.status === STEP_STATUS.FAILURE) {
      try {
        await this.globalActionInstance.start(IHookType.FAIL, this.context);
      } catch (error) {
        this.context.status = STEP_STATUS.FAILURE;
        this.context.error.push(error as DevsError);
      }
    }
    if (this.context.status === STEP_STATUS.SUCCESS) {
      try {
        await this.globalActionInstance.start(IHookType.SUCCESS, this.context);
      } catch (error) {
        this.context.status = STEP_STATUS.FAILURE;
        this.context.error.push(error as DevsError);
      }
    }
    try {
      await this.globalActionInstance.start(IHookType.COMPLETE, this.context);
    } catch (error) {
      this.context.status = STEP_STATUS.FAILURE;
      this.context.error.push(error as DevsError);
    }
  }
  private async handleSrc(item: IStepOptions) {
    const { command } = this.spec;
    try {
      // project pre hook and project component
      await this.handleAfterSrc(item);
    } catch (error) {
      // project fail hook
      try {
        const res = await this.actionInstance.start(IHookType.FAIL, this.record.componentProps);
        this.recordContext(item, get(res, 'pluginOutput', {}));
      } catch (error) {
        this.record.status = STEP_STATUS.FAILURE;
        this.recordContext(item, { error });
      }
    }
    // 若记录的全局状态为true，则进行输出成功的日志
    if (this.record.status === STEP_STATUS.SUCCESS) {
      // project success hook
      try {
        // 项目的output, 再次获取魔法变量
        this.actionInstance.setValue('magic', this.getFilterContext(item));
        const res = await this.actionInstance.start(IHookType.SUCCESS, {
          ...this.record.componentProps,
          output: get(item, 'output', {}),
        });
        this.recordContext(item, get(res, 'pluginOutput', {}));
      } catch (error) {
        this.record.status = STEP_STATUS.FAILURE;
        this.recordContext(item, { error });
      }
    }
    // project complete hook
    try {
      const res = await this.actionInstance.start(IHookType.COMPLETE, {
        ...this.record.componentProps,
        output: get(item, 'output', {}),
      });
      this.recordContext(item, get(res, 'pluginOutput', {}));
    } catch (error) {
      this.record.status = STEP_STATUS.FAILURE;
      this.recordContext(item, { error });
    }
    // 记录项目已经执行完成
    const process_time = getProcessTime(this.record.startTime);
    this.recordContext(item, { done: true, process_time });

    if (this.record.status === STEP_STATUS.SUCCESS) {
      this.logger.write(
        `${chalk.green('✔')} ${chalk.gray(`[${item.projectName}] completed (${process_time}s)`)}`,
      );
    }
    if (this.record.status === STEP_STATUS.FAILURE) {
      this.logger.write(
        `${chalk.red('✖')} ${chalk.gray(
          `[${item.projectName}] failed to [${command}] (${process_time}s)`,
        )}`,
      );
    }
    // step执行完成后，释放logger
    this.glog.__unset(item.projectName);
  }
  private async handleAfterSrc(item: IStepOptions) {
    try {
      debug(`project item: ${stringify(item)}`);
      const { command } = this.spec;
      item.credential = await getCredential(item.access, this.logger);
      each(item.credential, (v) => {
        this.glog.__setSecret([v]);
      });
      const newAction = this.parseSpecInstance.parseActions(item.actions, IActionLevel.PROJECT);
      debug(`project actions: ${JSON.stringify(newAction)}`);
      this.actionInstance = new Actions(newAction, {
        hookLevel: IActionLevel.PROJECT,
        projectName: item.projectName,
        logger: item.logger,
        skipActions: this.spec.skipActions,
      });
      this.actionInstance.setValue('magic', this.getFilterContext(item));
      this.actionInstance.setValue('step', item);
      this.actionInstance.setValue('command', command);
      const newInputs = await this.getProps(item);
      const pluginResult = await this.actionInstance.start(IHookType.PRE, newInputs);
      const response: any = await this.doSrc(item, pluginResult);
      // 记录全局的执行状态
      if (this.record.editStatusAble) {
        this.record.status = STEP_STATUS.SUCCESS;
      }
      // id 添加状态
      if (item.id) {
        this.record.steps = {
          ...this.record.steps,
          [item.id]: {
            status: STEP_STATUS.SUCCESS,
            output: response,
          },
        };
      }
      this.recordContext(item, { status: STEP_STATUS.SUCCESS, output: response });
    } catch (e) {
      const error = e as Error;
      const status =
        item['continue-on-error'] === true ? STEP_STATUS.ERROR_WITH_CONTINUE : STEP_STATUS.FAILURE;
      // 记录全局的执行状态
      if (this.record.editStatusAble) {
        this.record.status = status as IStatus;
      }
      if (status === STEP_STATUS.FAILURE) {
        // 全局的执行状态一旦失败，便不可修改
        this.record.editStatusAble = false;
      }
      if (item.id) {
        this.record.steps = {
          ...this.record.steps,
          [item.id]: {
            status,
          },
        };
      }
      if (item['continue-on-error']) {
        this.recordContext(item, { status });
      } else {
        this.recordContext(item, { status, error });
        throw error;
      }
    }
  }
  private async getProps(item: IStepOptions) {
    const magic = this.getFilterContext(item);
    debug(`magic context: ${JSON.stringify(magic)}`);
    const newInputs = getInputs(item.props, magic);
    const { projectName, command } = this.spec;
    const result = {
      cwd: this.options.cwd,
      name: get(this.spec, 'yaml.appName'),
      props: newInputs,
      command,
      args: filter(this.options.args, (o) => !includes([projectName, command], o)),
      yaml: {
        path: get(this.spec, 'yaml.path'),
      },
      resource: {
        name: item.projectName,
        component: item.component,
        access: item.access,
      },
      outputs: this.getOutput(),
      getCredential: async () => {
        const res = await new Credential({ logger: this.logger }).get(item.access);
        return get(res, 'credential', {});
      },
    };
    this.recordContext(item, { props: newInputs });
    debug(`get props: ${JSON.stringify(result)}`);
    return result;
  }
  private async doSrc(item: IStepOptions, data: Record<string, any> = {}) {
    const { command = '', projectName } = this.spec;
    const newInputs = await this.getProps(item);
    this.record.componentProps = isEmpty(data.pluginOutput) ? newInputs : data.pluginOutput;
    debug(`component props: ${stringify(this.record.componentProps)}`);
    this.actionInstance.setValue('componentProps', this.record.componentProps);
    // 服务级操作
    if (projectName) {
      if (isFunction(item.instance[command])) {
        // 方法存在，执行报错，退出码101
        try {
          return await item.instance[command](this.record.componentProps);
        } catch (e) {
          const useAllowFailure = getAllowFailure(item.allow_failure, {
            exitCode: EXIT_CODE.COMPONENT,
            command,
          });
          if (useAllowFailure) return;
          const error = e as Error;
          throw new DevsError(error.message, {
            exitCode: EXIT_CODE.COMPONENT,
            prefix: `[${item.projectName}] failed to [${command}]:`,
          });
        }
      }
      const useAllowFailure = getAllowFailure(item.allow_failure, {
        exitCode: EXIT_CODE.DEVS,
        command,
      });
      if (useAllowFailure) return;
      // 方法不存在，此时系统将会认为是未找到组件方法，系统的exit code为100；
      throw new DevsError(`The [${command}] command was not found.`, {
        exitCode: EXIT_CODE.DEVS,
        tips: `Please check the component ${item.component
          } has the ${command} command. Serverless Devs documents：${chalk.underline(
            'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command',
          )}`,
        prefix: `[${item.projectName}] failed to [${command}]:`,
      });
    }
    // 应用级操作
    if (isFunction(item.instance[command])) {
      // 方法存在，执行报错，退出码101
      try {
        return await item.instance[command](this.record.componentProps);
      } catch (e) {
        const useAllowFailure = getAllowFailure(item.allow_failure, {
          exitCode: EXIT_CODE.COMPONENT,
          command,
        });
        if (useAllowFailure) return;
        const error = e as Error;
        throw new DevsError(error.message, {
          exitCode: EXIT_CODE.COMPONENT,
          prefix: `[${item.projectName}] failed to [${command}]:`,
        });
      }
    }
    // 方法不存在，进行警告，但是并不会报错，最终的exit code为0；
    this.logger.tips(
      `The [${command}] command was not found.`,
      `Please check the component ${item.component} has the ${command} command. Serverless Devs documents：https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command`,
    );
  }
  private async doSkip(item: IStepOptions) {
    // id 添加状态
    if (item.id) {
      this.record.steps = {
        ...this.record.steps,
        [item.id]: {
          status: STEP_STATUS.SKIP,
        },
      };
    }
    this.recordContext(item, { status: STEP_STATUS.SKIP, process_time: 0 });
    return Promise.resolve();
  }
}

export default Engine;
