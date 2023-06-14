import { each, endsWith, assign, set, transform } from "lodash"
import { ENDS_WITH_KEY_DEVS_KEY } from "../constant";
import { getYamlContent } from "../utils";
import decryptCredential from './decrypt';

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

  transform(yamlResult, (result: IAccessList, value, key) => {
    set(result, key, decryptCredential(value));
  })

  return yamlResult;
}

/**
 * 获取所有的密钥
 *   不包含 getAcc 和 平铺的变量
 */
export default (): IAccessList => {
  const envResult = getEnvironment();
  const yamlResult = getAccessFile();

  return assign({}, yamlResult, envResult);
}
