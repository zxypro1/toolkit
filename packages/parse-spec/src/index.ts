export { default as use3version } from './use3version';
export { default as compile } from './compile';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import path from 'path';
import compile from './compile';
import { getDefaultYamlPath, isExtendMode, getInputs } from './utils'
import { get } from 'lodash';
const debug = require('@serverless-cd/debug')('serverless-devs:parse');


class ParseSpec {
    // yaml data
    private yamlData: Record<string, any> = {};
    private yamlPath: string;
    constructor(private filePath: string = '') {
        this.yamlPath = fs.existsSync(filePath) ? utils.getAbsolutePath(filePath) : getDefaultYamlPath() as string;
        debug(`yaml path: ${this.yamlPath}`);
    }
    async start() {
        debug('parse start');
        this.yamlData = utils.getYamlContent(this.yamlPath);
        debug(`yaml content: ${JSON.stringify(this.yamlData, null, 2)}`);
        require('dotenv').config({ path: path.join(path.dirname(this.yamlPath), '.env') });
        isExtendMode(get(this.yamlData, 'extend'), path.dirname(this.yamlPath)) ? await this.doExtend() : await this.doNormal();
        debug('parse end');
    }
    async doExtend() {
        debug('do extend');
    }
    async doNormal() {
        debug('do normal');
        const projects = get(this.yamlData, 'services', {});
        for (const project in projects) {
            const data = projects[project]
            const component = compile(get(data, 'component'), { cwd: path.dirname(this.yamlPath) });
            const Component = require(component);
            const instance = new Component(data);
            console.log(process.env.region, 'region env');

            const inputs = getInputs(get(data, 'props'), { cwd: path.dirname(this.yamlPath), vars: get(this.yamlData, 'vars', {}) });
            await instance.deploy(inputs);
        }
    }
}

export default ParseSpec;
