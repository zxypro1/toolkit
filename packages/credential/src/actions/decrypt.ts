import { cloneDeep } from "lodash";
import { CRYPTO_STRING } from "../constant";

const Crypto = require('crypto-js');

export default (info: Record<string, string>): Record<string, string> => {
  const cloneInfo = cloneDeep(info);

  Object.keys(info).forEach((key: string) => {
    try {
      const bytes = Crypto.AES.decrypt(cloneInfo[key], CRYPTO_STRING);
      cloneInfo[key] = bytes.toString(Crypto.enc.Utf8) || cloneInfo[key];
    } catch (error) {
      // ignore error
    }
  });

  return cloneInfo;
}
