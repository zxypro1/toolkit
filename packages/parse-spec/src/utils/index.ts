import path from 'path';
import * as utils from '@serverless-devs/utils';
import compile from '../compile';
import { get, isEmpty } from 'lodash';


export function getDefaultYamlPath() {
    const spath = utils.getYamlPath('s')
    if (spath) return path.resolve(spath);
    throw new Error(
        JSON.stringify({
            message: 'the s.yaml/s.yml file was not found.',
            tips: 'Please check if the s.yaml/s.yml file exists, you can also specify it with -t.',
        }),
    );
}

export const isExtendMode = (extend: string, basePath: string) => {
    if (typeof extend !== 'string') return false;
    // validate extend
    utils.getYamlContent(utils.getAbsolutePath(extend, basePath));
    return true;
}

export const getInputs = (inputs: Record<string, any>, context: Record<string, any>) => {
    if (isEmpty(inputs)) return;
    function deepCopy(obj: any) {
        let result: any = obj.constructor === Array ? [] : {};
        if (typeof obj === 'object') {
            for (var i in obj) {
                let val = obj[i];
                if (typeof val === 'string') {
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