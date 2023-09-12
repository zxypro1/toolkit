import { isEmpty } from 'lodash';
import { DOUBLE_CURLY_BRACES } from '../constant';

export const getInputs = (inputs: Record<string, any> = {}, context: Record<string, any> = {}, artTemplate: any) => {
  if (isEmpty(inputs)) return;
  function getValue(val: any) {
    if (typeof val !== 'string') {
      return val;
    }
    if (DOUBLE_CURLY_BRACES.test(val)) {
      return artTemplate.compile(val)(context)
    }
    return val
  }
  function deepCopy(obj: any) {
    let result: any = obj.constructor === Array ? [] : {};
    if (typeof obj === 'object') {
      for (var i in obj) {
        let val = obj[i];
        if (typeof val === 'object') {
          result[i] = deepCopy(val);
        } else {
          result[i] = getValue(val);
        }
      }
    } else {
      result = obj;
    }
    return result;
  }
  return deepCopy(inputs);
};

export default getInputs;
