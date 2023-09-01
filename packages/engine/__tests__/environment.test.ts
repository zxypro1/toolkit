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