# ORM(@serverless-devs/orm)
### 依赖
- [lowdb](https://github.com/typicode/lowdb)，本地JSON数据库，但是不支持`ESM`
- [loopback-filters](https://github.com/strongloop/loopback-filters)，`ORM`过滤模块

## 安装

```bash
$ npm install @serverless-devs/orm --save
```

## 使用方式

```ts
import ORM from '@serverless-devs/orm';

```
### create
```ts
const tableName = 'posts';
const orm = new Orm('./post.json', {
  [tableName]: [],
  users: []
});
const tableValue = 'dankun_1';

await orm.init();
await orm[tableName].create({
    data: {
        name: tableValue,
    },
});
```

### find
#### findUnique
```
const data = await orm[tableName].findUnique({
    where: {
      name: 'case_1',
    },
});
```
#### findMany
```
const data = await orm[tableName].findMany({
    where: {
        name: 'case_1',
    },
});
```
### update
```
const data = await orm[tableName].update({
    where: {
      name: 'case_1',
    },
    data: {
      name: 'case_update',
      age: 23,
    },
});
```
### delete
```
const data = await orm[tableName].delete({
    where: {
      name: 'case_1',
    },
});
```

## 参数解析

### query 搜索
### 初始化参数解析
```
// path 参数指的是文件路径，比如`～/.s/error.json`
const orm = new Orm($path);
// tableName参数指的是实体名
await orm.init($tableName);
```
#### 参数解析
- path
参数指的是文件路径，比如`～/.s/error.json`
- tableName
`tableName`参数指的是表的实体名



#### where搜索
```
applyFilter({
  where: {
    // the price > 10 && price < 100
    and: [
      {
        price: {
          gt: 10
        }
      },
      {
        price: {
          lt: 100
        }
      },
    ],

    // match Mens Shoes and Womens Shoes and any other type of Shoe
    category: {like: '.* Shoes'},

    // the status is either in-stock or available
    status: {inq: ['in-stock', 'available']}
  }
})
```

#### limit
```
applyFilter(data, {
  where: {
    location: {near: '153.536,-28'}
  },
  limit: 10
})
```

## 参考
[prisma](https://www.prisma.io/docs/concepts/components/prisma-client/crud)