import { getCurrentEnvironment } from '../src';
const env = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...env };
});

afterEach(() => {
  process.env = env;
});

test('yunxiao', () => {
  process.env.PIPELINE_NAME = 'test';
  const res = getCurrentEnvironment();
  expect(res).toBe('yunxiao');
});

test('serverless_cd', () => {
  process.env.SERVERLESS_CD = 'serverless_cd';
  const res = getCurrentEnvironment();
  expect(res).toBe('serverless_cd');
});
