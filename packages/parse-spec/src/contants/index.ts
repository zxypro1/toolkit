import * as utils from '@serverless-devs/utils';
import path from 'path';

export const REGX = /\${([\w\W]*?)}/;
export const REGXG = /\${([\w\W]*?)}/g;
export const ENVIRONMENT_KEY = 'env';
export const ENVIRONMENT_FILE_NAME = 'env.yaml';
export const ENVIRONMENT_FILE_PATH = path.join(utils.getRootHome(), 'cache', 'default-env.json');
// Aliyun Serverless Devs 远程项目名称
export const ALIYUN_REMOTE_PROJECT_ENV_PARAM = 'ALIYUN_DEVS_REMOTE_PROJECT_NAME';
