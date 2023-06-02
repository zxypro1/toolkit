// 组件开发
export default class Fc {
  logger: any;

  constructor({ logger }: any) {
    this.logger = logger;
  }
  
  async deploy(inputs: any) {
    let i = 0;

    this.logger.info('测试 info ', inputs.key);

    if (inputs?.addCustom) {
      this.logger.progress.upsert('test', '测试一个自定义')
    }
    
    await new Promise(r => {
      const intervalId = setInterval(() => {
        this.logger.progress(`aaa ${i++}`); // 自定义

        if (i === (inputs.runTime || 20)) {
          clearInterval(intervalId);
          r('');
        }
      }, 800);
    });

    this.logger.progress.removeItem('test');
  }
}
