import path from 'path';
import * as utils from '@serverless-devs/utils';

export const getAbsolutePath = (filePath: string, basePath: string = process.cwd()) => {
    return path.isAbsolute(filePath) ? filePath : path.join(basePath, filePath);
}

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
    utils.getYamlContent(getAbsolutePath(extend, basePath));
    return true;
}

