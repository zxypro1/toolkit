import { diff, simpleDiff } from '../src';

test('diff', () => {
  const obj1 = { a: 4, b: 5 };
  const obj2 = { a: 3, b: 5 };
  const obj3 = { a: 3, b: null };
  const obj4 = { a: 3, c: 5 };

  let result = diff(obj1, obj2)
  expect(result).toEqual([{ op: 'replace', path: ['a'], value: 3 }]);

  result = diff(obj1, obj1)
  expect(result).toEqual([]);

  result = diff(obj1, obj3);
  expect(result).toEqual([
    { op: 'replace', path: ['a'], value: 3 },
    { op: 'replace', path: ['b'], value: null },
  ]);

  result = diff(obj1, obj4);
  expect(result).toEqual([
    { op: 'remove', path: ['b'] },
    { op: 'replace', path: ['a'], value: 3 },
    { op: 'add', path: ['c'], value: 5 },
  ]);
});

test('showSimpleDiffString', () => {
  const a = {
    a: 1,
    b: '2',
    c: ['1', '2', '3'],
    d: {
      da: 1,
      db: {
        dba: 2
      }
    },
    e: null,
  };

  const b = {
    a: 1,
    b: 2,
    c: ['1', '2', 4],
    d: {
      da: 1,
      db: {
        dbb: 4
      },
      df: {
        dbb: 4
      }
    }
  }

  const { show, diffResult } = simpleDiff(a, b);
  expect(diffResult).toEqual([
    { op: 'remove', path: [ 'd', 'db', 'dba' ] },
    { op: 'remove', path: [ 'e' ] },
    { op: 'replace', path: [ 'b' ], value: 2 },
    { op: 'replace', path: [ 'c', 2 ], value: 4 },
    { op: 'add', path: [ 'd', 'db', 'dbb' ], value: 4 },
    { op: 'add', path: [ 'd', 'df' ], value: { dbb: 4 } }
  ])
  console.log(show);
})

test.only('showCompleteDiffString', () => {
  const a = {
    a: 1,
    b: '2',
    c1: [null],
    c: ['1', '2', '3', null],
    d: {
      da: 1,
      db: {
        dba: 2
      }
    },
    e: null,
  };

  const b = {
    a: 1,
    b: 2,
    c: ['1', '2', 4],
    d: {
      da: 1,
      db: {
        dbb: 4
      },
      df: {
        dbb: 4
      }
    }
  }

  const { show, diffResult } = simpleDiff(a, b, { complete: true });
  expect(diffResult).toEqual([
    { op: 'remove', path: [ 'd', 'db', 'dba' ] },
    { op: 'remove', path: [ 'c1' ] },
    { op: 'remove', path: [ 'e' ] },
    { op: 'remove', path: [ 'c', 3 ] },
    { op: 'replace', path: [ 'b' ], value: 2 },
    { op: 'replace', path: [ 'c', 2 ], value: 4 },
    { op: 'add', path: [ 'd', 'db', 'dbb' ], value: 4 },
    { op: 'add', path: [ 'd', 'df' ], value: { dbb: 4 } }
  ])
  console.log(show);
})
