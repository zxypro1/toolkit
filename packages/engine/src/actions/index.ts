import {
  IAction,
  IActionType,
  IHookType,
  IPluginAction,
  IRunAction,
} from '@serverless-devs/parse-spec';
import { isEmpty, filter, map, omit } from 'lodash';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import execa from 'execa';
import loadComponent from '@serverless-devs/load-component';
import { throwError, getCredential, stringify } from '../utils';
import { IContext } from '../types';

const debug = require('@serverless-cd/debug')('serverless-devs:engine');

interface IOptions {
  access?: string;
}

class Actions {
  private context!: IContext;
  constructor(private actions: IAction[] = [], private options: IOptions = {}) {}

  async start(hookType: `${IHookType}`, context = {} as IContext) {
    this.context = context;
    const hooks = filter(this.actions, (item) => item.hookType === hookType);
    if (isEmpty(hooks)) return;
    for (const hook of hooks) {
      debug(`global action: ${stringify(hook)}`);
      if (hook.actionType === IActionType.RUN) {
        await this.run(hook);
      }
      if (hook.actionType === IActionType.PLUGIN) {
        await this.plugin(hook);
      }
    }
  }
  private async run(hook: IRunAction) {
    if (fs.existsSync(hook.path) && fs.lstatSync(hook.path).isDirectory()) {
      try {
        execa.sync(hook.value, {
          cwd: hook.path,
          stdio: 'inherit',
          shell: true,
        });
      } catch (e) {
        const error = e as Error;
        // pre hook, throw error
        if (hook.hookType !== IHookType.PRE) return;
        if (utils.isWindow()) {
          debug('Command run execution environment：CMD');
          debug(
            'Please check whether the actions section of yaml can be executed in the current environment.',
          );
        }
        throwError('Global pre-action failed to execute:' + error.message);
      }
    }
  }
  private async plugin(hook: IPluginAction) {
    const instance = await loadComponent(hook.value);
    const credential = await getCredential(this.options.access);

    // TODO: inputs
    const inputs = {
      access: this.options.access,
      credential,
      ...this.context,
      steps: map(this.context.steps, (step) => omit(step, 'instance')),
    };
    await instance(inputs, hook.args);
  }
}

export default Actions;
