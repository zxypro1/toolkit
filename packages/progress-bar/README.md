
# 下载(@serverless-devs/progress-bar)

## 安装

```bash
$ npm install @serverless-devs/progress-bar --save
```

## 基本使用

```ts
import ProgressBar, { ProgressType } from '@serverless-devs/progress-bar';

const bar = new ProgressService(
  ProgressType.Loading,
  {
    total: 1000,
  }
);
for (let i = 0; i < 1000; i += 50) {
  bar.update(i);
}
bar.complete();
```

## 参数解析

```ts
import ProgressBar, { ProgressType } from '@serverless-devs/progress-bar';

const result = new ProgressService(
  type,
  options,
  format,
);
```

| 参数    | 说明            | 类型    | 必填 | 默认值 |
| ------- | --------------- | ------- | ---- | ------ |
| type | 进度条的显示方式 | `ProgressType.Bar`：总尺寸已知的进度条;  `ProgressType.Loading`：总大小未知的加载样式 | 是   |     -   |
| options | 进度条的选项 | [Options](#options) | `ProgressType.Bar` 时必填   |      -  |
| format | 进度条格式, 详见[format](#format) | String | 否   |  - |


## Options

| 参数      | 说明         | 类型                          | 必填 | 默认值        |
| --------- | ------------ | ----------------------------- | ---- | ------------- |
| total    | 要完成的数据总数   |  number     | 是   |      `ProgressType.Loading` 时默认 100         |
| curr    | 当前已完成索引   |  number     | 否   | - |
| width    | 进度条显示宽度   |  number     | 否   | `{total}` |
| renderThrottle    | 更新之间的最短时间（以毫秒为单位）   |  number     | 否   | 16 |
| stream    | 输出流 |  NodeJS.WritableStream     | 否   | `{process.stderr}` |
| head    | 头部字符, 默认为完成字符   |  string  | 是   | `{complete}` |
| complete    | 完成字符 |  string    | 否   | `=` |
| incomplete    | 未完成字符 |  string    | 否   | `-` |
| callback    | 进度条完成时调用 |  Function    | 否   | - |


## Format 简述

type 取值 `ProgressType.Bar` 时默认为 `Loading ${green(':loading')} ((:bar)) :current/:total(Bytes) :percent :etas`     
type 取值 `ProgressType.Loading` 时默认为 `Loading ${green(':loading')} ((:bar)) :etas`

  
解析一下这段文字 `Loading ${green(':loading')} ((:bar)) :current/:total(Bytes) :percent :etas`：

`Loading` 是一个显示前缀，可以替换为一些固定的文案。  
`green()` 是引入的 [chalk](https://www.npmjs.com/package/chalk), 显示一下颜色效果  
`:loading` 是 `['⣴', '⣆', '⢻', '⢪', '⢫']` 交替显示的一个动态效果  
`((:bar))` 是显示进度条，由参数 `options.total` 控制总长度，使用 `result.update(curr)` 修改显示完成度。  
`:current` 显示当前完成度  
`:total` 要完成的数据总数  
`:percent` 完成的百分比  
`:etas` 估计完成时间（以秒为单位）  
`:elapsed` 经过的时间（以秒为单位）  
`:rate` 每秒刻度数  

## result

#### result.update

更新进度状态

接受参数为 `number` 类型  
返回值 无

示例：
```js
result.update(50)
```

#### result.terminate

中断进度条显示，并在上面写一条消息（此条信息不会被删除）

接受参数 `string`
返回值 无

示例：
```js
result.interrupt('终')
```

#### result.terminate

终止显示

接受参数 无  
返回值 无

示例：
```js
result.terminate()
```

#### result.complete

获取完成状态

接受参数 无  
返回值 `boolean`

示例：
```js
const complete = result.complete()
```

#### result.curr

获取当前已完成索引

接受参数 无  
返回值 `number`

示例：
```js
const curr = result.curr()
```

#### result.total

获取要完成的数据总数

接受参数 无  
返回值 `number`

示例：
```js
const total = result.total()
```