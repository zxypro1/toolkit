import { each, filter, includes, isString, isEmpty, replace } from 'lodash';


export const sliceFormatterSlice = (value: string) => value.slice(0, -4);

export const mark = (val: string): string => {
  if (isEmpty(val) || !isString(val)) {
    return val;
  }

  const valLength = val.length;

  if (valLength > 8) {
    const prefix = val.slice(0, 3);
    const suffix = val.slice(valLength - 3, valLength);
    const encryption = '*'.repeat(valLength - 6);

    return `${prefix}${encryption}${suffix}`;
  }

  return new Array(valLength).fill('*').join('');
}

export const transportSecrets = (message: string, secrets: string[]): string => {
  const newSecrets = filter(secrets, secret => !isEmpty(secret));

  let msg = message;
  if (!isEmpty(secrets)) {
    each(newSecrets, (str) => {
      if (includes(msg, str)) {
        const re = new RegExp(str, 'g');
        msg = replace(msg, re, mark(str));
      }
    });
  }

  return msg;
}
