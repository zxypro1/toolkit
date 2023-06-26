import compile from '../src/compile';
import path from 'path';

test('魔法符号 {{}}', () => {
  const res = compile('hello {{name}}', { name: 'world' });
  console.log(res);
  expect(res).toBe('hello world');
});

test('魔法符号 ${}', () => {
  const res = compile('hello ${name}', { name: 'world' });
  console.log(res);
  expect(res).toBe('hello world');
});

test("${env('PWD')}", () => {
  const res = compile("hello ${env('PWD')}");
  console.log(res);
  expect(res).toBe(`hello ${process.env.PWD}`);
});

test.only('vars.region', () => {
  const res = compile("hello ${vars.region}", { vars: { region: 'cn-hangzhou' } });
  console.log(res);
  expect(res).toBe(`hello cn-hangzhou`);
});

test('多个魔法变量拼接', () => {
  const res = compile("hello ${vars.region}--${vars.desc}", { vars: { region: 'cn-hangzhou', desc: 'this is a desc' } });
  console.log(res);
  expect(res).toBe(`hello cn-hangzhou--this is a desc`);
});

test('vars.service 对象', () => {
  const service = { region: 'cn-hangzhou' }
  const res = compile("${vars.service}", { vars: { service } });
  console.log(res);
  expect(res).toBe(service);
});

test('projectName.props.*', () => {
  const res = compile("hello ${projectName.props.region}", { projectName: { props: { region: 'cn-hangzhou' } } });
  console.log(res);
  expect(res).toBe(`hello cn-hangzhou`);
});

test('projectName.output.*', () => {
  const res = compile("hello ${projectName.output.region}", { projectName: { output: { region: 'cn-hangzhou' } } });
  console.log(res);
  expect(res).toBe(`hello cn-hangzhou`);
});

test('file', () => {
  const res = compile("${file('./file.json')}", { cwd: path.join(__dirname, './mock') });
  console.log(res);
  expect(typeof res).toBe('string');
});

test('json', () => {
  const res = compile("${json(file('./file.json')).name}", { cwd: path.join(__dirname, './mock') });
  console.log(res);
  expect(res).toBe('website-wof2-pre');
});

test.only('this', () => {
  const res = compile("${this.name}", { that: { name: 'test' } });
  console.log(res);
  expect(res).toBe('test');
});