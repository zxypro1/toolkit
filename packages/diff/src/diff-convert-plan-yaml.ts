import { diff } from 'just-diff';
import { get, isEmpty, set, isPlainObject, cloneDeep, find } from 'lodash';
import { red, yellow, green, bold } from 'chalk';
import { IOpts } from './types';

function toString(value: any): string {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (value === '') {
    return "''";
  }
  return value;
}

class Diff {
  private diffResult!: any[];
  private newObject!: any;

  diff = (oldObject: any, newObject: any, opts?: IOpts) => {
    this.newObject = newObject;
    const diffResult = diff(oldObject, newObject);
    if (isEmpty(diffResult) && !opts?.complete) {
      return {
        diffResult,
        show: '',
      };
    }

    this.diffResult = cloneDeep(diffResult).map(item => ({
      ...item,
      pathString: item.path.join('.'),
    }));
    const result = cloneDeep(oldObject);
    const deep = opts?.deep || 0;
    const len = opts?.len || 4;

    const strings = Array.isArray(result)
      ? this.arrayToString('', result, deep, len)
      : this.objectToString('', result, deep, len);

    return {
      diffResult,
      show: strings.join('\n'),
    };
  }

  private objectToString = (preKey: string, obj: any, deep: number, len: number): string[] =>  {
    const strings: string[] = [];
    const space = new Array(deep * len).join(' ');

    for (const [key, value] of Object.entries(obj)) {
      const k = preKey ? `${preKey}.${key}` : key;

      const change = find(this.diffResult, item => item.pathString === k);
      if (change) {
        const { pathString, op } = change;
        if (op === 'add') {
          const setValue = toString(value);
          const message = green(`${space}${bold('+')} ${key}: ${setValue}`);
          strings.push(message);
        } else if (op === 'remove') {
          const setValue = toString(value);
          const message = red(`${space}${bold('-')} ${key}: ${setValue}`);
          strings.push(message);
        } else {
          const newValue = get(this.newObject, pathString);
          const setNewValue = toString(newValue);
          const setOldValue = toString(value);
          const message = yellow(`${space}${bold('~')} ${key}: ${setOldValue} => ${setNewValue}`);
          strings.push(message);
        }
        continue;
      }

      if (Array.isArray(value)) {
        strings.push(`${space}${key}: `);
        strings.push(...this.arrayToString(k, value, deep + 1, len));
      } else if (isPlainObject(value)) {
        strings.push(`${space}${key}: `);
        strings.push(...this.objectToString(k, value, deep + 1, len));
      } else {
        strings.push(`${space}${key}: ${value}`);
      }
    }

    return strings;
  }

  private arrayToString = (preKey: string, array: any[], deep: number, len: number): string[] => {
    const strings: string[] = [];
    const space = new Array(deep * len).join(' ');
    const arrayLength = array.length;

    for (let index = 0; index < arrayLength; index++) {
      const value = array[index];

      const k = preKey ? `${preKey}.${index}`: String(index);

      const change = find(this.diffResult, item => item.pathString === k);
      if (change) {
        const { pathString, op } = change;
        if (op === 'add') {
          const setValue = toString(value);
          const message = green(`${space}${bold('+')} - ${setValue}`);
          strings.push(message);
        } else if (op === 'remove') {
          const setValue = toString(value);
          const message = red(`${space}${bold('-')} - ${setValue}`);
          strings.push(message);
        } else {
          const newValue = get(this.newObject, pathString);
          const setNewValue = toString(newValue);
          const setOldValue = toString(value);
          const message = yellow(`${space}${bold('~')} - ${setOldValue} => ${setNewValue}`);
          strings.push(message);
        }
        continue;
      }

      if (Array.isArray(value)) {
        strings.push(`${space}- `);
        strings.push(...this.arrayToString(k, value, deep + 1, len));
      } else if (isPlainObject(value)) {
        strings.push(`${space}- `);
        strings.push(...this.objectToString(k, value, deep + 1, len));
      } else {
        strings.push(`${space}- ${value}`);
      }
    }

    return strings;
  }
}

export default new Diff().diff;
