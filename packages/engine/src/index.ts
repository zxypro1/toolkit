import { createMachine, interpret } from 'xstate';
import {
  isEmpty,
  get,
  each,
  replace,
  map,
  isFunction,
  values,
  has,
  uniqueId,
  filter,
  includes,
} from 'lodash';
import {
  IStepOptions,
  IRecord,
  IStatus,
  IEngineOptions,
  IContext,
  ILogConfig,
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

export { IEngineOptions, IContext } from './types';

const debug = require('@serverless-cd/debug')('serverless-devs:engine');

class Engine {
  public context = { status: STEP_STATUS.PENING, completed: false } as IContext;
  private record = { status: STEP_STATUS.PENING, editStatusAble: true } as IRecord;
  private spec = {} as ISpec;
  private logger: any;
  private parseSpecInstance!: ParseSpec;
  private globalActionInstance!: Actions; // 全局的 action
  private actionInstance!: Actions; // 项目的 action
  constructor(private options: IEngineOptions) {
    debug('engine start');
    debug(`engine options: ${stringify(options)}`);

    // const { inputs, cwd = process.cwd(), logConfig = {} } = options;
    // this.options.logConfig = logConfig;
    // // 记录上下文信息
    // this.context.cwd = cwd;
    // this.context.inputs = inputs as {};
    // // logger
    // this.logger = this.getLogger();
  }
  async start() {
    this.context.status = STEP_STATUS.RUNNING;
    const globalAccess = get(this.options, 'globalArgs.access');
    this.parseSpecInstance = new ParseSpec(get(this.options, 'yamlPath'), {
      access: globalAccess,
      method: get(this.options, 'method'),
    });
    this.spec = await this.parseSpecInstance.start();
    const { steps: _steps, yaml } = this.spec;
    const steps = await this.download(_steps);

    this.globalActionInstance = new Actions(yaml.actions);
    // 获取全局的 access
    const access = globalAccess || yaml.access;
    const credential = await getCredential(access);
    await this.globalActionInstance.start(IHookType.PRE, { access, credential });

    this.context.steps = map(steps, (item) => {
      return { ...item, stepCount: uniqueId(), status: STEP_STATUS.PENING };
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
        states[item.stepCount as string] = {
          invoke: {
            id: item.stepCount,
            src: async () => {
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
                return item.if === 'true' ? this.handleSrc(item) : this.doSkip(item);
              }
              // 检查全局的执行状态，如果是failure，则不执行该步骤, 并记录状态为 skipped
              if (this.record.status === STEP_STATUS.FAILURE) {
                return this.doSkip(item);
              }
              return this.handleSrc(item);
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
  private async download(steps: IParseStep[]) {
    const newSteps = [];
    for (const step of steps) {
      const instance = await loadComponent(step.component);
      newSteps.push({ ...step, instance });
    }
    return newSteps;
  }
  private getLogger(filePath?: string, itemLogConfig?: any) {
    const logConfig = this.options.logConfig as ILogConfig;
    const { customLogger, logPrefix, logLevel, eol } = logConfig;
    const { inputs } = this.options;
    if (customLogger) {
      debug('use custom logger');
      return (this.logger = customLogger);
    }
    const secrets = inputs?.secrets ? values(inputs.secrets) : [];
    const cloudSecrets = inputs?.cloudSecrets ? values(inputs.cloudSecrets) : [];
    const newSecrets = [...secrets, ...cloudSecrets];
    const gitToken = get(inputs, 'git.token');
    // return new EngineLogger({
    //   file: logPrefix && path.join(logPrefix, filePath),
    //   level: logLevel,
    //   // eol: lodash.get(itemLogConfig, 'eol', eol),
    //   secrets: gitToken ? [newSecrets, gitToken] : newSecrets,
    // });
    // TODO: 临时使用 console
    return console;
  }
  private recordContext(item: IStepOptions, options: Record<string, any> = {}) {
    const { status, error, output, process_time, props } = options;
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
      const newInputs = await this.getProps(item);
      await this.actionInstance.start(IHookType.COMPLETE, newInputs);
    }
  }
  private async handleAfterSrc(item: IStepOptions) {
    try {
      debug(`project item: ${stringify(item)}`);
      item.credential = await getCredential(item.access);
      const newAction = await this.parseSpecInstance.parseActions(
        item.actions,
        IActionLevel.PROJECT,
      );
      debug(`project actions: ${JSON.stringify(newAction)}`);
      this.actionInstance = new Actions(newAction);
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
        this.outputErrorLog(error);
        throw error;
      }
    }
  }
  private outputErrorLog(error: Error) {
    const logConfig = this.options.logConfig as ILogConfig;
    const { customLogger } = logConfig;
    // 自定义logger, debug级别输出错误信息
    if (!isEmpty(customLogger)) {
      return this.logger.debug(error);
    }
  }
  private async getProps(item: IStepOptions) {
    const magic = this.getFilterContext(item);
    debug(`magic context: ${JSON.stringify(magic)}`);
    const newInputs = getInputs(item.props, magic);
    const { args, projectName, method } = this.options;
    // TODO: inputs数据
    const result = {
      props: newInputs,
      command: this.options.method,
      yaml: this.spec.yaml,
      projectName: item.projectName,
      access: item.access,
      component: item.component,
      credential: new Credential(),
      argv: filter(args, o => !includes([projectName, method], o))
    };
    this.recordContext(item, { props: newInputs });
    debug(`get props: ${JSON.stringify(result)}`);
    return result;
  }
  private async doSrc(item: IStepOptions, data: Record<string, any> = {}) {
    const { method, projectName } = this.options;
    const newInputs = await this.getProps(item);
    const componentProps = isEmpty(data.pluginOutput) ? newInputs : data.pluginOutput;
    this.actionInstance.setValue('componentProps', componentProps)
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
        `Please check the component ${item.component
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
