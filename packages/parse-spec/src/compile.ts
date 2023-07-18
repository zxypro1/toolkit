import fs from 'fs-extra';
import path from 'path';
import artTemplate from '@serverless-devs/art-template';
import { REGX } from './contants';
import { get, isEmpty } from 'lodash';

artTemplate.defaults.escape = false;
artTemplate.defaults.rules.push({
  test: REGX,
  use: function (match: any, code: any) {
    return {
      code,
      output: 'raw',
    };
  },
});

const compile = (value: string, context: Record<string, any> = {}) => {
  // 仅针对字符串进行魔法变量解析
  if (!value || typeof value !== 'string') return value;
  const env = { ...process.env, ...context.env };
  const cwd = context.cwd || process.cwd();

  artTemplate.defaults.imports.env = (value: string) => {
    const res = env[value];
    if (res) return res;
    throw new Error(`env('${value}') not found`);
  };
  artTemplate.defaults.imports.config = (value: string) => {
    const res = get(context, `credential.${value}`);
    if (res) return res;
    throw new Error(`config('${value}') not found`);
  };
  artTemplate.defaults.imports.path = (value: string) => {
    if (isEmpty(value)) {
      throw new Error(`path value is empty`);
    }
    const res = path.isAbsolute(value) ? value : path.join(cwd, value);
    if (fs.existsSync(res)) return res;
    throw new Error(`path value not found`);
  };
  artTemplate.defaults.imports.json = (value: string) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(`json('${value}') parse error`);
    }
  };
  artTemplate.defaults.imports.file = (filePath: string) => {
    try {
      const newPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
      return fs.readFileSync(newPath, 'utf8');
    } catch (error) {
      throw new Error(`file('${filePath}') not found`);
    }
  };
  artTemplate.defaults.imports.regx = (value: string) => {
    const r = new RegExp(value);
    return r.test(context.command);
  };
  // fix: this. => that.
  const thatVal = value.replace(/\$\{this\./g, '${that.');
  try {
    const res = artTemplate.compile(thatVal)(context);
    // 解析过后的值如果是字符串，且包含魔法变量，则再次解析
    if (typeof res === 'string' && REGX.test(res)) {
      const newValue = artTemplate.compile(res)(context);
      return newValue || res;
    }
    return res;
  } catch (e) {
    const error = e as Error;
    throw new Error(`compile error, ${error.message}`);
  }
};

export default compile;
