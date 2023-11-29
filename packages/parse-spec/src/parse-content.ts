import path from 'path';
import getInputs from './get-inputs';
import { IStep } from './types';
import { getCredential } from './utils';
import { each, get, omit, set, pickBy, cloneDeep, isEmpty } from 'lodash';
const compile = require('@serverless-devs/art-template/lib/devs-compile');
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
  private credential: Record<string, any> = {};
  constructor(private content: Record<string, any> = {}, private options = {} as IOptions) { }
  async start() {
    return await this.getSteps();
  }
  private getEnvMagic(data: Record<string, any> = {}) {
    return {
      ...data,
      __runtime: 'parse',
      project: get(this.options.environment, '__project'),
      that: omit(this.options.environment, ['infrastructure', 'overlays']),
      credential: this.credential,
    };
  }
  private getCommonMagic() {
    return {
      cwd: path.dirname(this.options.basePath),
      vars: this.content.vars,
      __runtime: 'parse',
      credential: this.credential,
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
    const access = this.getAccess();
    this.credential = await getCredential(access, this.options.logger);
    // resources字段， 其它字段
    const { resources, ...rest } = this.content;
    this.content = {
      ...this.content,
      ...getInputs(rest, this.getCommonMagic()),
    };
    const steps = [];
    const originSteps = [];
    // projectName 存在，说明指定了项目
    const temp = this.options.projectName ? { [this.options.projectName]: resources[this.options.projectName] } : resources;
    for (const project in temp) {
      const element = resources[project];
      const component = compile(get(element, 'component'), this.getCommonMagic());
      let template = get(this.content.template, get(element, 'extend.name'), {});
      template = getInputs(omit(template, get(element, 'extend.ignore', [])), this.getCommonMagic());
      const real = getInputs(element, this.getMagicProps({ projectName: project, access, component }));
      const source = extend2(true, {}, template, real.props); // 修改target为source
      // 限制env解析的范围。例如overlays->components->fc3，则只在fc3组件的应用中解析，其他应用不解析
      const filteredEnv = cloneDeep(this.options.environment);
      if (filteredEnv && !isEmpty(get(filteredEnv, 'overlays.components'))) {
        filteredEnv.overlays.components = pickBy(filteredEnv.overlays.components, (value, key) => key === component);
      }
      if (filteredEnv && !isEmpty(get(filteredEnv, 'overlays.resources'))) {
        filteredEnv.overlays.resources = pickBy(filteredEnv.overlays.resources, (value, key) => key === project);
      }
      const environment = getInputs(filteredEnv, this.getEnvMagic({ source }));
      debug(`real environment: ${JSON.stringify(environment)}`);
      // 覆盖的优先级：resources > components > s.yaml
      set(real, 'props', extend2(true, {}, source, get(environment, `overlays.components.${component}`, {}), get(environment, `overlays.resources.${project}`, {})));
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
        credential: this.credential,
      });
      originSteps.push({
        ...element,
        projectName: project,
        component,
        access,
        credential: this.credential,
      });
    }
    return { steps, content: this.content, originSteps };
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
