import { filter, isEmpty } from 'lodash';
import { REGX } from '../constant';

export const getInputs = (inputs: Record<string, any> = {}, context: Record<string, any> = {}, artTemplate: any) => {
  if (isEmpty(inputs)) return;
  artTemplate.defaults.rules = filter(artTemplate.defaults.rules, o => String(o.test) !== String(REGX));
  function deepCopy(obj: any) {
    let result: any = obj.constructor === Array ? [] : {};
    if (typeof obj === 'object') {
      for (var i in obj) {
        let val = obj[i];
        if (typeof val === 'object') {
          result[i] = deepCopy(val);
        } else {
          result[i] = typeof val === 'string' ? artTemplate.compile(val)(context) : val;
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
