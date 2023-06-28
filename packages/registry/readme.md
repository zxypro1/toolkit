# registry (@serverless-devs/registry)

## 安装

```bash
$ npm install @serverless-devs/registry --save
```

## 基本使用

```ts
import Registry from '@serverless-devs/registry';

const registry = new Registry({ logger: console })

// 登陆
await registry.login();
// 刷新 token
await registry.resetToken();
// 获取 token
const token = registry.getToken();
// 发布组件
await registry.publish();
// 获取登陆用户发布的组件
const listResult = await registry.list();
// 获取发布的组件的信息
const detailResult = await registry.detail('name');
// 删除指定版本
await registry.remove('wss/test@0.0.2', 'Component')
```
