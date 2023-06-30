import { IStep } from '@serverless-devs/parse-spec';
import { IOptions as ILogConfig } from '@serverless-devs/logger/lib/type';
export interface IEngineOptions {
  argv: string[]; // process.argv.slice(2)
  yamlPath?: string;
  // TODO:
  env?: Record<string, string>;
  globalArgs?: IGlobalArgs;
  cwd?: string; // 当前工作目录
  logConfig?: EngineLogger;
}

export type EngineLogger = ILogConfig & {
  // TODO:
  customLogger?: any;
};

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

export type IStepOptions = IStep & {
  instance?: any; //组件实例
  id?: string;
  if?: string;
  'continue-on-error'?: boolean;
  'working-directory'?: string;
  // 内部字段
  stepCount?: string;
  status?: string;
  error?: Error;
  output?: Record<string, any>;
  process_time?: number;
  credential?: Record<string, any>;
  done?: boolean; //当前步骤是否执行完成
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
  steps: Record<string, any>; // 记录每个 step 的执行状态以及输出，后续step可以通过steps[$step_id].output使用该数据
  status: IStatus; // 记录step的状态
  startTime: number; // 记录step的开始时间
}

export interface IContext {
  cwd: string; // 当前工作目录
  stepCount: string; // 记录当前执行的step
  steps: IStepOptions[];
  env: Record<string, any>; // 记录合并后的环境变量
  status: IStatus; // 记录task的状态
  completed: boolean; // 记录task是否执行完成
  inputs: Record<string, any>; // 记录inputs的输入(魔法变量)
  error: Error; // 记录step的错误信息
}
