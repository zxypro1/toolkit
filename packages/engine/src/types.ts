export interface IEngineOptions {
  method: string;
  yamlPath?: string;
  projectName?: string;
  args?: string[];
  env?: Record<string, string>;
  globalArgs?: IGlobalArgs;
  cwd?: string; // 当前工作目录

  // TODO: 
  steps?: IStepOptions[];
  inputs?: Record<string, any>;
  logConfig?: ILogConfig;
  events?: IEvent;
}

export interface IGlobalArgs {
  debug?: boolean;
  help?: boolean;
  skipActions?: boolean;
  access?: string;
  output?: `${IOutputType}`;
}

export enum IOutputType {
  DEFAULT = 'default',
  JSON = 'json',
  YAML = 'yaml',
  RAW = 'raw',
}

interface IEvent {
  // 全局action pre 动作
  onInit?: (context: IContext, logger: any) => Promise<void>;
  // 全局action post 动作
  onCompleted?: (context: IContext, logger: any) => Promise<void>;
}

export interface ILogConfig {
  logPrefix?: string;
  // TODO: 临时方案
  logLevel?: any;
  ossConfig?: any;
  customLogger?: any;
  eol?: string;
}


export type IStepOptions = {
  projectName: string; // 项目名称
  run: () => Promise<any>;
  id?: string;
  if?: string;
  'continue-on-error'?: boolean;
  'working-directory'?: string;
};
export type IInnerStepOptions = IStepOptions & {
  stepCount?: string;
  status?: string;
  error?: Error;
  outputs?: Record<string, any>;
  process_time?: number;
};

export enum STEP_IF {
  SUCCESS = 'success()',
  FAILURE = 'failure()',
  ALWAYS = 'always()',
}

export enum STEP_STATUS_BASE {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RUNNING = 'running',
  PENING = 'pending',
  ERROR_WITH_CONTINUE = 'error-with-continue',
}

export type IStatus = `${STEP_STATUS_BASE}`;

enum STEP_STATUS_SKIP {
  SKIP = 'skipped',
}

export const STEP_STATUS = { ...STEP_STATUS_BASE, ...STEP_STATUS_SKIP };


export interface IRecord {
  editStatusAble: boolean; // 记录全局的执行状态是否可修改（一旦失败，便不可修改）
  steps: Record<string, any>; // 记录每个 step 的执行状态以及输出，后续step可以通过steps[$step_id].outputs使用该数据
  status: IStatus; // 记录step的状态
  startTime: number; // 记录step的开始时间
}

export interface IContext {
  cwd: string; // 当前工作目录
  stepCount: string; // 记录当前执行的step
  steps: IInnerStepOptions[];
  env: Record<string, any>; // 记录合并后的环境变量
  status: IStatus; // 记录task的状态
  completed: boolean; // 记录task是否执行完成
  inputs: Record<string, any>; // 记录inputs的输入(魔法变量)
  error: Error; // 记录step的错误信息
}
