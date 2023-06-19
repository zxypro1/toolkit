import { get } from 'lodash';
import loadComponent from '../src';
import path from 'path';


test('本地路径', async () => {
  const componentPath = path.resolve(__dirname, './mock/fc.js');
  const instance = await loadComponent(componentPath);
  console.log(instance);
  expect(get(instance, '__path')).toBe(componentPath);
});
