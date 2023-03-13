import { getCurrentEnvironment } from '../src';

test('getCurrentEnvironment', () => {
  process.env.PIPELINE_NAME = 'test';
  const res = getCurrentEnvironment();
  expect(res).toBe('yunxiao');
});
