// 组件开发
export default class Fc {
  logger: any;

  constructor({ logger }: any) {
    this.logger = logger;
  }

  async deploy(inputs: any) {
    let i = 0;

    this.logger.info('测试 info inputs', inputs);

    await new Promise((r) => {
      const intervalId = setInterval(() => {
        this.logger.debug('Test info inputs 1abcd', i);
        this.logger.progress(`aaa ${i++}`); // 自定义

        if (i === (inputs.runTime || 20)) {
          clearInterval(intervalId);
          r('');
        }
      }, 800);
    });
  }
}
