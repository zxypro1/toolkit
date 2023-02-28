import loadApplication from '../src';

test('loadApplication test', () => {
  const res = loadApplication();
  expect(res).toBe('loadApplication');
});
