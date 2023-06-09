import { isFunction, get, isEmpty, isPlainObject, each, set, concat } from 'lodash';
import minimist, { Opts } from 'minimist';
import { IOptions } from "./types";
import { ICommand, IHelp, IRunFunction, IParseCommandsResult } from "./types/commands";

export async function handlerHelp(
  commandHelp: ICommand['help'], 
  props: IOptions['props'],
  args: IOptions['args'],
  argsData: Record<string, any>,
): Promise<{ help?: IHelp; argsData: Record<string, any> }> {
  // 根据配置获取参数原型
  let help: IParseCommandsResult['help'];
  if (isFunction(commandHelp)) {
    help = await commandHelp(argsData, props);
  } else if (isPlainObject(commandHelp)) {
    help = commandHelp;
  }

  const options = get(help, 'options');
  if (isEmpty(options)) {
    return { help, argsData };
  }

  const opts: Opts = {};
  each(options, (opt: Record<string, any>) => {
    const name = get(opt, 'name');
    if (!name) {
      return;
    }
    const alias = get(opt, 'alias');
    if (name && alias) {
      set(opts, `alias.${name}`, alias)
    }
    const defaultValue = get(opt, 'defaultValue');
    if (defaultValue) {
      set(opts, `default.${name}`, defaultValue)
    }

    const type = get(opt, 'type');
    if (type) {
      if (type === String) {
        opts.string = isEmpty(opts.string) ? [name] : concat(opts.string, name);
      } else if (type === Boolean) {
        opts.boolean = isEmpty(opts.boolean) ? [name] : concat(opts.boolean, name);
      }
    }
  });

  const parsedArgs = minimist(args, opts);
  return { help, argsData: parsedArgs };
}

export async function handlerCommonFunction(
  pendingParams: IRunFunction | unknown,
  props: IOptions['props'],
  argsData: Record<string, any>,
): Promise<unknown> {
  if (isFunction(pendingParams)) {
    return await pendingParams(argsData, props);
  }

  return pendingParams;
}

export default handlerHelp;