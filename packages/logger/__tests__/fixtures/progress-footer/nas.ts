export default class B {
  progress: any;

  constructor(progress: any) {
    this.progress = progress;
  }
  
  async show() {
    let i = 0;

    await new Promise(r => {
      const intervalId = setInterval(() => {
        this.progress(`bbb ${i++}`);
        if (i === 50) {
          clearInterval(intervalId);
          r('');
        }
      }, 100);
    })
  }
}
