
# ignore (@serverless-devs/ignore-walk)

## 安装

```bash
$ npm install @serverless-devs/ignore-walk --save
```

## 基本使用

```ts
import ignoreWalk from '@serverless-devs/ignore-walk';

const zipFiles = ignoreWalk.sync({
  ignoreFiles: ['.fcignore'],
  path: path.join(__dirname, 'code'),
  includeEmpty: true,
});
```

## 参数解析

```ts
import ignoreWalk from '@serverless-devs/ignore-walk';

const result = ignoreWalk.sync(Options);
```

## Options

| 参数      | 说明         | 类型                          | 必填 | 默认值        |
| --------- | ------------ | ----------------------------- | ---- | ------------- |
| path  | 计算代码包的根目录 |   string   |  否  |  process.cwd() |
| ignoreFiles | ignore 文件名列表 | string[] | 否   |    ['.signore']    |
| includeEmpty | 包含空白目录 | boolean | 否   |   false     |
| follow  | 保留符号链接目录 | boolean   | 否   |  false |
| isSymbolicLink  | 如果 path 是符号链接，则设置为true，无论follow是否为true | boolean   | 否   |  - |


