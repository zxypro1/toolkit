import ignoreWalk from '../src';
import path from 'path';

const codePath = path.join(__dirname, 'fixtures', 'ignore-code');

test('ignore walk', async () => {
  const zipFiles = await ignoreWalk({
    ignoreFiles: ['.fcignore'],
    path: codePath,
    includeEmpty: true,
  });

  // console.log('zipFiles: ', zipFiles, (zipFiles as any).includes('keep-empty-dir'))
  
  expect(zipFiles).toEqual(expect.arrayContaining([
    '.fcignore',
    'apt-get.list',
    'dir-2/.hide-dir/apt-get.list',
    'dir-2/no-ignore/file',
    'empty-dir',
    'ignore-non-root-dir/index',
    'index.js',
    // 'keep-empty-dir', // TODO: 仅忽略根目录下的所有文件,但不忽略文件夹
  ]));
  expect(zipFiles).not.toEqual(expect.arrayContaining([
    '.hide-dir/apt-get.list',
    '.hide-dir/apt-get2.list',
    'dir-2/file',
    'dir-2/ignore-all/test',
    'dir-2/ignore-non-root-dir/index',
    'ignore-all/test',
    'keep-empty-dir/ignore-file',
  ]));
});
