import path from 'path';
import Orm from '../src';

const tableName = 'posts';

const curPath = path.resolve(__dirname, '_temp');

test('create and find', async () => {
  const orm = new Orm(path.join(curPath, 'create_db.json'));
  const tableValue = 'dankun_1';

  await orm.init(tableName);
  await orm[tableName].create({
    data: {
      name: tableValue,
    },
  });
  const data = await orm[tableName].findUnique({
    where: {
      name: tableValue,
    },
  });
  expect(data.name).toEqual(tableValue);
});

test('findUnique', async () => {
  const orm = new Orm(path.join(curPath, 'find_db.json'));
  await orm.init(tableName, [
    { name: 'case_1' },
    { name: 'case_1' },
    { name: 'case_2' },
    { name: 'case_3' },
    { name: 'case_4' },
  ]);

  const data = await orm[tableName].findUnique({
    where: {
      name: 'case_1',
    },
  });
  expect(data.name).toEqual('case_1');
});

test('findMany', async () => {
  const orm = new Orm(path.join(curPath, 'find_db.json'));
  await orm.init(tableName, [
    { name: 'case_1' },
    { name: 'case_1' },
    { name: 'case_3' },
    { name: 'case_4' },
  ]);

  const data = await orm[tableName].findMany({
    where: {
      name: 'case_1',
    },
  });
  console.log(data);
  expect(data.length).toBeLessThanOrEqual(2);
});

test('update', async () => {
   const orm = new Orm(path.join(curPath, 'update_db.json'));
   await orm.init(tableName, [
    { name: 'case_1' },
    { name: 'case_2' },
    { name: 'case_3' },
    { name: 'case_4' },
  ]);

  const data = await orm[tableName].update({
    where: {
      name: 'case_1',
    },
    data: {
      name: 'case_update',
      age: 23,
    },
  });
  // @ts-ignore
  const updateDate = data.filter((item) => item.name === 'case_update');
  expect(updateDate[0].name).toBe('case_update');
});

test('delete', async () => {
  const orm = new Orm(path.join(curPath, 'delete_db.json'));
  await orm.init(tableName, [
    { name: 'case_1' },
    { name: 'case_2' },
    { name: 'case_3' },
    { name: 'case_4' },
  ]);

  const data = await orm[tableName].delete({
    where: {
      name: 'case_1',
    },
  });
  console.log(data);
  expect(data.length).toBe(3);
});
