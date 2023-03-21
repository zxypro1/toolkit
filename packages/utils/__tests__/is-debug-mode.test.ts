import { isDebugMode } from '../src';

const env = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...env };
});

afterEach(() => {
  process.env = env;
});

test('basic', () => {
  const res = isDebugMode();
  expect(Boolean(res)).toBe(false);
});

test('DEBUG true', () => {
  process.env.DEBUG = 'true';
  const res = isDebugMode();
  expect(res).toBe(true);
});

test('DEBUG false', () => {
  process.env.DEBUG = 'false';
  const res = isDebugMode();
  expect(Boolean(res)).toBe(false);
});

test('--debug', () => {
  process.argv.push('--debug');
  const res = isDebugMode();
  expect(res).toBe(true);
});
