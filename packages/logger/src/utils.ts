export const sliceEggLoggerFormatterTime = (value: string) => value.slice(0, -4);
import { each, filter, includes, isString, isEmpty, replace } from 'lodash';

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
};

class Transport {
  protected secrets: string[] = [];

  // 此处需要使用箭头函数，防止 this 指向变动

  setSecret = (secret: string[] = []) => {
    for (const s of secret) {
      if (!this.secrets.includes(s)) {
        this.secrets.push(s);
      }
    }
  };

  transportSecrets = (message: string) => {
    const secrets = this.secrets;

    const newSecrets = filter(secrets, secret => !isEmpty(secret));

    let msg = message;
    if (!isEmpty(secrets)) {
      each(newSecrets, str => {
        if (includes(msg, str)) {
          const re = new RegExp(str, 'g');
          msg = replace(msg, re, mark(str));
        }
      });
    }

    return msg;
  };
}

export const transport = new Transport();
