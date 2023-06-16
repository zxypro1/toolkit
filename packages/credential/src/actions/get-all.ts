import { each, endsWith, assign, set, intersection } from "lodash"
import { ENDS_WITH_KEY_DEVS_KEY, KEY_PAIR_IMPORTANT, SYSTEM_ENVIRONMENT_ACCESS } from "../constant";
import { getYamlContent } from "../utils";
import decryptCredential from './decrypt';
import { IResult } from "./set";

type IAccessList = Record<string, Record<string, string>>;

/**
 * 通过环境变量获取密钥
 */
export const getEnvironment = (): IAccessList => {
  const result: IAccessList = {};

  each(process.env, (value: unknown, key: string) => {
    if (endsWith(key, ENDS_WITH_KEY_DEVS_KEY)) {
      try {
        set(result, key, JSON.parse(value as string));
      } catch (ex: any) {
        console.debug(`Parsing ${key} exception: ${ex.message}`);
      }
    }
  })

  return result;
}

/**
 * 通过 access.yaml 获取配置文件
 */
export const getAccessFile = () => {
  const yamlResult: IAccessList = getYamlContent();

  each(yamlResult, (value, key) => {
    set(yamlResult, key, decryptCredential(value));
  })

  return yamlResult;
}

/**
 * 获取特殊的环境变量
 */
export const getEnvKeyPair = (): undefined | IResult => {
  const envKeys = Object.keys(process.env);

  if (intersection(envKeys, KEY_PAIR_IMPORTANT).length === KEY_PAIR_IMPORTANT.length) {
    const credential: Record<string, string> = {};

    for (const key of KEY_PAIR_IMPORTANT) {
      set(credential, key, process.env[key]);
    }

    return { access: SYSTEM_ENVIRONMENT_ACCESS, credential };
  }
}

/**
 * 获取所有的密钥
 *   不包含 getAcc 和 平铺的变量
 */
export default (): IAccessList => {
  const envResult = getEnvironment();
  const yamlResult = getAccessFile();

  return assign(getEnvKeyPair(), yamlResult, envResult);
}
