export interface IStep {
  projectName: string;
  component: string;
  props: Record<string, any>;
  actions?: Record<string, any>;
  order: number;
  access: string | undefined;
  flowId?: number;
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
  projectName: string;
}
export interface IPluginAction {
  hookType: `${IHookType}`;
  actionType: IActionType.PLUGIN;
  value: string;
  args?: Record<string, any>;
  level: `${IActionLevel}`;
  projectName: string;
}
export interface IComponentAction {
  hookType: `${IHookType}`;
  actionType: IActionType.COMPONENT;
  value: string;
  level: `${IActionLevel}`;
  projectName: string;
}

export type IAction = IRunAction | IPluginAction | IComponentAction;

export enum IActionLevel {
  PROJECT = 'project',
  GLOBAL = 'global',
}

export interface IYaml {
  path: string;
  content: Record<string, any>;
  projectNames: string[];
  extend?: string;
  vars?: Record<string, any>;
  actions?: IAction[];
  access?: string;
  flow?: Record<string, any>;
}
export type ISpec = IRecord & {
  steps: IStep[];
  yaml: IYaml;
};
export interface IRecord {
  method: string;
  access?: string;
  projectName?: string;
  args: Record<string, any>;
}
