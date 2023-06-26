export { default as use3version } from './use3version';
export { default as compile } from './compile';
export { default as order } from './order';
export { default as getInputs } from './get-inputs';
export * from './types';
import loadComponent from '@serverless-devs/load-component';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import path from 'path';
import { getDefaultYamlPath, isExtendMode } from './utils'
import compile from './compile';
import order from './order';
import getInputs from './get-inputs';
import { get, omit } from 'lodash';
import { ISpec, IOptions, IYaml } from './types';
const extend2 = require('extend2');
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');


class ParseSpec {
    // yaml
    private yaml = {} as IYaml;
    constructor(filePath: string = '', private options: IOptions) {
        this.yaml.path = fs.existsSync(filePath) ? utils.getAbsolutePath(filePath) : getDefaultYamlPath() as string;
        debug(`yaml path: ${this.yaml.path}`);
    }
    async start(): Promise<ISpec> {
        debug('parse start');
        this.yaml.content = utils.getYamlContent(this.yaml.path);
        this.yaml.access = get(this.yaml.content, 'access');
        this.yaml.extend = get(this.yaml.content, 'extend');
        this.yaml.vars = get(this.yaml.content, 'vars', {});

        debug(`yaml content: ${JSON.stringify(this.yaml.content, null, 2)}`);
        require('dotenv').config({ path: path.join(path.dirname(this.yaml.path), '.env') });
        const steps = isExtendMode(this.yaml.extend, path.dirname(this.yaml.path)) ? await this.doExtend() : await this.doNormal();
        debug('parse end');
        return { steps: order(steps), vars: this.yaml.vars, yamlPath: this.yaml.path };
    }
    async doExtend() {
        debug('do extend');
        const extendPath = utils.getAbsolutePath(this.yaml.extend, path.dirname(this.yaml.path));
        const extendYaml = utils.getYamlContent(extendPath);
        const extendVars = get(extendYaml, 'vars', {});
        const extendContent = getInputs(extendYaml, { cwd: path.dirname(extendPath), vars: extend2(true, {}, extendVars, this.yaml.vars) });
        debug(`extend yaml content: ${JSON.stringify(extendContent, null, 2)}`);
        const yamlContent = getInputs(omit(this.yaml.content, 'extend'), { cwd: path.dirname(this.yaml.path), vars: extend2(true, {}, extendVars, this.yaml.vars) });
        debug(`yaml content: ${JSON.stringify(yamlContent, null, 2)}`);
        const mergedYamlContent = extend2(true, {}, extendContent, yamlContent);
        debug(`merged yaml content: ${JSON.stringify(mergedYamlContent, null, 2)}`);
        const projects = get(mergedYamlContent, 'services', {});
        debug(`projects: ${JSON.stringify(projects, null, 2)}`);
        return await this.getSteps(projects);
    }
    async doNormal() {
        debug('do normal');
        const projects = get(this.yaml.content, 'services', {});
        debug(`projects: ${JSON.stringify(projects, null, 2)}`);
        return await this.getSteps(projects);

    }
    async getSteps(projects: Record<string, any>) {
        const steps = [];
        for (const project in projects) {
            const element = projects[project];
            const data = projects[project]
            const component = compile(get(data, 'component'), { cwd: path.dirname(this.yaml.path) });
            const instance = await loadComponent(component);
            steps.push({ ...element, projectName: project, instance, access: this.getAccess(data) });
        }
        return steps;
    }
    getAccess(data: Record<string, any>) {
        // 全局的access > 项目的access > yaml的access
        if (this.options.access) return this.options.access;
        if (get(data, 'access')) return get(data, 'access');
        if (this.yaml.access) return this.yaml.access;
    }
}

export default ParseSpec;
