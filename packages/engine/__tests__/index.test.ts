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

test('basic', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/simple.yaml'),
    method: 'deploy'
  });
  const context = await engine.start();
  expect(context.status).toBe('success');
});

test.only('order', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/order.yaml'),
    method: 'deploy'
  });
  const context = await engine.start();
  console.log(context.error);

  expect(context.status).toBe('success');
});