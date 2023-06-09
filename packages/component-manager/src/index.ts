import { cloneDeep, defaults, get, isEmpty, isNil, set, unset } from 'lodash';
import minimist from 'minimist';
import { DEFAULT_COMMAND_CONFIG } from "./constants";
import { IOptions } from "./types";
import { handlerHelp, handlerCommonFunction } from './handler';
import { IParseCommandsResult } from './types/commands';


export default class ComponentManager {
  options: IOptions;

  constructor(options: IOptions) {
    this.options = options;
  }
  
  async parseCommands(): Promise<IParseCommandsResult> {
    // 避免底层操作影响 props 入参
    const { commands, props, args } = this.options;

    // 获取子指令
    const parsedArgs = minimist(args, {});
    const argsCommand = get(parsedArgs, '_', []);
    // 根据指令获取配置
    const commandPath = argsCommand.join('.subCommands.');
    const commandConfig = get(commands, commandPath);
    // 如果指令或者配置为空则异常
    if (isEmpty(argsCommand) || isNil(commandConfig)) {
      throw new Error(`没有找到对应的指令`);
    }
  
    const result = { argsCommand };
    // 根据 help 处理参数，并得出需要显示的
    const commandHelp = get(commandConfig, 'help');
    const { help, argsData } = await handlerHelp(commandHelp, cloneDeep(props), args, parsedArgs);
    set(result, 'help', help);
    set(result, 'argsData', argsData);
    // 处理支持的字段
    for (const needHandlerKey of ['parallel', 'hangRun', 'singleton']) {
      const needHandlerConfig = get(commandConfig, needHandlerKey);
      if (!isNil(needHandlerConfig)) {
        const handlerResult = await handlerCommonFunction(needHandlerConfig, cloneDeep(props), cloneDeep(argsData));
        set(result, needHandlerKey, handlerResult);
      }
    }
    // 处理返回
    return defaults(result, DEFAULT_COMMAND_CONFIG);
  }
}
