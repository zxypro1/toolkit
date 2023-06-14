import { getYamlContent } from '../src';
import path from 'path';


test('基本测试', () => {
  const res = getYamlContent(path.join(__dirname, './mock/s.yaml'));
  console.log(res);
  expect(res).toEqual({ edition: '3.0.0', name: 'test' });
});

