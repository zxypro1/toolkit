import * as utils from '@serverless-devs/utils';
import path from 'path';

export const REGX = /\${([\w\W]*?)}/;
export const REGXG = /\${([\w\W]*?)}/g;
export const ENVIRONMENT_KEY = 'env';
export const ENVIRONMENT_FILE_NAME = 'env.yaml';
export const ENVIRONMENT_FILE_PATH = path.join(utils.getRootHome(), 'cache', 'env.json');
