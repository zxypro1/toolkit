import path from 'path';
import * as utils from '@serverless-devs/utils';
import Credential from '@serverless-devs/credential';
import { get } from 'lodash';

export function getDefaultYamlPath() {
  const spath = utils.getYamlPath('s');
  if (spath) return path.resolve(spath);
  throw new Error(
    JSON.stringify({
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
};

export async function getCredential(access: string | undefined, logger: any) {
  try {
    const instance = new Credential({ logger });
    const res = await instance.get(access);
    return get(res, 'credential', {});
  } catch (error) {
    return {};
  }
}
