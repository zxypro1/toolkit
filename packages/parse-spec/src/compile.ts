import fs from 'fs-extra';
import path from 'path';
import artTemplate from '@serverless-devs/art-template';
import { REGX } from './contants';
import { get, isEmpty, isNil } from 'lodash';


const compile = (value: string, _context: Record<string, any> = {}) => {
  // 仅针对字符串进行魔法变量解析
  if (!value || typeof value !== 'string') return value;
  const { __runtime, __steps, ...context } = _context;
  const env = { ...process.env, ...context.env };
  const cwd = context.cwd || process.cwd();

  artTemplate.defaults.imports.$escape = (value: any, magic: string, ignoreError: boolean) => {
    if (typeof value === 'boolean') return value;
    if (value) return value;
    if (ignoreError) return magic;
    throw new Error(`${magic} not found`);
  };

  artTemplate.defaults.rules[2] = {
    test: REGX,
    use: function (match: any, code: any) {
      return {
        code,
        output: 'escape',
      };
    },
  }

  artTemplate.defaults.rules.push({
    test: REGX,
    use: function (match: any, code: any) {
      return {
        code,
        output: 'escape',
      };
    },
  });

  artTemplate.defaults.imports.env = (value: string, defaultValue?: any) => {
    const res = env[value];
    if (res) return res;
    if (!isNil(defaultValue)) {
      return defaultValue;
    }
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
  artTemplate.defaults.imports.regex = (value: string) => {
    const r = new RegExp(value);
    return r.test(context.command);
  };
  // fix: this. => that.
  const thatVal = value.replace(/\$\{this\./g, '${that.');
  const params = { runtime: __runtime, steps: __steps };
  try {
    const res = artTemplate.compile(thatVal, params)(context);
    // 解析过后的值如果是字符串，且包含魔法变量，则再次解析
    if (typeof res === 'string' && REGX.test(res)) {
      return artTemplate.compile(res, params)(context);
    }
    return res;
  } catch (e) {
    const error = e as Error;
    // fix: that. => this.
    const msg = error.message.replace(/\$\{that\./g, '${this.');
    throw new Error(msg);
  }
};

export default compile;
