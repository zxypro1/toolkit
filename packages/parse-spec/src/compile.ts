import fs from 'fs-extra';
import yaml from 'js-yaml';
import path from 'path';
import artTemplate from '@serverless-devs/art-template';
import * as utils from '@serverless-devs/utils';
import { REGX } from './contants';
import { get } from 'lodash';

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

const file = (filePath: string) => {
  try {
    const extname = path.extname(filePath);
    if (['.yaml', '.yml'].includes(extname)) {
      return yaml.load(fs.readFileSync(filePath, 'utf8'));
    }
    if (extname === '.json') {
      return fs.readJSONSync(filePath);
    }
  } catch (error) {
    return {};
  }
};

const compile = (value: string, context: Record<string, any> = {}) => {
  // 仅针对字符串进行魔法变量解析
  if (!value || typeof value !== 'string') return value;
  const env = { ...process.env, ...context.env };
  const cwd = context.cwd || process.cwd();

  artTemplate.defaults.imports.env = (value: string) => env[value];
  artTemplate.defaults.imports.config = (value: string) => get(context, `credential.${value}`);
  artTemplate.defaults.imports.path = (value: string) => utils.getAbsolutePath(value, cwd);
  artTemplate.defaults.imports.file = (filePath: string) => {
    const newPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
    return file(newPath);
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
    return value;
  }
};

export default compile;
