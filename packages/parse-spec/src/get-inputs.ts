import compile from './compile';
import { every, includes, isEmpty, map, join } from 'lodash';
import { REGXG } from './contants';
import * as utils from '@serverless-devs/utils'
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');


export const getInputs = (inputs: Record<string, any>, context: Record<string, any>) => {
    if (isEmpty(inputs)) return;
    const { ignore } = context;
    debug(`get inputs ignore: ${utils.stringify(ignore)}`);
    const $ignore = map(ignore, item => '${' + item);
    function deepCopy(obj: any) {
        let result: any = obj.constructor === Array ? [] : {};
        if (typeof obj === 'object') {
            for (var i in obj) {
                let val = obj[i];
                if (typeof val === 'string' && REGXG.test(val) && includes(join(val.match(REGXG), ','), '-')) {
                    throw new Error(`Invalid value: ${val}, not support '-' in value`);
                }
                if (typeof val === 'string' && every($ignore, item => !includes(val, item))) {
                    val = compile(val, context);
                }
                result[i] = typeof val === 'object' ? deepCopy(val) : val;
            }
        } else {
            result = obj;
        }
        return result;
    }
    return deepCopy(inputs);
}

export default getInputs;