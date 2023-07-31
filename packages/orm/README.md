
# 压缩(@serverless-devs/zip)

## 安装

```bash
$ npm install @serverless-devs/zip --save
```

## 基本使用

```ts
import zip from '@serverless-devs/zip';

zip({ codeUri: './code' })
```

## 参数解析

```ts
import zip from '@serverless-devs/zip';
const result = await zip(options)
```

## Options

| 参数      | 说明         | 类型                          | 必填 | 默认值        |
| --------- | ------------ | ----------------------------- | ---- | ------------- |
| codeUri    | 代码包路径   |  string     | 是   |  - |
| includes    | 额外的压缩代码目录   |  string[]     | 否   |  - |
| outputFilePath    | 压缩文件输出目录   |  string     | 否   |  `process.cwd()` |
| outputFileName    | 压缩文件输出名称   |  string     | 否   |  `${Date.now()}.zip` |
| ignoreFiles    | 代码包忽略声明文件名称   |  string[]     | 否   |  `['.signore']` |
| level    | 压缩级别   |  number     | 否   |  9 |
| prefix    | 新增压缩目录前缀   |  string     | 否   |  - |

## Result

| 参数      | 说明   | 类型   |
| --------- | ------------ | ---- |
| count | 被压缩的文件个数 | number |
| compressedSize | 生成文件的大小 | number |
| outputFile | 生成文件的本地地址 | string |
