import { ICommands } from "./commands";

export interface IOptions {
	/**
	 * Cli 的参数
	 */
	args: string[];
	/**
	 * 组件的配置
	 */
	commands: ICommands;
	/**
	 * yaml 的 props 配置
	 */
	props: Record<string, any>;
}
