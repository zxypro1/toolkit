import path from 'path';
import * as utils from '@serverless-devs/utils';

export function getDefaultYamlPath() {
    const spath = utils.getYamlPath('s')
    if (spath) return path.resolve(spath);
    throw new Error(
        utils.stringify({
            message: 'the s.yaml/s.yml file was not found.',
            tips: 'Please check if the s.yaml/s.yml file exists, you can also specify it with -t.',
        }),
    );
}

export const isExtendMode = (extend: string | undefined, basePath: string) => {
    if (typeof extend !== 'string') return false;
    // validate extend
    utils.getYamlContent(utils.getAbsolutePath(extend, basePath));
    return true;
}