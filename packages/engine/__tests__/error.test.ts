import Engine from '../src';
import path from 'path';

test('parse spec', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/parse-spec.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('failure');
});

test('method is required', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/basic.yaml'),
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('failure');
});

test('global-pre-action run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/global-pre-action-run.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('failure');
});

test('global-pre-action plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/global-pre-action-plugin.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-pre-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-pre-action-run.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-pre-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-pre-action-plugin.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-pre-action-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-pre-action-component.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-component.yaml'),
    args: ['error'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-success-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-success-action-run.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-success-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-success-action-plugin.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-success-action-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-success-action-component.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-fail-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-fail-action-run.yaml'),
    args: ['error'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test.only('project-fail-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-fail-action-plugin.yaml'),
    args: ['helloworld', 'error'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-fail-action-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-fail-action-component.yaml'),
    args: ['error'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-complete-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-complete-action-run.yaml'),
    args: ['error'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-complete-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-complete-action-plugin.yaml'),
    args: ['error'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('project-complete-action-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/project-complete-action-component.yaml'),
    args: ['error'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('next-project-complete-action-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/next-project-complete-action-component.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('global-success-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/global-success-action-run.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('global-success-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/global-success-action-plugin.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('global-complete-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/global-complete-action-run.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});

test('global-complete-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/flow-error/global-complete-action-plugin.yaml'),
    args: ['error'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
   expect(context.status).toBe('failure');

});