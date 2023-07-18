import Engine from '../src';
import path from 'path';


test('global-pre-action run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/global-pre-action-run.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');
});

test('global-pre-action plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/global-pre-action-plugin.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-pre-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-pre-action-run.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-pre-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-pre-action-plugin.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-pre-action-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-pre-action-component.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-component.yaml'),
    args: ['error'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      // level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-success-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-success-action-run.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-success-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-success-action-plugin.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-success-action-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-success-action-component.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-fail-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-fail-action-run.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-fail-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-fail-action-plugin.yaml'),
    args: ['error'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-fail-action-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-fail-action-component.yaml'),
    args: ['error'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-complete-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-complete-action-run.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-complete-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-complete-action-plugin.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('project-complete-action-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/project-complete-action-component.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('next-project-complete-action-component', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/next-project-complete-action-component.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('global-success-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/global-success-action-run.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('global-success-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/global-success-action-plugin.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('global-complete-action-run', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/global-complete-action-run.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');

});

test('global-complete-action-plugin', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failure/global-complete-action-plugin.yaml'),
    args: ['deploy'],
    logConfig: {
      logDir: path.join(__dirname, './logs'),
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(context.status).toBe('success');
});