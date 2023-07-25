import { getInputs } from '../src';
import { getYamlContent } from '@serverless-devs/utils';

import path from 'path';

test('基本测试', async () => {
  const c = getYamlContent(path.join(__dirname, './mock/cadt.yaml'));
  console.log(c);
  const res = getInputs(c, { access: 'default', cadtYamlString: { a: { b: 1 }, c: { d: 2 } } })
  console.log(res);
  expect(res).toEqual({
    edition: '3.0.0',
    name: 'cadtApp',
    access: 'default',
    resources: { a: { b: 1 }, c: { d: 2 } }
  })
});
