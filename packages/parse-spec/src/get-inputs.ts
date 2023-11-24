const compile = require('@serverless-devs/art-template/lib/devs-compile');
import { isEmpty } from 'lodash';

export const getInputs = (_inputs: Record<string, any> = {}, context: Record<string, any> = {}) => {
  const inputs = typeof _inputs === 'string' ? compile(_inputs, context) : _inputs;
  if (isEmpty(inputs)) return inputs;
  function deepCopy(obj: any) {
    let result: any = obj?.constructor === Array ? [] : {};
    if (typeof obj === 'object') {
      for (var i in obj) {
        let val = obj[i];
        if (typeof val === 'string') {
          val = compile(val, context);
        }
        result[i] = typeof val === 'object' ? deepCopy(val) : val;
      }
    } else {
      result = obj;
    }
    return result;
  }
  return deepCopy(inputs);
};

export default getInputs;
