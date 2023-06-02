import ProgressFooter from '../src/progress-footer';

// cli / log / engine 开发
function getFunctionProgress(key: string, progressFooter: ProgressFooter) {
  function show(message: string){
    progressFooter.upsert(key, message)
  };

  show.upsert = progressFooter.upsert;
  show.removeItem = progressFooter.removeItem;

  // show.stop = progressFooter.stop;
  // show.start = progressFooter.start;

  // show.getKeys = progressFooter;

  return show;
}

/**

- 有交互的时候
- 输出到文件效果需要确认 ( upsert => info )
- 进程结束，如果不调用 progressFooter.clear() 光标就没有了
- window ?
- winston / egg-logger

*/

async function test() {
  const progressFooter = new ProgressFooter();
  const logger = console;


  const keyA = 'a';
  const p = getFunctionProgress(keyA, progressFooter);

  const a = new (require(`./fixtures/${keyA}`).default)(p);
  const keyB = 'b';
  const b = new (require(`./fixtures/${keyB}`).default)(getFunctionProgress(keyB, progressFooter));

  await Promise.all([
    a.show().then(() => {
      console.log(`${keyA} 结束了`);
      progressFooter.removeItem(keyA)
    }),
    b.show().then(() => {
      console.log(`${keyB} 结束了`);
      progressFooter.removeItem(keyB)
    }),
  ]);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log('都结束了');
  progressFooter.clear();
}

test();

