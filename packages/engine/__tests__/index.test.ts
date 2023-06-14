import Engine from '../src';
import { get } from 'lodash';

test('engine 基本测试', async () => {
  const steps = [
    {
      projectName: 'a',
      run: async () => {
        console.log('执行a项目');
      }
    },
    {
      projectName: 'b',
      run: async () => {
        console.log('执行b项目');
      }
    },
  ];
  const engine = new Engine({
    steps,
    events: {
      onInit: async (context, logger) => {
        logger.info('onInit');
      },
      onCompleted: async (context, logger) => {
        logger.info('onCompleted');
      }
    }
  });
  const res = await engine.start();
  expect(get(res, 'status')).toBe('success');
});