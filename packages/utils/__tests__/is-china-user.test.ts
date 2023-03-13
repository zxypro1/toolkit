import { isChinaUser } from '../src';

test('isChinaUser', () => {
  const res = isChinaUser();
  expect(res).toBe(true);
});
