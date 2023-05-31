import ProgressService, { ProgressType } from '../src';

const bar = async () => {
  const bar = new ProgressService(
    ProgressType.Bar,
    {
      total: 1000,
    },
    `Bar ((:bar)) :current/:total(Bytes) :percent :etas`,
  );
  for (let i = 0; i < 1000; i += 50) {
    await new Promise(r => setTimeout(r, 100)); 
    bar.update(i);
  }
  bar.terminate();
};

const loading = async () => {
  const bar = new ProgressService(
    ProgressType.Loading,
    { curr: 0, total:100 },
  );
  await new Promise(r => setTimeout(r, 1300)); 
  bar.update(24);
  await new Promise(r => setTimeout(r, 1300)); 
  bar.update(30);
  await new Promise(r => setTimeout(r, 1500)); 
  bar.update(70);
  await new Promise(r => setTimeout(r, 1500)); 
  bar.terminate();
}

test('Progress loading update', loading);
test('Progress bar update', bar);
