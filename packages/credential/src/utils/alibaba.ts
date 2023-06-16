import { get, hasIn, isNil } from "lodash";
import Core from '@alicloud/pop-core';
import { PROVIDER } from "../constant";

export interface IAliCredential {
  AccessKeyID: string;
  AccessKeySecret: string;
  SecurityToken?: string;
  AccountID?: string;
}

export default class Alibaba {
  static async getAccountId(credInformation: IAliCredential): Promise<string> {
    const params = {
      accessKeyId: credInformation.AccessKeyID,
      accessKeySecret: credInformation.AccessKeySecret,
      securityToken: credInformation.SecurityToken,
      endpoint: 'https://sts.cn-hangzhou.aliyuncs.com',
      apiVersion: '2015-04-01',
    };
    const client = new Core(params);
  
    try {
      const result: any = await client.request(
        'GetCallerIdentity',
        {},
        { method: 'POST' },
      );
      const accountId = get(result, 'AccountId');
      if (isNil(accountId)) {
        throw new Error(`The obtained accountId is abnormal, RequestId is ${result.RequestId}`);
      }
      return accountId;
    } catch (ex: any) {
      // TODO: 做友好提示
      throw ex;
    }
  }

  static isAlibaba(credInformation: Record<string, string>): boolean {
    if (hasIn(credInformation, 'AccessKeyID') && hasIn(credInformation, 'AccessKeySecret')) {
      credInformation.__provider = PROVIDER.alibaba;
      return true;
    }
  
    return false;
  }
}