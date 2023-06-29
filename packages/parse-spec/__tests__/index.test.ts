import ParseSpec from '../src';
import path from 'path';

test('基本测试', async () => {
  const parse = new ParseSpec(path.join(__dirname, './mock/simple.yaml'));
  const res = parse.start();
  expect(res).not.toBeNull();
});
