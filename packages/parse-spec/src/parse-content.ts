import path from 'path';
import getInputs from './get-inputs';
import { IStep } from './types';
import { getCredential } from './utils';
import compile from './compile';
import { each, get, omit, set } from 'lodash';
const extend2 = require('extend2');
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');

interface IOptions {
  logger?: any;
  basePath: string;
  projectName?: string; // 指定项目
  access?: string; // 全局的access
  environment?: Record<string, any>;
}

class ParseContent {
  constructor(private content: Record<string, any> = {}, private options = {} as IOptions) { }
  async start() {
    const { steps, content, originStep } = await this.getSteps();
    return {
      steps,
      content,
      originStep,
    };
  }
  private getEnvMagic(data: Record<string, any> = {}) {
    return {
      ...data,
      __runtime: 'parse',
      project: get(this.options.environment, '__project'),
      that: omit(this.options.environment, ['infrastructure', 'overlays']),
    };
  }
  private getCommonMagic() {
    return {
      cwd: path.dirname(this.options.basePath),
      vars: this.content.vars,
      __runtime: 'parse',
    };
  }
  private getMagicProps(item: Partial<IStep>) {
    const resources = get(this.content, 'resources', {});
    const temp = {} as Record<string, any>;
    each(resources, (item, key) => {
      set(temp, `${key}.props`, item.props || {});
    });
    const name = item.projectName as string;
    const res = {
      ...this.getCommonMagic(),
      resources: temp,
      credential: item.credential,
      that: {
        name,
        access: item.access,
        component: item.component,
        props: temp[name].props,
        output: temp[name].output,
      },
    };
    // parse props magic
    set(res, 'that.props', getInputs(temp[name].props, res));
    debug(`getMagicProps: ${JSON.stringify(res)}`);
    return res;
  }
  private async getSteps() {
    // resources字段， 其它字段
    const { resources, ...rest } = this.content;
    this.content = {
      ...this.content,
      ...getInputs(rest, this.getCommonMagic()),
    };
    const steps = [];
    const originStep = [];
    // projectName 存在，说明指定了项目
    const temp = this.options.projectName ? { [this.options.projectName]: resources[this.options.projectName] } : resources;
    for (const project in temp) {
      const element = resources[project];
      const component = compile(get(element, 'component'), this.getCommonMagic());
      let template = get(this.content.template, get(element, 'extend.name'), {});
      template = getInputs(omit(template, get(element, 'extend.ignore', [])), this.getCommonMagic());
      const access = this.getAccess();
      const credential = await getCredential(access, this.options.logger);

      const real = getInputs(element, this.getMagicProps({ projectName: project, access, component, credential }));
      const target = extend2(true, {}, template, real.props);
      const environment = getInputs(this.options.environment, this.getEnvMagic({ target, credential }));
      debug(`real environment: ${JSON.stringify(environment)}`)
      // 覆盖的优先级：resources > global > s.yaml
      set(real, 'props', extend2(true, {}, target, get(environment, 'overlays.global', {}), get(environment, 'overlays.resources', {})));
      this.content = {
        ...this.content,
        access,
        resources: {
          ...this.content.resources,
          [project]: real,
        },
      };
      steps.push({
        ...real,
        projectName: project,
        component,
        access,
        credential,
      });
      originStep.push({
        ...element,
        projectName: project,
        component,
        access,
        credential,
      });
    }
    return { steps, content: this.content, originStep };
  }
  private getAccess() {
    // 全局的 -a > env.yaml 的 access > s.yaml 的 access
    if (this.options.access) return this.options.access;
    const accessFromEnvironmentFile = get(this.options, 'environment.access');
    if (accessFromEnvironmentFile) return accessFromEnvironmentFile;
    if (this.content.access) return this.content.access;
  }
}

export default ParseContent;
