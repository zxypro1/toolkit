import Logger from '@serverless-devs/logger';
import Engine from '../src';
import path from 'path';

test('未找到yaml文件', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/empty.yaml'),
    args: ['deploy']
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
    template: path.join(__dirname, './mock/error/exception.yaml'),
    args: ['deploy']
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
    template: path.join(__dirname, './mock/error/extend-error.yaml'),
    args: ['deploy']
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
    template: path.join(__dirname, './mock/error/dashed-line.yaml'),
    args: ['deploy']
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
    template: path.join(__dirname, './mock/basic.yaml'),
    args: ['deploy']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('extend', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/extend/extend.yaml'),
    args: ['deploy']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('order', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/order.yaml'),
    args: ['deploy']
  });
  const context = await engine.start();
  console.log(context.error);

  expect(context.status).toBe('success');
});

test('指定服务 方法不存在时', async () => {
  const method = 'empty';
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['framework','empty']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.error.message).toMatch(`The [${method}] command was not found`);
  expect(context.error.message).toMatch('100');
});

test('指定服务 方法存在，但是执行报错了', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['framework','error']

  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.error.message).toMatch(`error test`);
  expect(context.error.message).toMatch('101');
});

test('应用级操作 方法不存在时', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['empty']
    
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.error.message).toMatch(`The [empty] command was not found`);
});

test('应用级操作，方法执行报错了', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['error']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.error.message).toMatch(`error test`);
  expect(context.error.message).toMatch('101');
});

test('全局action 成功', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/global-actions/s.yaml'),
    args: ['deploy']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('全局action 失败', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/global-actions/error.yaml'),
    args: ['deploy']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.error.message).toMatch('Not implemented')
  expect(context.error.message).toMatch('101');
});

test('s projectName deploy', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['framework','deploy']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});


test('flow', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow.yaml'),
    args: ['deploy']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('args', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow.yaml'),
    args: ['deploy', '--help', '-a', 'test', '--skip-actions', '--debug', '-o', 'json', '-v' ]
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test.only('customLogger', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow.yaml'),
    args: ['deploy'],
    logConfig:{
      customLogger: new Logger({
        traceId: Math.random().toString(16).slice(2),
        logDir: path.join(__dirname, 'logs'),
      })
    }
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});