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
import { getProcessTime, throw101Error, throw100Error, throwError, getCredential } from './utils';
import { stringify } from '@serverless-devs/utils';
import ParseSpec, { getInputs, ISpec, IHookType } from '@serverless-devs/parse-spec';
import path from 'path';
import chalk from 'chalk';
import Actions from './actions';
import Credential from '@serverless-devs/credential';


export { IEngineOptions, IContext } from './types';

const debug = require('@serverless-cd/debug')('serverless-devs:engine');

class Engine {
  public context = { status: STEP_STATUS.PENING, completed: false } as IContext;
  private record = { status: STEP_STATUS.PENING, editStatusAble: true } as IRecord;
  private spec = {} as ISpec;
  private logger: any;
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
  async start(): Promise<IContext> {
    const globalAccess = get(this.options, 'globalArgs.access');
    const parse = new ParseSpec(get(this.options, 'yamlPath'), {
      access: globalAccess,
      method: get(this.options, 'method'),
    });
    this.spec = await parse.start();
    debug(`spec: ${stringify(this.spec)}`);
    const { steps, yaml } = this.spec;
    const globalActionInstance = new Actions(yaml.actions, {
      access: globalAccess || yaml.access,
    });
    await globalActionInstance.start(IHookType.PRE);

    this.context.steps = map(steps, (item) => {
      return { ...item, stepCount: uniqueId(), status: STEP_STATUS.PENING };
    });
    return new Promise(async (resolve) => {
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
      // TODO: this.output
      that: {
        name: item.projectName,
        access: item.access,
        props: item.props,
        component: item.component,
      },
      credential: item.credential,
    } as Record<string, any>;
    const executedProjects = filter(this.context.steps, (obj) => obj.order > item.order);
    for (const obj of executedProjects) {
      data[obj.projectName] = { output: obj.output || {}, props: obj.props || {} };
    }
    return data;
  }
  private async doCompleted() {
    this.context.completed = true;
    const { events } = this.options;
    if (isFunction(events?.onCompleted)) {
      try {
        await events?.onCompleted?.(this.context, this.logger);
      } catch (error) {
        this.outputErrorLog(error as Error);
      }
    }
  }
  private async handleSrc(item: IStepOptions) {
    try {
      const response: any = await this.doSrc(item);
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
  private async doSrc(item: IStepOptions) {
    debug(`doSrc item: ${stringify(item)}`);
    item.credential = await getCredential(item.access)
    const magic = this.getFilterContext(item);
    debug(`doSrc magic context: ${JSON.stringify(magic, null, 2)}`);
    const newInputs = getInputs(item.props, magic);
    this.recordContext(item, { props: newInputs });
    debug(`doSrc inputs: ${JSON.stringify(newInputs, null, 2)}`);
    const { method, projectName } = this.options;
    // 服务级操作
    if (projectName) {
      if (isFunction(item.instance[method])) {
        // 方法存在，执行报错，退出码101
        try {
          // TODO: inputs数据
          return await item.instance[method]({
            props: newInputs,
            getCredential: async () => await new Credential().get(item.access),
          });
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
        // TODO: inputs数据
        return await item.instance[method]({ props: newInputs });
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
