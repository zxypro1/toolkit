import { hasIn, isNil, isNumber, set } from "lodash";
import { isCiCdEnvironment } from '@serverless-devs/utils';
import fs from 'fs-extra';
// @ts-ignore
import Acc from '@serverless-devs/acc/commands/run';
import getAllCredential from '../get-all';
import { ALIYUN_CLI, ALIYUN_CONFIG_FILE, CICD_ACCESS_ALIAS_KEY, DEFAULT_NAME } from "../../constant";
import { Alibaba, IAliCredential } from "../../utils";
import { IResult } from "../set";

export { default as getEnvKeyPair} from './env-key-pair';

export default class GetAccess {
  /**
   * 简单处理：CICD 环境转换名称、number 类型转string
   * @param access 
   * @returns 
   */
  static getAccessAlias(access?: string): undefined | string {
    if (isCiCdEnvironment() && hasIn(process.env, CICD_ACCESS_ALIAS_KEY)) {
      return process.env[CICD_ACCESS_ALIAS_KEY] as string;
    }
    if (isNumber(access)) {
      return `${access}`;
    }
    return access;
  }

  private access?: string;
  constructor(access?: string) {
    this.access = GetAccess.getAccessAlias(access);
  }

  async run(): Promise<IResult> {
    // 兼容 aliyun-cli
    if (this.access === ALIYUN_CLI) {
      const credential = await this.getAliyunCliAccess() as unknown as Record<string, string>;
      return { access: ALIYUN_CLI, credential };
    }

    const credentials = getAllCredential();
    // access 不存在则使用默认密钥
    if (isNil(this.access)) {
      // 检测是否存在通过 config default 配置的密钥
      for (const key in credentials) {
        const credential = credentials[key];
        if (credential.__default === 'true') {
          return {
            access: key,
            credential,
          };
        }
      }
      // 不存在则使用兜底密钥
      if (hasIn(credentials, DEFAULT_NAME)) {
        return {
          access: DEFAULT_NAME,
          credential: credentials[DEFAULT_NAME],
        }
      }
    } else if (hasIn(credentials, this.access)) {
      return {
        access: this.access,
        credential: credentials[this.access],
      }
    }

    throw new Error(`Not found access: ${this.access}`);
  }

  async getAliyunCliAccess(): Promise<IAliCredential> {
    const configPath = process.env.ALIBABACLOUD_CONFIG || ALIYUN_CONFIG_FILE;

    if (fs.existsSync(configPath)) {
      try {
        const accData = await new Acc().run([]) as IAliCredential;
        const accountId = await Alibaba.getAccountId(accData);
        set(accData, 'AccountID', accountId);
        return accData;
      } catch (error) {
        console.debug(`acc commands run error: ${error}`);
        throw error;
      }
    }

    throw new Error(`Not found aliyun configuration file, please use serverless devs access`);
  }
}
