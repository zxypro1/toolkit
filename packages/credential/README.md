
# 处理密钥配置(@serverless-devs/credential)

## 安装

```bash
$ npm install @serverless-devs/credential --save
```

## 构建实例

```ts
import Credential from '@serverless-devs/credential';

const credential = new Credential(logger); // logger 选填，用于日志输出
```

## 方法

### 新增密钥配置 set

#### 参数解析
```ts
import Credential from '@serverless-devs/credential';

const credential = new Credential();
const result = await credential.set(options);
```

| 参数      | 说明         | 类型                          | 必填 | 默认值        |
| --------- | ------------ | ----------------------------- | ---- | ------------- |
| access | 新增密钥别名 | string | 否 | - |
| force | 如果配置密钥别名已经存在，是否强制覆盖 | boolean | 否 | - |
| 其他参数 | 如果希望通过参数指定直接新增密钥（注意⚠️：**需要成对指定支持厂商的密钥**）。如果不满足可以使用 keyList 和 infoList 参数自定义，具体使用参考示例 | - | 否 | - |


> 厂商密钥 Key：  
> **Alibaba Cloud (alibaba)**: AccessKeyID、AccessKeySecret // AccountID 和 SecurityToken 选填  
> **AWS (aws)**: AccessKeyID、SecretAccessKey  
> **Azure (azure)**: KeyVaultName、TenantID、ClientID、ClientSecret  
> **Baidu Cloud (baidu)**: AccessKeyID、SecretAccessKey  
> **Google Cloud (google)**: PrivateKeyData  
> **Huawei Cloud (huawei)**: AccessKeyID、SecretAccessKey  
> **Tencent Cloud (tencent)**: AccountID、SecretID、SecretKey  


#### 返回值

可能返回 undefined 或者下面的数据结构

| 参数      | 说明   | 类型   |
| --------- | ------------ | ---- |
| access | 密钥别名 | string |
| credential | 创建的密钥对 | Record\<string, string\> |

#### 使用示例

##### 交互式创建密钥

```ts
const result = await credential.set()
```

##### 创建 alibaba 密钥

```ts
const result = await credential.set({
  access: 'alibaba',
  AccessKeyID: 'LTAI5*****THK',
  AccessKeySecret: 'RgeGJ*****FyMW',
  AccountID: 'xxxxxx',
});
/**
result = {
  access: 'alibaba',
  credential: {
    AccessKeyID: 'LTA*****THK',
    AccessKeySecret: 'Rge*****yMW',
    AccountID: '189****629',
  }
 */
```

##### 创建 aws/huawei/baidu 密钥

```ts
const result = await credential.set({
  access: 'alias',
  force: true,
  AccessKeyID: 'AccessKeyID',
  SecretAccessKey: 'SecretAccessKey',
})
// result = { access: 'alias', credential: { AccessKeyID: 'AccessKeyID', SecretAccessKey: 'SecretAccessKey' } }
```

##### 创建 azure 密钥

```ts
const result = await credential.set({
  access: 'azure',
  force: true,
  KeyVaultName: 'KeyVaultName',
  TenantID: 'TenantID',
  ClientID: 'ClientID',
  ClientSecret: 'ClientSecret',
})
/**
result = {
  access: 'azure',
  credential: {
    KeyVaultName: 'KeyVaultName',
    TenantID: 'TenantID',
    ClientID: 'ClientID',
    ClientSecret: 'ClientSecret',
  }
 */
```

##### 创建 google 密钥

```ts
const result = await credential.set({
  access: 'google',
  force: true,
  PrivateKeyData: 'PrivateKeyData',
})
/**
result = {
  access: 'google',
  credential: {
    PrivateKeyData: 'PrivateKeyData',
  },
 */
```

##### 创建 tencent 密钥

```ts
const result = await credential.set({
  access: 'tencent',
  force: true,
  AccountID: 'AccountID',
  SecretID: 'SecretID',
  SecretKey: 'SecretKey',
})
/**
result = {
  access: 'tencent',
  credential: {
    AccountID: 'AccountID',
    SecretID: 'SecretID',
    SecretKey: 'SecretKey',
  },
 */
```

##### 创建 custom 密钥

```ts
const result = await credential.set({
  access: 'custom',
  force: true,
  keyList: 'SecretID,SecretKey,Test',
  infoList: 'abc,yyy,123',
})
/**
result = {
  access: 'custom',
  credential: {
    Test: '123',
    SecretID: 'abc',
    SecretKey: 'yyy',
  },
 */
```

### 获取密钥

#### 使用方式

```ts
import Credential from '@serverless-devs/credential';

const credential = new Credential();
const result = await credential.get('access');
```

#### 获取逻辑

![获取日志逻辑文档](https://img.alicdn.com/imgextra/i4/O1CN01KK5JAv1m2sNrJx0g1_!!6000000004897-0-tps-810-1207.jpg)

### 获取所有密钥 getAll

#### 使用方式

```ts
import Credential from '@serverless-devs/credential';

const credential = new Credential();
await credential.getAll();
```

### 删除密钥别名 remove

#### 使用方式

```ts
import Credential from '@serverless-devs/credential';

const credential = new Credential();
await credential.remove(access);
```


### 修改密钥别名 rename

#### 使用方式

```ts
import Credential from '@serverless-devs/credential';

const credential = new Credential();
await credential.rename({ source, target });
```

### 配置默认密钥 default

#### 使用方式

```ts
import Credential from '@serverless-devs/credential';

const credential = new Credential();
await credential.default(access);
```

### 解密 decrypt

#### 使用方式

```ts
import Credential from '@serverless-devs/credential';

const credential = new Credential();
// 入参是通过 set 方法加密后的密钥键值对
const result = await credential.decrypt({
  AccessKeyID: 'U2FsdGVkX1/vUriF3c62TFb2R8qgDP669jsyr6ilyD4=',
  SecretAccessKey: 'U2FsdGVkX1/HygYh+uGL+wxglAQuxDzj/UUARUMW9NE=',
});
// result = {AccessKeyID: 'AccessKeyID', SecretAccessKey: 'SecretAccessKey' }
```