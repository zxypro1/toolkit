export { default as use3version } from './use3version';
export { default as compile } from './compile';

import * as utils from '@serverless-devs/utils';
import { getFilePath, isExtendMode } from './utils'
const debug = require('@serverless-cd/debug')('serverless-devs:parse');


class ParseSpec {
    constructor(private filePath?: string) { }
    async start() {
        debug('parse start');
        debug(`yaml file path from params: ${this.filePath}`);
        const spath = await getFilePath(this.filePath);
        debug(`transformed or default yaml path: ${spath}`);
        const res = utils.getYamlContent(spath);
        // debug(`yaml content: ${JSON.stringify(res, null, 2)}`);
        // isExtendMode(res) ? this.doExtend() : this.doNormal();
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
