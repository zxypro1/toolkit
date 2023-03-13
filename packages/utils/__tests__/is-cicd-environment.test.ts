import { isCiCdEnvironment } from '../src';

test('isCiCdEnvironment with false', () => {
  const res = isCiCdEnvironment();
  expect(res).toBe(false);
});

test('isCiCdEnvironment with true', () => {
  process.env.PIPELINE_NAME = 'test';
  const res = isCiCdEnvironment();
  expect(res).toBe(true);
});
