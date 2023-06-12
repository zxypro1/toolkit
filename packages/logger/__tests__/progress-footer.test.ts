import ProgressFooter from '../src/progress-footer';

// engine log 开发时，不可以将所有的日志都暴露出来，所以选择性的暴露给用户
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
- 日志删除

*/

async function test() {
  const progressFooter = new ProgressFooter();

  const keyA = 'fc';
  const p = getFunctionProgress(keyA, progressFooter);

  const a = new (require(`./${keyA}`).default)(p);
  const keyB = 'nas';
  const b = new (require(`./${keyB}`).default)(getFunctionProgress(keyB, progressFooter));

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

