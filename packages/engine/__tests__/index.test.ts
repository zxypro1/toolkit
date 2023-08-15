import Logger from '@serverless-devs/logger';
import Engine from '../src';
import path from 'path';
import { AssertionError } from 'assert';
import { get } from 'lodash';

test('指定 template 不存在', async () => {
  const engine = new Engine({
    template: './no.yaml',
    args: ['deploy'],
    cwd: path.join(__dirname, './mock')
  });
  const context = await engine.start();
  console.log(context.error);
  expect(get(context, 'error[0].message')).toMatch('The specified template file does not exist');
});

test('未指定 template', async () => {
  const engine = new Engine({
    args: ['deploy'],
    cwd: path.join(__dirname, './mock')
  });
  const context = await engine.start();
  console.log(context.error);
  expect(get(context, 'error[0].message')).toMatch('the s.yaml/s.yml file was not found');
});

test('yaml格式不正确', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/error/exception.yaml'),
    args: ['deploy']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(get(context, 'error[0].message')).toContain('exception.yaml format is incorrect');
});

test('extend yaml 格式有问题', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/error/extend-error.yaml'),
    args: ['deploy']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(get(context, 'error[0].message')).toContain('base-error.yaml format is incorrect');
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

test('credential secret', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/credential.yaml'),
    args: ['deploy'],
    logConfig: {
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('s deploy', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['deploy'],
    logConfig: {
      // level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});
test('s projectName deploy', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['framework', 'deploy']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test.only('extend', async () => {
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
  const command = 'empty';
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['framework', 'empty']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(get(context, 'error[0].message')).toBe(`The [${command}] command was not found.`);
  expect(get(context, 'error[0].exitCode')).toBe(100);
});

test('指定服务 方法存在，但是执行报错了', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['framework', 'error']
  });
  const context = await engine.start();
  expect(get(context, 'error[0].message')).toBe(`error test`);
  expect(get(context, 'error[0].exitCode')).toBe(101);
});

test('应用级操作 方法不存在时', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['empty']

  });
  const context = await engine.start();
  console.log(context.error);
  expect(get(context, 'status')).toBe('success');
});

test('应用级操作，方法执行报错了', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['error']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(get(context, 'error[0].message')).toBe(`error test`);
  expect(get(context, 'error[0].exitCode')).toBe(101);
});

test('全局action 成功', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/global-actions/s.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './mock/global-actions/logs')
    }
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});


test('flow', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow.yaml'),
    args: ['deploy'],
    logConfig: {
      // 'level': 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('flow-order', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-order.yaml'),
    args: ['deploy'],
    logConfig: {
      // 'level': 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context.error);
  expect(get(context, 'error[0].message')).toMatch('flow is invalid');
});

test('args', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow.yaml'),
    args: ['deploy', '--help', '-a', 'default', '--skip-actions', '--debug', '-o', 'json', '-v']
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('customLogger', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow.yaml'),
    args: ['deploy'],
    logConfig: {
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

test('skip-actions', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/global-actions/s.yaml'),
    args: ['deploy', '--skip-actions'],
    logConfig: {
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

test('project yaml extend', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/template/project-extend.yaml'),
    args: ['deploy'],
    logConfig: {
      // level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('extend and project yaml extend', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/template/extend-and-project-extend.yaml'),
    args: ['deploy'],
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('plugin update inputs', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/plugin.yaml'),
    args: ['deploy'],
    logConfig: {
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context.error);
  expect(context.status).toBe('success');
});

test('utils_2.DevsError is not a constructor', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
    args: ['error']
  });
  const context = await engine.start();
  expect(get(context, 'error[0].message')).toBe(`error test`);
  expect(get(context, 'error[0].exitCode')).toBe(101);
});

test('validate', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/project.yaml'),
  });
  const context = await engine.start();
  console.log(context);
  expect(get(context, 'error[0]')).toBeInstanceOf(AssertionError);
  expect(get(context, 'error[0].message')).toBe(`command is required`);
  expect(get(context, 'error[0].code')).toBe('ERR_ASSERTION');


});
