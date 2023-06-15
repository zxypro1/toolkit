import fs from 'fs-extra';
import path from 'path';
import * as utils from '@serverless-devs/utils';


export async function getFilePath(filePath: string = '') {
    if (fs.existsSync(filePath)) return path.isAbsolute(filePath) ? filePath : path.resolve(filePath);

    const spath = utils.getYamlPath('s')
    if (spath) return path.resolve(spath);

    throw new Error(
        JSON.stringify({
            message: 'the s.yaml/s.yml file was not found.',
            tips: 'Please check if the s.yaml/s.yml file exists, you can also specify it with -t.',
        }),
    );
}

export const isExtendMode = (data: Record<string, any> = {}) => {
    // TODO:validate extend yaml
    return typeof data.extend === 'string';
}

