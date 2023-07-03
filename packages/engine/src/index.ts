import { createMachine, interpret } from 'xstate';
import {
  isEmpty,
  get,
  each,
  replace,
  map,
  isFunction,
  has,
  uniqueId,
  filter,
  omit,
  includes,
} from 'lodash';
import {
  IStepOptions,
  IRecord,
  IStatus,
  IEngineOptions,
  IContext,
  STEP_STATUS,
  STEP_IF,
} from './types';
import {
  getProcessTime,
  throw101Error,
  throw100Error,
  throwError,
  getCredential,
  stringify,
} from './utils';
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

export { IEngineOptions, IContext } from './types';

const debug = require('@serverless-cd/debug')('serverless-devs:engine');

class Engine {
  public context = { status: STEP_STATUS.PENING, completed: false } as IContext;
  private record = { status: STEP_STATUS.PENING, editStatusAble: true } as IRecord;
  private spec = {} as ISpec;
  private glog: Logger;
  private logger!: ILoggerInstance;
  private parseSpecInstance!: ParseSpec;
  private globalActionInstance!: Actions; // 全局的 action
  private actionInstance!: Actions; // 项目的 action
  constructor(private options: IEngineOptions) {
    debug('engine start');
    this.options.argv = get(this.options, 'argv', process.argv.slice(2));
    debug(`engine options: ${stringify(options)}`);
    this.glog = new Logger({
      traceId: Math.random().toString(16).slice(2),
      logDir: path.join(utils.getRootHome(), 'logs'),
    });
    this.logger = this.glog.__generate('engine');
  }
  async start() {
    this.context.status = STEP_STATUS.RUNNING;
    this.parseSpecInstance = new ParseSpec(get(this.options, 'yamlPath'), this.options.argv);
    this.spec = this.parseSpecInstance.start();
    const { steps: _steps, yaml, access = yaml.access } = this.spec;
    this.validate();
    const steps = await this.download(_steps);

    this.globalActionInstance = new Actions(yaml.actions, {
      hookLevel: IActionLevel.GLOBAL,
      logger: this.logger,
    });
    const credential = await getCredential(access);
    await this.globalActionInstance.start(IHookType.PRE, { access, credential });

    this.context.steps = map(steps, (item) => {
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
              // 并行时如果已经执行过，则跳过。
              if (item.done) return;
              this.record.startTime = Date.now();
              // 记录 context
              this.recordContext(item, { status: STEP_STATUS.RUNNING });
              // 先判断if条件，成功则执行该步骤。
              if (item.if) {
                // 替换 failure()
                item.if = replace(
                  item.if,
                  STEP_IF.FAILURE,
                  this.record.status === STEP_STATUS.FAILURE ? 'true' : 'false',
                );
                // 替换 success()
                item.if = replace(
                  item.if,
                  STEP_IF.SUCCESS,
                  this.record.status !== STEP_STATUS.FAILURE ? 'true' : 'false',
                );
                // 替换 always()
                item.if = replace(item.if, STEP_IF.ALWAYS, 'true');
                return item.if === 'true'
                  ? await Promise.all(map(flowProject, (o) => this.handleSrc(o)))
                  : await Promise.all(map(flowProject, (o) => this.doSkip(o)));
              }
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
    return res;
  }
  private validate() {
    const { steps, method } = this.spec;
    if (isEmpty(steps)) {
      throw new Error('steps is empty');
    }
    if (isEmpty(method)) {
      throw new Error('method is empty');
    }
  }
  private async download(steps: IParseStep[]) {
    const newSteps = [];
    for (const step of steps) {
      const instance = await loadComponent(step.component, this.glog.__generate(step.projectName));
      newSteps.push({ ...step, instance });
    }
    return newSteps;
  }
  private getLogger() {
    // const  customLogger  = get(this.options, 'logConfig.customLogger');
    // if (customLogger) {
    //   debug('use custom logger');
    //   return (this.logger = customLogger);
    // }
    return new Logger({
      ...omit(get(this.options, 'logConfig'), ['customLogger']),
      traceId: Math.random().toString(16).slice(2),
      logDir: path.join(utils.getRootHome(), 'logs'),
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
          this.context.error = error;
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
  private getFilterContext(item: IStepOptions) {
    const data = {
      cwd: path.dirname(this.spec.yaml.path),
      vars: this.spec.yaml.vars,
      credential: item.credential,
    } as Record<string, any>;
    for (const obj of this.context.steps) {
      data[obj.projectName] = { output: obj.output || {}, props: obj.props || {} };
    }
    data.that = {
      name: item.projectName,
      access: item.access,
      component: item.component,
      props: data[item.projectName].props,
      output: data[item.projectName].output,
    };
    return data;
  }
  private async doCompleted() {
    this.context.completed = true;
    if (this.context.status === STEP_STATUS.SUCCESS) {
      await this.globalActionInstance.start(IHookType.SUCCESS, this.context);
    }
    if (this.context.status === STEP_STATUS.FAILURE) {
      await this.globalActionInstance.start(IHookType.FAIL, this.context);
    }
    await this.globalActionInstance.start(IHookType.COMPLETE, this.context);
  }
  private async handleSrc(item: IStepOptions) {
    this.logger.info(`Start executing project ${item.projectName}`);
    try {
      await this.handleAfterSrc(item);
      // 项目的output, 再次获取魔法变量
      this.actionInstance.setValue('magic', this.getFilterContext(item));
      const newInputs = await this.getProps(item);
      await this.actionInstance.start(IHookType.SUCCESS, newInputs);
    } catch (error) {
      const newInputs = await this.getProps(item);
      await this.actionInstance.start(IHookType.FAIL, newInputs);
    } finally {
      this.recordContext(item, { done: true });
      const newInputs = await this.getProps(item);
      await this.actionInstance.start(IHookType.COMPLETE, newInputs);
    }
    // 若记录的全局状态为true，则进行输出成功的日志
    this.record.status === STEP_STATUS.SUCCESS &&
      this.logger.info(`Project ${item.projectName} successfully to execute`);
  }
  private async handleAfterSrc(item: IStepOptions) {
    try {
      debug(`project item: ${stringify(item)}`);
      item.credential = await getCredential(item.access);
      const newAction = this.parseSpecInstance.parseActions(item.actions, IActionLevel.PROJECT);
      debug(`project actions: ${JSON.stringify(newAction)}`);
      this.actionInstance = new Actions(newAction, {
        hookLevel: IActionLevel.PROJECT,
        projectName: item.projectName,
        logger: this.logger,
      });
      this.actionInstance.setValue('magic', this.getFilterContext(item));
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
      const process_time = getProcessTime(this.record.startTime);
      this.recordContext(item, { status: STEP_STATUS.SUCCESS, output: response, process_time });
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
      const process_time = getProcessTime(this.record.startTime);
      if (item['continue-on-error']) {
        this.recordContext(item, { status, process_time });
      } else {
        this.recordContext(item, { status, error, process_time });
        throw error;
      }
    }
  }
  private async getProps(item: IStepOptions) {
    const magic = this.getFilterContext(item);
    debug(`magic context: ${JSON.stringify(magic)}`);
    const newInputs = getInputs(item.props, magic);
    const { projectName, method } = this.spec;
    // TODO: inputs数据
    const result = {
      props: newInputs,
      method,
      yaml: this.spec.yaml,
      projectName: item.projectName,
      access: item.access,
      component: item.component,
      credential: new Credential(),
      args: filter(this.options.argv, (o) => !includes([projectName, method], o)),
    };
    this.recordContext(item, { props: newInputs });
    debug(`get props: ${JSON.stringify(result)}`);
    return result;
  }
  private async doSrc(item: IStepOptions, data: Record<string, any> = {}) {
    const { method = '', projectName } = this.spec;
    const newInputs = await this.getProps(item);
    const componentProps = isEmpty(data.pluginOutput) ? newInputs : data.pluginOutput;
    debug(`component props: ${stringify(componentProps)}`);
    this.actionInstance.setValue('componentProps', componentProps);
    // 服务级操作
    if (projectName) {
      if (isFunction(item.instance[method])) {
        // 方法存在，执行报错，退出码101
        try {
          return await item.instance[method](componentProps);
        } catch (error) {
          throw101Error(error as Error, `Project ${item.projectName} failed to execute:`);
        }
      }
      // 方法不存在，此时系统将会认为是未找到组件方法，系统的exit code为100；
      throw100Error(
        `The [${method}] command was not found.`,
        `Please check the component ${
          item.component
        } has the ${method} method. Serverless Devs documents：${chalk.underline(
          'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command',
        )}`,
      );
    }
    // 应用级操作
    if (isFunction(item.instance[method])) {
      // 方法存在，执行报错，退出码101
      try {
        return await item.instance[method](componentProps);
      } catch (error) {
        throw101Error(error as Error, `Project ${item.projectName} failed to execute:`);
      }
    }
    // 方法不存在，进行警告，但是并不会报错，最终的exit code为0；
    throwError(
      `The [${method}] command was not found.`,
      `Please check the component ${item.component} has the ${method} method. Serverless Devs documents：https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/command`,
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
