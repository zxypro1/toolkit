import { get } from 'lodash';
import loadComponent from '../src';
import path from 'path';
import fs from 'fs-extra';
import { getComponentCachePath } from '../src/utils';
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

test('v3test', async () => {
  const instance = await loadComponent('v3test', { logger: console, a: '123' });
  console.log(instance);
  expect(fs.existsSync(get(instance, '__path'))).toBe(true);

});

test('v3test@0.0.16', async () => {
  const instance = await loadComponent('v3test@0.0.16', { logger: console, a: '123' });
  console.log(instance);
  expect(fs.existsSync(get(instance, '__path'))).toBe(true);
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


test('core_load_serverless_devs_component=devsapp/fc@dev', async () => {
  process.env.core_load_serverless_devs_component = 'devsapp/fc@dev';
  const instance = await loadComponent('devsapp/fc@0.1.72');
  console.log(instance);
  // expect(get(instance, '__path')).toBe(componentPath);
});


test('wss-test', async () => {
  const name = 'wss-test';
  const instance = await loadComponent(name);
  console.log(instance);
  expect(get(instance, '__path')).toBe(getComponentCachePath(name));
});

test('wss-test@0.0.6', async () => {
  const name = 'wss-test@0.0.6';
  const instance = await loadComponent(name);
  console.log(instance);
  expect(get(instance, '__path')).toBe(getComponentCachePath('wss-test', '0.0.6'));
});

test('v3test 0.0.1', async () => {
  const name = 'v3test@0.0.1';
  const instance = await loadComponent(name);
  console.log(instance);
  expect(get(instance, '__path')).toBe(getComponentCachePath('v3test', '0.0.1'));
});

test('v3test dev.0.1', async () => {
  const name = 'v3test@dev.0.1';
  const instance = await loadComponent(name);
  expect(get(instance, '__path')).toBe(getComponentCachePath('v3test', 'dev.0.1'));
});

test.only('v3test beta.0.1#1', async () => {
  const name = 'v3test@beta.0.1#1';
  const instance = await loadComponent(name);
  expect(get(instance, '__path')).toBe(getComponentCachePath('v3test', 'beta.0.1#1'));
});
