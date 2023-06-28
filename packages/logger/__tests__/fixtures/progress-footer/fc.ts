// 组件开发
export default class A {
  progress: any;

  constructor(progress: any) {
    this.progress = progress;
  }

  async show() {
    let i = 0;

    await new Promise((r) => {
      const intervalId = setInterval(() => {
        this.progress(`aaa ${i++}`); // 自定义
        // 用户自定义的 spanner
        // this.progress.upsert('test', 'deploy' + i)

        if (i === 50) {
          clearInterval(intervalId);
          this.progress.removeItem('test');
          r('');
        }
      }, 50);
    });
  }
}
