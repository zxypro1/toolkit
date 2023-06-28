export interface IStep {
  projectName: string;
  component: string;
  props: Record<string, any>;
  actions?: Record<string, any>;
  order: number;
  access: string | undefined;
}

export enum IHookType {
  PRE = 'pre',
  SUCCESS = 'success',
  FAIL = 'fail',
  COMPLETE = 'complete',
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
}
export interface IPluginAction {
  hookType: `${IHookType}`;
  actionType: IActionType.PLUGIN;
  value: string;
  args?: Record<string, any>;
  level: `${IActionLevel}`;
}

export type IAction = IRunAction | IPluginAction;

export enum IActionLevel {
  PROJECT = 'project',
  GLOBAL = 'global',
}

export interface IYaml {
  path: string;
  content: Record<string, any>;
  extend?: string;
  vars?: Record<string, any>;
  actions?: IAction[];
  access?: string;
}
export interface ISpec {
  steps: IStep[];
  yaml: IYaml;
}
export interface IOptions {
  method: string;
  access?: string;
}
