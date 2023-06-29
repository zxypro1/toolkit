import Engine from '../src';
import path from 'path';

test('未找到yaml文件', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/empty.yaml'),
    method: 'deploy',
  });
  expect.assertions(1);
  try {
    await engine.start();
  } catch (e) {
    const error = e as Error;
    expect(error.message).toContain('the s.yaml/s.yml file was not found.');
  }
});

test('yaml格式不正确', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/error/exception.yaml'),
    method: 'deploy',
  });
  expect.assertions(1);
  try {
    await engine.start();
  } catch (e) {
    const error = e as Error;
    expect(error.message).toContain('exception.yaml format is incorrect');
  }
});

test('extend yaml 格式有问题', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/error/extend-error.yaml'),
    method: 'deploy',
  });
  expect.assertions(1);
  try {
    await engine.start();
  } catch (e) {
    const error = e as Error;
    expect(error.message).toContain('base-error.yaml format is incorrect');
  }
});

test('魔法变量含中划线报错', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/error/dashed-line.yaml'),
    method: 'deploy',
  });
  expect.assertions(1);
  try {
    await engine.start();
  } catch (e) {
    const error = e as Error;
    expect(error.message).toContain(`not support '-' in value`);
  }
});

test('basic', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/basic.yaml'),
    method: 'deploy',
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('extend', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/extend/extend.yaml'),
    method: 'deploy',
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('order', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/order.yaml'),
    method: 'deploy',
  });
  const context = await engine.start();
  console.log(context.error);

  expect(context.status).toBe('success');
});

test('指定服务 方法不存在时', async () => {
  const method = 'empty';
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/project.yaml'),
    projectName: 'framework',
    method,
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.error.message).toMatch(`The [${method}] command was not found`);
  expect(context.error.message).toMatch('100');
});

test('指定服务 方法存在，但是执行报错了', async () => {
  const method = 'error';
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/project.yaml'),
    projectName: 'framework',
    method,
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.error.message).toMatch(`error test`);
  expect(context.error.message).toMatch('101');
});

test('应用级操作 方法不存在时', async () => {
  const method = 'empty';
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/project.yaml'),
    method,
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.error.message).toMatch(`The [${method}] command was not found`);
});

test('应用级操作，方法执行报错了', async () => {
  const method = 'error';
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/project.yaml'),
    method,
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.error.message).toMatch(`error test`);
  expect(context.error.message).toMatch('101');
});

test('全局action 成功', async () => {
  const method = 'deploy';
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/global-actions/s.yaml'),
    method,
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test.only('全局action 失败', async () => {
  const method = 'deploy';
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/global-actions/error.yaml'),
    method,
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.error.message).toMatch('Not implemented')
  expect(context.error.message).toMatch('101');
});

test('s projectName deploy', async () => {
  const method = 'deploy';
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/project.yaml'),
    method,
    projectName: 'framework'
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});
