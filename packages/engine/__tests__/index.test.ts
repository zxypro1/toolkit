import Engine from '../src';
import path from 'path';


test('未找到yaml文件', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/empty.yaml'),
    method: 'deploy'
  });
  expect.assertions(1);
  try {
    await engine.start();
  } catch (e) {
    const error = e as Error;
    expect(error.message).toContain('the s.yaml/s.yml file was not found.')
  }
});

test('yaml格式不正确', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/exception.yaml'),
    method: 'deploy'
  });
  expect.assertions(1);
  try {
    await engine.start();
  } catch (e) {
    const error = e as Error;
    expect(error.message).toContain('exception.yaml format is incorrect')
  }
});

test('extend yaml 格式有问题', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/extend.yaml'),
    method: 'deploy'
  });
  expect.assertions(1);
  try {
    await engine.start();
  } catch (e) {
    const error = e as Error;
    expect(error.message).toContain('base-error.yaml format is incorrect')
  }
});

test.only('基本测试', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/simple.yaml'),
    method: 'deploy'
  });
  await engine.start();
  expect(1).toBe(1);
});

test('基本测试', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/order.yaml'),
    method: 'deploy'
  });
  await engine.start();
  expect(1).toBe(1);
});