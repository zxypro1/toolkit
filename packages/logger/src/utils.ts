import chalk from 'chalk';
import { get, each, filter, includes, isEmpty, isString, replace } from 'lodash';
import { IMeta } from './type';

const durationRegexp = /([0-9]+ms)/g;
const categoryRegexp = /(\[[\w\-_.:]+\])/g;
const httpMethodRegexp = /(GET|POST|PUT|PATH|HEAD|DELETE) /g;

export const mark = (val: string) => {
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

export const formatter = (meta?: IMeta) => {
  const secrets = get(meta, 'secrets', []);
  const newSecrets = filter(secrets, secret => !isEmpty(secret));


  let msg = get(meta, 'message', '');
  if (!isEmpty(secrets)) {
    each(newSecrets, (str) => {
      if (includes(msg, str)) {
        const re = new RegExp(str, 'g');
        msg = replace(msg, re, mark(str));
      }
    });
  }
    
  const level = get(meta, 'level');
  if (level === 'ERROR') {
    return chalk.red(msg);
  } else if (level === 'WARN') {
    return chalk.yellow(msg);
  }

  msg = replace(msg, durationRegexp, chalk.green('$1'));
  msg = replace(msg, categoryRegexp, chalk.blue('$1'));
  msg = replace(msg, httpMethodRegexp, chalk.cyan('$1 '));

  // console.log('formatter msg: ', msg);
  return msg;
};