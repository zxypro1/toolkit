import Engine from '../src';
import path from 'path';
import { get } from 'lodash';
const cwd = path.join(__dirname, './mock/environment');

test('environment and extend is conflict', async () => {
  const engine = new Engine({
    template: 'extend.yaml',
    args: ['deploy'],
    cwd,
  });
  const context = await engine.start();
  console.log(context);
  expect(get(context, 'error[0].message')).toMatch('environment and extend is conflict');
});

test('If you want to use environment, you must specify --env', async () => {
  const engine = new Engine({
    template: 's.yaml',
    args: ['deploy'],
    cwd,
  });
  const context = await engine.start();
  console.log(context);
  expect(get(context, 'error[0].message')).toMatch('If you want to use environment, you must specify --env');
});

test('env name was not found', async () => {
  const envName = 'no_found'
  const engine = new Engine({
    template: 's.yaml',
    args: ['deploy', '--env', envName],
    cwd,
  });
  const context = await engine.start();
  console.log(context);
  expect(get(context, 'error[0].message')).toMatch(`env ${envName} was not found`);
});

test.only('baisc', async () => {
  const envName = 'prod'
  const engine = new Engine({
    template: 's.yaml',
    args: ['deploy', '--env', envName],
    cwd,
    logConfig: {
      level: 'DEBUG',
    }
  });
  const context = await engine.start();
  console.log(context);
  expect(get(context, 'status')).toBe('success');
});