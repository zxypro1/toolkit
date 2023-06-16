interface IBaseOptions {
  access?: string;
  force?: boolean;
}

export interface IAlibaba extends IBaseOptions {
  AccessKeyID: string;
  AccessKeySecret: string;
  SecurityToken?: string;
  AccountID?: string;
}

export interface IAws extends IBaseOptions {
  AccessKeyID: string;
  SecretAccessKey: string;
}

export interface IHuawei extends IBaseOptions {
  AccessKeyID: string;
  SecretAccessKey: string;
}

export interface IBaidu extends IBaseOptions {
  AccessKeyID: string;
  SecretAccessKey: string;
}

export interface IAzure extends IBaseOptions {
  KeyVaultName: string;
  TenantID: string;
  ClientID: string;
  ClientSecret: string;
}

export interface IGoogle extends IBaseOptions {
  PrivateKeyData: string;
}

export interface ITencent extends IBaseOptions {
  AccountID: string;
  SecretID: string;
  SecretKey: string;
}

export interface ICustom extends IBaseOptions {
  keyList: string;
  infoList: string;
}

export type ISetOptions = IBaseOptions | ICustom | IAlibaba | IAws | IBaidu | IHuawei | IAzure | IGoogle | ITencent | IGoogle;

export type IResult = {
  access: string;
  credential: Record<string, string>;
}
