import V3 from './v3';
import V2 from './v2';
import assert from 'assert';
import { IOptions } from './types';
import { includes } from 'lodash';
const debug = require('@serverless-cd/debug')('serverless-devs:load-appliaction');

export default async (template: string, options?: IOptions) => {
  assert(template, 'template is required');
  try {
    debug('try to load v2');
    const res = await new V2(template, options).run();
    debug('load v2 success');
    return res;
  } catch (error) {
    if (includes(template, '/')) {
      throw error;
    }
    debug('try to load v3');
    const res = await new V3(template, options).run();
    debug('load v3 success');
    return res;
  }
};
