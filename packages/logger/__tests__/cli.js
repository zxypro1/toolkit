const getCliProgressFooter = require("cli-progress-footer");
const ee = require('event-emitter');

class A {
  constructor(progress) {
    this.progress = progress;
  }
  
  async show() {
    let i = 0;
    
    await new Promise(r => {
      const intervalId = setInterval(() => {
        // console.log('console.log', i);
        this.progress(`aaa ${i++}`);
        if (i === 50) {
          clearInterval(intervalId);
          r();
        }
      }, 50);
    })
  }
}

class B {
  constructor(progress) {
    this.progress = progress;
  }
  
  async show() {
    let i = 0;
    
    await new Promise(r => {
      const intervalId = setInterval(() => {
        this.progress(`bbb ${i++}`);
        if (i === 50) {
          clearInterval(intervalId);
          r();
        }
      }, 100);
    })
  }
}

const m = new Map();
const m2 = new Map();

m2.set('a', 2);
m.set('a', m2);

console.log(m);

process.exit();
// await new Promise((resolve) => setTimeout(resolve, 2000));
(async () => {
  const cliProgressFooter = getCliProgressFooter();
  const showList = new Map();

  function listener (id, message) {
    showList.set(id, message);

    const show = [];
    showList.forEach((value, key) => {
      show.push(`${key}\n\t${value}`);
    })
    cliProgressFooter.updateProgress(show);
  }

  const emitter = ee();

  emitter.on('progress', listener);

  const progressA = (message) => {
    emitter.emit('progress', 'A', message); 
  };
  const a = new A(progressA);

  const progressB = (message) => {
    emitter.emit('progress', 'B', message); 
  };
  const b = new B(progressB);

  await Promise.all([
    a.show(),
    b.show(),
  ]);

  emitter.off('progress', listener);
  cliProgressFooter.updateProgress();
})()
