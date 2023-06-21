import { createMachine, interpret } from 'xstate';
import { isEmpty, get, each, replace, map, isFunction, values, has, uniqueId } from 'lodash';
import { IStepOptions, IRecord, IStatus, IEngineOptions, IContext, ILogConfig, STEP_STATUS, STEP_IF } from './types';
import { getProcessTime, stringify } from './utils';
import ParseSpec, { compile, getInputs, ISpec } from '@serverless-devs/parse-spec';
import path from 'path';

export { IEngineOptions, IContext } from './types';

const debug = require('@serverless-cd/debug')('serverless-devs:engine');

class Engine {
  public context = { status: STEP_STATUS.PENING, completed: false } as IContext;
  private record = { status: STEP_STATUS.PENING, editStatusAble: true } as IRecord;
  private spec = {} as ISpec;
  private logger: any;
  constructor(private options: IEngineOptions) {
    debug('engine start',);
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
    const parse = new ParseSpec(get(this.options, 'yamlPath'));
    this.spec = await parse.start();
    debug(`spec data: ${stringify(this.spec)}`);
    const { steps } = this.spec;
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
        const target = this.context.steps[index + 1] ? get(this.context.steps, `[${index + 1}].stepCount`) : 'final';
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
                item.if = this.doArtTemplateCompile(item.if);
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
    const { status, error, outputs, process_time } = options;
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
        if (outputs) {
          obj.outputs = outputs;
        }
        if (has(options, 'process_time')) {
          obj.process_time = process_time;
        }
      }
      return obj;
    });
  }
  private getFilterContext() {
    const { inputs = {} } = this.options;
    const { env = {} } = this.context;
    // secrets, cloudSecrets, git 等
    return {
      ...inputs,
      status: this.context.status,
      steps: this.record.steps,
      env: { ...inputs.env, ...env },
      inputs,
    };
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
            outputs: response,
          },
        };
      }
      const process_time = getProcessTime(this.record.startTime);
      this.recordContext(item, { status: STEP_STATUS.SUCCESS, outputs: response, process_time });
    } catch (e) {
      const error = e as Error;
      const status = item['continue-on-error'] === true ? STEP_STATUS.ERROR_WITH_CONTINUE : STEP_STATUS.FAILURE;
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
    // TODO: 
    // return await item.run()
  }
  private doArtTemplateCompile(value: string) {
    return value;
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
