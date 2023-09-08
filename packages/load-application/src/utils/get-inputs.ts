import { isEmpty } from 'lodash';

export const getInputs = (inputs: Record<string, any> = {}, context: Record<string, any> = {}, artTemplate: any) => {
  if (isEmpty(inputs)) return;
  function deepCopy(obj: any) {
    let result: any = obj.constructor === Array ? [] : {};
    if (typeof obj === 'object') {
      for (var i in obj) {
        let val = obj[i];
        if (typeof val === 'object') {
          result[i] = deepCopy(val);
        } else {
          result[i] = artTemplate.compile(val)(context);
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
