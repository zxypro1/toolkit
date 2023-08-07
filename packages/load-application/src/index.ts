import V3 from './v3';
import V2 from './v2';
import assert from 'assert';
import { IOptions } from './types';
import { includes } from 'lodash';
const debug = require('@serverless-cd/debug')('serverless-devs:load-appliaction');

export default async (template: string, options: IOptions = {}) => {
  assert(template, 'template is required');
  if (options.uri) {
    return await v3(template, options);
  }
  try {
    return await v2(template, options);
  } catch (error) {
    if (includes(template, '/')) {
      throw error;
    }
    return await v3(template, options);
  }
};

const v2 = async (template: string, options: IOptions = {}) => {
  debug('try to load v2');
  const res = await new V2(template, options).run();
  debug('load v2 success');
  return res;
};

const v3 = async (template: string, options: IOptions = {}) => {
  debug('try to load v3');
  const res = await new V3(template, options).run();
  debug('load v3 success');
  return res;
};
