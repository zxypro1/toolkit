import {
  IAction,
  IActionType,
  IHookType,
  IPluginAction,
  IRunAction,
  getInputs,
} from '@serverless-devs/parse-spec';
import { isEmpty, filter } from 'lodash';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import execa from 'execa';
import loadComponent from '@serverless-devs/load-component';
import { throwError, stringify } from '../utils';

const debug = require('@serverless-cd/debug')('serverless-devs:engine');

class Actions {
  private record: Record<string, any> = {};
  private inputs: Record<string, any> = {};
  private magic: Record<string, any> = {};
  constructor(private actions: IAction[] = []) {}
  public setMagic(magic: Record<string, any>) {
    this.magic = magic;
  }
  public async start(hookType: `${IHookType}`, inputs: Record<string, any> = {}) {
    this.inputs = inputs;
    const hooks = filter(this.actions, (item) => item.hookType === hookType);
    if (isEmpty(hooks)) return {};
    const newHooks = getInputs(hooks, this.magic);
    for (const hook of newHooks) {
      debug(`${hook.level} action item: ${stringify(hook)}`);
      if (hook.actionType === IActionType.RUN) {
        await this.run(hook);
      }
      if (hook.actionType === IActionType.PLUGIN) {
        await this.plugin(hook);
      }
    }
    return this.record.pluginOutput;
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
    // TODO: inputs
    const inputs = isEmpty(this.record.pluginOutput) ? this.inputs : this.record.pluginOutput;
    this.record.pluginOutput = await instance(inputs, hook.args);
  }
}

export default Actions;
