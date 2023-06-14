import { intersection, set } from "lodash";
import { KEY_PAIR_IMPORTANT } from "../../constant";

/**
 * 获取平铺密钥 
 */
export default (): undefined | Record<string, string> => {
  const envKeys = Object.keys(process.env);

  if (intersection(envKeys, KEY_PAIR_IMPORTANT).length === KEY_PAIR_IMPORTANT.length) {
    const credential: Record<string, string> = {};

    for (const key of KEY_PAIR_IMPORTANT) {
      set(credential, key, process.env[key]);
    }

    return credential;
  }
}
