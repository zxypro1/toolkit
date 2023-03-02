export interface IOptions {
  /**
   * Path to where your file will be written.
   *
   * @default process.cwd()
   */
  dest?: string;
  /**
   * The logger
   */
  logger?: any;
  /**
   * Name of the saved file.
   *
   * @default componentName (e.g. template为 devsapp/start-fc-http-nodejs14时，componentName为start-fc-http-nodejs14)
   */
  projectName?: string;
  /**
   * The template parameters, which will be passed to the s.yaml file
   *
   * @default publish.yaml 里的 parameters 默认值
   */
  parameters?: Record<string, any>;
  /**
   * The template appName, which will be passed to the s.yaml file (name field)
   */
  appName?: string;
  /**
   * The template access, which will be passed to the s.yaml file (access field)
   *
   * @default default
   */
  access?: string;
}

export enum IProvider {
  DEVSAPP = 'devsapp',
}
