export interface ICommands {
  [command: string]: ICommand;
}

type ICommanded = ICommands;
export type IRunFunction = ((args: Record<string, number | boolean | string>, props: Record<string, any>) => boolean);

export interface ICommand {
  /**
   * 帮助信息：可以是一个对象（推荐），但是针对一些复杂的场景也可以是函数
   */
  help: IHelp | ((args: Record<string, any>, props: Record<string, any>) => IHelp);
  /**
   * 支持并行运行
   * @default true
   */
  parallel: boolean | IRunFunction;
  /**
   * 存在阻塞程序运行的行为，如果存在则强制程序只能串行
   * @default false
   */
  hangRun: boolean | IRunFunction;
  /**
   * 组件命令只能单独指定 package 运行，不能和其他 package 一同运行
   * @default false
   */
  singleton: boolean | IRunFunction;
  /**
   * 子命令
   */
  subCommands?: ICommanded;
}

export interface IHelp {
  /**
   * 命令的描述信息
   */
  description: string;
  /**
   * 文档地址
   */
  document: string;
  /**
   * 使用示例
   */
  usage: string[];
  /**
   * 支持的参数，参考：https://www.npmjs.com/package/command-line-usage
   */
  options: Record<string, any>[];
}

export interface IParseCommandsResult {
	/**
	 * 解析后的参数
	 */
	argsData?: Record<string, number | boolean | string>;
	/**
	 * 对映指令的 help 信息
	 */
	help?: IHelp;
	/**
	 * 指令, 下标 [0] 为一级指令、[1] 为二级指令，依次类推
	 */
	argsCommand: string[];
	/**
	 * 支持并行运行
	 */
	parallel: boolean;
	/**
	 * 存在阻塞程序运行的行为
	 */
	hangRun: boolean;
	/**
	 * 需单独指定运行
	 */
	singleton: boolean;
}

