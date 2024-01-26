export interface IStep {
  projectName: string;
  component: string;
  props: Record<string, any>;
  actions?: Record<string, any>;
  order: number;
  access: string | undefined;
  flowId?: number;
  allow_failure?: boolean | IAllowFailure;
  credential: Record<string, any>;
}

export enum IHookType {
  PRE = 'pre',
  SUCCESS = 'success',
  FAIL = 'fail',
  COMPLETE = 'complete',
  POST = 'post',
}

export enum IActionType {
  RUN = 'run',
  PLUGIN = 'plugin',
  COMPONENT = 'component',
}
export interface IRunAction {
  hookType: `${IHookType}`;
  actionType: IActionType.RUN;
  value: string;
  path: string;
  level: `${IActionLevel}`;
  projectName: string;
  allow_failure?: boolean | IAllowFailure;
}
export interface IPluginAction {
  hookType: `${IHookType}`;
  actionType: IActionType.PLUGIN;
  value: string;
  args?: Record<string, any>;
  level: `${IActionLevel}`;
  projectName: string;
  allow_failure?: boolean | IAllowFailure;
}
export interface IComponentAction {
  hookType: `${IHookType}`;
  actionType: IActionType.COMPONENT;
  value: string;
  level: `${IActionLevel}`;
  projectName: string;
  allow_failure?: boolean | IAllowFailure;
}

export type IAction = IRunAction | IPluginAction | IComponentAction;
export interface IAllowFailure {
  exit_code?: number[];
  command?: string[];
}

export enum IActionLevel {
  PROJECT = 'Project',
  GLOBAL = 'Global',
}

export interface IYaml {
  path: string;
  appName: string;
  content: Record<string, any>;
  use3x: boolean;
  projectNames: string[];
  extend?: string;
  useExtend?: boolean;
  vars?: Record<string, any>;
  actions?: IAction[];
  access?: string;
  flow?: Record<string, any>;
  template?: Record<string, any>;
  useFlow?: boolean;
  projects?: Record<string, any>;
  environment?: Record<string, any>;
}
export type ISpec = IRecord & {
  steps: IStep[];
  yaml: IYaml;
};
export interface IRecord {
  projectName?: string;
  command?: string;
  access?: string;
  version?: string;
  output?: `${IOutput}`;
  skipActions?: boolean;
  help?: boolean;
  debug?: boolean;
  env?: string;
}

export enum IOutput {
  DEFAULT = 'default',
  JSON = 'json',
  YAML = 'yaml',
  RAW = 'raw',
}
