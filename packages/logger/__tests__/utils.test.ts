import EngineLogger, { mark, formatter } from '../src';
import { IMeta } from '../src/type';

test('mark', async () => {
  const lenLarge8 = '123456456789';
  const lenSmall8 = '1234567';

  const transportLarge = mark(lenLarge8);
  expect(transportLarge).toBe('123******789');

  const transportSmall = mark(lenSmall8);
  expect(transportSmall).toBe('*******');
  // expect(zipFiles).toEqual(expect.arrayContaining([]));
  // expect(zipFiles).not.toEqual(expect.arrayContaining([]));
});

test('formatter', async () => {
  const payload: IMeta = {
    date: '2023-06-02',
    message: 'This is a test message and will be displayed.\nThis is a test message and will be displayed.',
    secrets: ['this', 'test message'],
  }

  const result = formatter(payload);
  expect(result).toBe('This is a tes******age and will be displayed.\nThis is a tes******age and will be displayed.');
});

// test 不显示，但是ts 和 js 正常调用都没有问题
describe.skip('换行符', () => {
  test('自定义换行符', async () => {
    const logger = new EngineLogger({ eol: '换行符' });
    logger.info('info 1');
    logger.info('info 2');
  });

  test('文件流输出', async () => {
    const logger = new EngineLogger()

    logger.info('下行换行 1');
    logger.info('下行换行 2');

    logger.append('append(下行不换行)  1');
    logger.append('append(下行不换行) 2');

    logger.info('下行换行 3');
    logger.info('end');
  });
})

