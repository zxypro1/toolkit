export { default as use3version } from './use3version';
export { default as compile } from './compile';
export { getInputs } from './utils';
import loadComponent from '@serverless-devs/load-component';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import path from 'path';
import { getDefaultYamlPath, isExtendMode } from './utils'
import compile from './compile';
import { get } from 'lodash';
const debug = require('@serverless-cd/debug')('serverless-devs:parse');

export interface IStep {
    projectName: string;
    component: string;
    props: Record<string, any>;
    actions?: Record<string, any>;
    instance: any;
}
export interface ISpec {
    steps: IStep[];
    vars: Record<string, any>;
    yamlPath: string;
}

class ParseSpec {
    // yaml data
    private yamlData: Record<string, any> = {};
    private yamlPath: string;
    constructor(private filePath: string = '') {
        this.yamlPath = fs.existsSync(filePath) ? utils.getAbsolutePath(filePath) : getDefaultYamlPath() as string;
        debug(`yaml path: ${this.yamlPath}`);
    }
    async start(): Promise<ISpec> {
        debug('parse start');
        this.yamlData = utils.getYamlContent(this.yamlPath);
        debug(`yaml content: ${JSON.stringify(this.yamlData, null, 2)}`);
        require('dotenv').config({ path: path.join(path.dirname(this.yamlPath), '.env') });
        const steps = isExtendMode(get(this.yamlData, 'extend'), path.dirname(this.yamlPath)) ? await this.doExtend() : await this.doNormal();
        debug('parse end');
        return { steps, vars: get(this.yamlData, 'vars', {}), yamlPath: this.yamlPath };
    }
    async doExtend() {
        debug('do extend');
        return [];
    }
    async doNormal() {
        debug('do normal');
        const projects = get(this.yamlData, 'services', {});
        debug(`projects: ${JSON.stringify(projects, null, 2)}`);
        const steps = [];
        for (const project in projects) {
            const element = projects[project];
            const data = projects[project]
            const component = compile(get(data, 'component'), { cwd: path.dirname(this.yamlPath) });
            const instance = await loadComponent(component);
            steps.push({ ...element, projectName: project, instance });
        }
        return steps;
    }
}

export default ParseSpec;
