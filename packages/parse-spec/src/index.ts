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
import { concat, endsWith, get, includes, keys, map, omit, replace } from 'lodash';
import { ISpec, IOptions, IYaml } from './types';
import { IGNORE, REGX } from './contants';
const extend2 = require('extend2');
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');


class ParseSpec {
    // yaml
    private yaml = {} as IYaml;
    constructor(filePath: string = '', private options = {} as IOptions) {
        this.yaml.path = fs.existsSync(filePath) ? utils.getAbsolutePath(filePath) : getDefaultYamlPath() as string;
        debug(`yaml path: ${this.yaml.path}`);
        debug(`options: ${utils.stringify(this.options)}`);
    }
    async start(): Promise<ISpec> {
        debug('parse start');
        this.yaml.content = utils.getYamlContent(this.yaml.path);
        this.yaml.access = get(this.yaml.content, 'access');
        this.yaml.extend = get(this.yaml.content, 'extend');
        this.yaml.vars = get(this.yaml.content, 'vars', {});

        debug(`yaml content: ${utils.stringify(this.yaml.content)}`);
        require('dotenv').config({ path: path.join(path.dirname(this.yaml.path), '.env') });
        const steps = isExtendMode(this.yaml.extend, path.dirname(this.yaml.path)) ? await this.doExtend() : await this.doNormal();
        // 获取到真实值后，重新赋值
        this.yaml.vars = get(this.yaml.content, 'vars', {});
        this.yaml.actions = await this.parseActions();
        const result = { steps: order(steps), yaml: this.yaml };
        debug(`parse result: ${utils.stringify(result)}`);
        debug('parse end');
        return result;
    }
    async parseActions() {
        const actionList = [];
        const actions = get(this.yaml.content, 'actions', {});
        for (const action in actions) {
            const element = actions[action];
            const actionInfo = this.matchAction(action);
            debug(`action: ${action}, useAction: ${utils.stringify(actionInfo)}`);
            if (actionInfo.validate) {
                actionList.push(...map(element, (item) => ({ ...item, type: actionInfo.type })));
            }
        }
        return actionList;
    }
    matchAction(action: string) {
        const useMagic = REGX.test(action);
        if (useMagic) {
            const newAction = compile(action, { method: this.options.method });
            const [type, method] = newAction.split('-');
            return {
                validate: method === 'true',
                type
            }
        }
        const [type, method] = action.split('-');
        return {
            validate: method === this.options.method,
            type
        }
    }
    async doExtend() {
        debug('do extend');
        const extendPath = utils.getAbsolutePath(this.yaml.extend, path.dirname(this.yaml.path));
        const extendYaml = utils.getYamlContent(extendPath);
        const extendVars = get(extendYaml, 'vars', {});
        const extendContent = getInputs(extendYaml, {
            cwd: path.dirname(extendPath),
            vars: extend2(true, {}, extendVars, this.yaml.vars),
            ignore: concat(IGNORE, keys(get(extendYaml, 'services', {})))
        });
        debug(`extend yaml content: ${utils.stringify(extendContent)}`);
        const yamlContent = getInputs(omit(this.yaml.content, 'extend'), {
            cwd: path.dirname(this.yaml.path),
            vars: extend2(true, {}, extendVars, this.yaml.vars),
            ignore: concat(IGNORE, keys(get(this.yaml.content, 'services', {})))
        });
        debug(`yaml content: ${utils.stringify(yamlContent)}`);
        this.yaml.content = extend2(true, {}, extendContent, yamlContent);
        debug(`merged yaml content: ${utils.stringify(this.yaml.content)}`);
        const projects = get(this.yaml.content, 'services', {});
        debug(`projects: ${utils.stringify(projects)}`);
        return await this.getSteps(projects);
    }
    async doNormal() {
        debug('do normal');
        this.yaml.content = getInputs(this.yaml.content, {
            cwd: path.dirname(this.yaml.path),
            vars: this.yaml.vars,
            ignore: concat(IGNORE, keys(get(this.yaml.content, 'services', {})))
        });
        const projects = get(this.yaml.content, 'services', {});
        debug(`projects: ${utils.stringify(projects)}`);
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
