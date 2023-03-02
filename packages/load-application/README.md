
# 下载应用(@serverless-devs/load-application), 仅适用于serverless源的应用。

## 安装

```bash
$ npm install @serverless-devs/load-application --save
```

## 基本使用

```ts
import loadApplication from '@serverless-devs/load-application';

loadApplication('start-fc-http-nodejs14')
```

## 参数解析

```ts
import loadApplication from '@serverless-devs/load-application';
loadApplication(template, options)
```

| 参数    | 说明            | 类型    | 必填 | 默认值 |
| ------- | --------------- | ------- | ---- | ------ |
| template | 模版名称 | string  | 是   |        |
| options | 方法入参 | Options | 否   |        |

## Options

| 参数      | 说明         | 类型                          | 必填 | 默认值        |
| --------- | ------------ | ----------------------------- | ---- | ------------- |
| dest       | 文件保存路径                 | string        | 否   |        |
| logger     | 输出日志                     | Function      | 否   |   console     |
| projectName| 文件保存时的名称               | string        | 否   |  组件名称 |
| parameters | 解析yaml文件时用到的参数        | Record<string, any> | 否   | publish.yaml参数的默认值   |
| appName    | 项目名称, 用于替换yaml里的name字段 |  string       | 否  |              |
| access     | 密钥, 用于替换yaml里的access字段 |  string       | 否  |    default          |



