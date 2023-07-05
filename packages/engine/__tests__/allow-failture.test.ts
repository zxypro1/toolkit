import Engine from '../src';
import path from 'path';
import { TipsError } from '@serverless-devs/utils';

test('global-pre-action', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failture/global-pre-action.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      // level: 'DEBUG',
    }
  });
  const context = await engine.start();
  const error = context.error as TipsError;
  console.log(error);
  expect(error.exitCode).toBe(101);
});

test('project-pre-action', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failture/project-pre-action.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      // level: 'DEBUG',
    }
  });
  const context = await engine.start();
  const error = context.error as TipsError;
  console.log(error);
  expect(error.exitCode).toBe(101);
});

test.only('project-success-action', async () => {
  const engine = new Engine({
    template: path.join(__dirname, './mock/allow-failture/project-success-action.yaml'),
    args: ['deploy'],
    logConfig:{
      logDir: path.join(__dirname, './logs'),
      // level: 'DEBUG',
    }
  });
  const context = await engine.start();
  const error = context.error as TipsError;
  console.log(error);
  expect(error.exitCode).toBe(101);
});