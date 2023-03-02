import request from '../src';

test('request test', () => {
  const res = request();
  expect(res).toBe('request');
});
