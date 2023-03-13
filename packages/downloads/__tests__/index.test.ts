import download from '../src';
import path from 'path';

test('download url is empty', async () => {
  await expect(download('')).rejects.toThrow('url is required');
});

test('download url is abc.com', async () => {
  await expect(download('abc.com')).rejects.toThrow('url must be http or https');
});

const url = 'https://registry.devsapp.cn/simple/devsapp/core/zipball/0.1.54';

test('download 基本用法', async () => {
  await expect(download(url)).resolves.toBeUndefined();
});

test('download dest', async () => {
  await expect(
    download(url, {
      dest: path.join(__dirname, '_temp', 'basic'),
    }),
  ).resolves.toBeUndefined();
});

test('download extract', async () => {
  await expect(
    download(url, {
      dest: path.join(__dirname, '_temp', 'extract'),
      extract: true,
    }),
  ).resolves.toBeUndefined();
});

test('download strip', async () => {
  await expect(
    download(url, {
      dest: path.join(__dirname, '_temp', 'strip'),
      extract: true,
      strip: 1,
    }),
  ).resolves.toBeUndefined();
});

test('download filename', async () => {
  await expect(
    download(url, {
      dest: path.join(__dirname, '_temp', 'core'),
      filename: 'core.zip',
    }),
  ).resolves.toBeUndefined();
});
