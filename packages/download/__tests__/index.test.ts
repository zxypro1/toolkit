import download from '../src';

test('download test', () => {
  const res = download();
  expect(res).toBe('download');
});
