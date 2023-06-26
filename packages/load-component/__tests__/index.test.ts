import { get } from 'lodash';
import loadComponent from '../src';
import path from 'path';
const env = process.env;

beforeEach(() => {
  process.env = { ...env };
});


test('本地路径', async () => {
  const componentPath = path.resolve(__dirname, './mock/fc.js');
  const instance = await loadComponent(componentPath);
  console.log(instance);
  expect(get(instance, '__path')).toBe(componentPath);
});

test.only('fc', async () => {
  const instance = await loadComponent('v3test', { logger: console, a: '123' });
  console.log(instance);
  // expect(get(instance, '__path')).toBe(componentPath);
});

test('fc@0.1.72', async () => {
  const instance = await loadComponent('fc@0.1.72');
  console.log(instance);
  // expect(get(instance, '__path')).toBe(componentPath);
});

test('devsapp/fc', async () => {
  const instance = await loadComponent('devsapp/fc');
  console.log(instance);
  // expect(get(instance, '__path')).toBe(componentPath);
});

test('devsapp/fc@0.1.72', async () => {
  const instance = await loadComponent('devsapp/fc@0.1.72');
  console.log(instance);
  // expect(get(instance, '__path')).toBe(componentPath);
});


test('core_load_serverless_devs_component=devsapp/fc@dev', async () => {
  process.env.core_load_serverless_devs_component = 'devsapp/fc@dev';
  const instance = await loadComponent('devsapp/fc@0.1.72');
  console.log(instance);
  // expect(get(instance, '__path')).toBe(componentPath);
});
