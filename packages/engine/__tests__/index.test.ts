import Engine from '../src';
import { get } from 'lodash';
import path from 'path';


test('未找到yaml文件', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/empty.yaml'),
    method: 'deploy'
  });
  expect.assertions(1);
  try {
    console.log('start');
    await engine.start();
  } catch (e) {
    const error = e as Error;
    expect(error.message).toContain('the s.yaml/s.yml file was not found.')
  }
});

test.only('yaml格式不正确', async () => {
  const engine = new Engine({
    yamlPath: path.join(__dirname, './mock/exception.yaml'),
    method: 'deploy'
  });
  expect.assertions(1);
  try {
    console.log('start');
    await engine.start();
  } catch (e) {
    const error = e as Error;
    expect(error.message).toContain('exception.yaml format is incorrect')
  }
});

// test('engine 基本测试', async () => {
//   const steps = [
//     {
//       projectName: 'a',
//       run: async () => {
//         console.log('执行a项目');
//       }
//     },
//     {
//       projectName: 'b',
//       run: async () => {
//         console.log('执行b项目');
//       }
//     },
//   ];
//   const engine = new Engine({
//     yamlPath: path.join(__dirname, './mock/s.yaml'),
//     method: 'deploy'
//   });

//   // const engine = new Engine({
//   //   steps,
//   //   events: {
//   //     onInit: async (context, logger) => {
//   //       logger.info('onInit');
//   //     },
//   //     onCompleted: async (context, logger) => {
//   //       logger.info('onCompleted');
//   //     }
//   //   }
//   // });
//   const res = await engine.start();
//   // expect(get(res, 'status')).toBe('success');
// });