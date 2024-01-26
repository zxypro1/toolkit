import { each, keys, set, intersection, get, isEmpty, merge, isNumber } from 'lodash';
import { getYamlContent, writeData, Alibaba, IAliCredential } from '../../utils';
import { CRYPTO_STRING, PROVIDER, PROVIDER_CREDENTIAL_KEYS } from '../../constant';
import Logger from '../../logger';
import * as inquirer from './inquirer';
import * as setType from './type';

const Crypto = require('crypto-js');

export default class SetCredential {
  async run(options: setType.ISetOptions): Promise<setType.IResult | undefined> {
    const { access, force } = options;
    const credInformation = this.handlerArgv(options);
    
    // 没有通过参数指定，交互式设置
    if (isEmpty(credInformation)) {
      const result = await inquirer.inputCredentials();
      merge(credInformation || {}, result);
    }

    const aliasName = await inquirer.getAlias({ access, force });
    if (aliasName === false) {
      return;
    }

    // 如果是 ali 密钥则手动添加设置一些可获取密钥
    if (Alibaba.isAlibaba(credInformation)) {
      if ((options as setType.IAlibaba).SecurityToken) {
        set(credInformation, 'SecurityToken', (options as setType.IAlibaba).SecurityToken);
      }
      await this.setAccountId(options as setType.IAlibaba, credInformation as unknown as setType.IAlibaba);
    }

    const content = await getYamlContent();

    // 加密字段
    const info = {};
    Object.keys(credInformation).forEach((key: string) => {
      const value = String(get(credInformation, key));
      const cipherText = Crypto.AES.encrypt(value, CRYPTO_STRING);
      set(info, key, cipherText.toString());
    });

    merge(content, { [aliasName as string]: info });

    await writeData(content);
    return {
      access: aliasName as string,
      credential: credInformation,
    };
  }

  // 先判断用户指定的参数，如果指定参数是 number 类型，则先转为 string 类型
  // 通过 ak、sk 获取 uid
  //   如果获取到了 uid 并且用户指定了 uid，则先对比一下。使用通过接口获取到的 uid
  //   如果没有获取 uid，如果没有传入 uid，抛出异常。如果传入了 uid，使用传入的
  private async setAccountId(argvData: setType.IAlibaba, credInformation: setType.IAlibaba) {
    let uid = argvData.AccountID;
    if (isNumber(uid)) {
      uid = `${uid}`;
    }

    try {
      const accountId = await Alibaba.getAccountId(credInformation as unknown as IAliCredential);
      if (uid && uid !== accountId) {
        Logger.logger.warn('The inputted AccountID does not match the actual obtained value, using the actual value');
      }
      set(credInformation, 'AccountID', accountId);
    } catch (ex: any) {
      Logger.logger.warn(ex.data.Message);
      Logger.logger.warn('Please make sure provided access is legal, or serverless-devs service on Cloud Providers may fail.');
      if (!uid) {
        throw ex;
      }
      set(credInformation, 'AccountID', uid);
    }
  }

  private handlerArgv(argvData: setType.ISetOptions): Record<string, string> {
    const argvKeys = keys(argvData);
    // 处理已知密钥对支持
    for (const provider in PROVIDER_CREDENTIAL_KEYS) {
      const keys = get(PROVIDER_CREDENTIAL_KEYS, provider);
      // 完整包含 keys
      if (intersection(argvKeys, keys).length === keys.length) {
        const credInformation = {};
        each(keys, (key: string) => set(credInformation, key, get(argvData, key)));

        return credInformation;
      }
    }
    // 处理自定义
    const { keyList, infoList } = argvData as setType.ICustom;
    if (keyList && infoList) {
      const infoKeyList = keyList.split(',');
      const infoValueList = infoList.split(',');

      if (infoKeyList.length === infoValueList.length) {
        const credInformation = { __provider: PROVIDER.custom };
        each(infoKeyList, (value, index) => {
          set(credInformation, value, infoValueList[index]);
        });
        return credInformation;
      } else {
        throw new Error('Please make sure --kl/--keyList is as long as --il/--infoList');
      }
    }

    // TODO: 多余的参数怎么警告
    return {};
  }
}
