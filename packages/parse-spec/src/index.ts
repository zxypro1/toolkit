export { default as use3version } from './use3version';
export { default as compile } from './compile';
import * as utils from '@serverless-devs/utils';
import fs from 'fs-extra';
import path from 'path';
import { getAbsolutePath, getDefaultYamlPath, isExtendMode } from './utils'
import { get } from 'lodash';
const debug = require('@serverless-cd/debug')('serverless-devs:parse');


class ParseSpec {
    // yaml data
    private data: Record<string, any> = {};
    private yamlPath: string;
    constructor(private filePath: string = '') {
        this.yamlPath = fs.existsSync(filePath) ? getAbsolutePath(filePath) : getDefaultYamlPath() as string;
        debug(`yaml path: ${this.yamlPath}`);
    }
    async start() {
        debug('parse start');
        this.data = utils.getYamlContent(this.yamlPath);
        debug(`yaml content: ${JSON.stringify(this.data, null, 2)}`);
        isExtendMode(get(this.data, 'extend'), path.dirname(this.yamlPath)) ? this.doExtend() : this.doNormal();
        debug('parse end');
    }
    doExtend() {
        debug('do extend');
    }
    doNormal() {
        debug('do normal');

    }
}

export default ParseSpec;
