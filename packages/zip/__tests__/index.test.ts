import zip from '../src';
import path from 'path';
import * as fse from 'fs-extra';
import { spawnSync } from 'child_process';

const fixturesUri = path.join(__dirname, 'fixtures');

// 提前检测系统命令是否存在, 如果不存在给出警告 并且需要在代码中跳过此类测试
let testZipContents = true;
beforeAll(() => {
  const unzipResult = spawnSync('unzip -v', { shell: true, encoding: 'utf8' });
  const sedResult = spawnSync('sed -h', { shell: true, encoding: 'utf8' });
  const awkResult = spawnSync('awk --version', { shell: true, encoding: 'utf8' });

  let errorMessage = '';
  if (sedResult.error || sedResult.status === 127) {
    errorMessage += 'sed ';
  }
  if (awkResult.error || awkResult.status === 127) {
    errorMessage += 'awk ';
  }
  if (unzipResult.error || unzipResult.status === 127) {
    errorMessage += 'unzip ';
  }

  if (errorMessage) {
    console.error(`${errorMessage} 命令不存在，无法测试内部文件，请安装后重试`);
    testZipContents = false;
  }
})

// 清除测试文件
const outputFiles: string[] = [];
afterAll(() => {
  outputFiles.forEach((file) => {
    try {
      fse.removeSync(file);
    } catch (e) {
      console.error('删除测试文件失败，请手动删除：', file, '。错误信息: ', e);
    }
  })
})

test('最简单压缩', async () => {
  const { outputFile, count } = await zip({
    codeUri: path.join(fixturesUri, 'basic'),
  });
  outputFiles.push(outputFile);

  expect(fse.existsSync(outputFile)).toBeTruthy();
  expect(count).toBe(3);

  if (testZipContents) {
    // 测试 zip 内的内容
    const fileNames = getFileNameList(outputFile);
    expect(fileNames).toContain('index.js');
    expect(fileNames).toContain('bootstrap');
    expect(fileNames).toContain('bootstrap.sh');


    // 测试压缩文件的状态：比如可执行、软链等
    const unzipBasePath = path.join(fixturesUri, 'basic-unzip');
    outputFiles.push(unzipBasePath);

    spawnSync(`unzip -d ${unzipBasePath} ${outputFile}`, {
      shell: true,
      encoding: 'utf8',
    });

    const bootstrapStat = fse.statSync(path.join(unzipBasePath, 'bootstrap'));
    const bootstrapIsOperational = (bootstrapStat.mode & 0o111) !== 0;
    expect(bootstrapIsOperational).toBeTruthy();

    const lnStat = fse.lstatSync(path.join(unzipBasePath, 'bootstrap.sh'));
    const bootstrapIsSymbolicLink = lnStat.isSymbolicLink();
    expect(bootstrapIsSymbolicLink).toBeTruthy();
  }
});

test('配置压缩目录前缀', async () => {
  const { outputFile, count } = await zip({
    codeUri: path.join(fixturesUri, 'basic'),
    outputFilePath: path.join(fixturesUri, 'test-zip-dir'),
    prefix: 'node_modules'
  });
  outputFiles.push(outputFile);

  expect(count).toBe(3);
  expect(fse.existsSync(outputFile)).toBeTruthy();

  if (testZipContents) {
    // 测试 zip 内的内容
    const fileNames = getFileNameList(outputFile);
    expect(fileNames).toContain('node_modules/index.js');
    expect(fileNames).toContain('node_modules/bootstrap');
    expect(fileNames).toContain('node_modules/bootstrap.sh');
  }
});

test('配置指定 ignore 的文件', async () => {
  const { outputFile, count } = await zip({
    codeUri: path.join(fixturesUri, 'appoint-ignore'),
    outputFilePath: path.join(fixturesUri, 'test-zip-dir'),
    ignoreFiles: ['.test-ignore']
  });
  outputFiles.push(outputFile);

  expect(count).toBe(2);
  expect(fse.existsSync(outputFile)).toBeTruthy();

  if (testZipContents) {
    // 测试 zip 内的内容
    const fileNames = getFileNameList(outputFile);
    expect(fileNames).toContain('index.js');
    expect(fileNames).toContain('.test-ignore');
  }
});

test('较复杂的测试case', async () => {
  const outputFileName = `text-${new Date().getTime()}.zip`;
  const outputFilePath = path.join(fixturesUri, 'test-zip-dir');
  const { outputFile, count } = await zip({
    codeUri: path.join(fixturesUri, 'ignore-code'),
    ignoreFiles: ['.fcignore'],
    outputFilePath,
    outputFileName,
  });
  outputFiles.push(outputFile);
  

  expect(count).toBe(8);
  expect(outputFile).toBe(path.join(outputFilePath, outputFileName));
  expect(fse.existsSync(outputFile)).toBeTruthy();

  if (testZipContents) {
    // 测试 zip 内的内容
    const fileNames = getFileNameList(outputFile);
    expect(fileNames).toEqual(expect.arrayContaining([
      '.fcignore',
      'apt-get.list',
      'dir-2/.hide-dir/apt-get.list',
      'dir-2/no-ignore/file',
      'empty-dir/',
      'ignore-non-root-dir/index',
      'index.js',
    ]));
    expect(fileNames).not.toEqual(expect.arrayContaining([
      '.hide-dir/apt-get.list',
      '.hide-dir/apt-get2.list',
      'dir-2/file',
      'dir-2/ignore-all/test',
      'dir-2/ignore-non-root-dir/index',
      'ignore-all/test',
      'keep-empty-dir/ignore-file',
    ]));
  }
});


function getFileNameList(file: string) {
  const { stdout, error } = spawnSync(`unzip -v ${file} | sed -r '1,3d; s/^([^ ]+ +){3}//' | awk '{print $NF}'`, {
    shell: true,
    encoding: 'utf8',
  });
  if (error) {
    throw error;
  }
  return stdout.split('\n').slice(0, -3);
}
