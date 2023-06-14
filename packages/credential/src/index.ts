import { cloneDeep, isNil } from 'lodash'

import SetCredential, { IResult } from './actions/set'
import GetCredential, { getEnvKeyPair } from './actions/get'
import getAllCredential from './actions/get-all'
import renameCredential from './actions/rename'
import removeCredential from './actions/remove'
import decryptCredential from './actions/decrypt'
import defaultCredential from './actions/default'

export default class Credential {
  static async get(access?: string): Promise<IResult> {
    // 获取环境变量的密钥对
    const envKeyPair = getEnvKeyPair();
    if (!isNil(envKeyPair)) {
      return {
        access: '$system_environment_access',
        credential: envKeyPair,
      };
    }

    const getAccess = new GetCredential(access);
    return await getAccess.run();
  };

  static async set(options: Record<string, any>): Promise<IResult | undefined> {
    const setCredential = new SetCredential();
    return await setCredential.run(cloneDeep(options));
  };

  static getAll = getAllCredential;

  static remove = removeCredential;

  static rename = renameCredential;

  static decrypt = decryptCredential;

  static default = defaultCredential;
}
