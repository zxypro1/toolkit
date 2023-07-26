import { diff } from 'just-diff';
import { get, isEmpty, set, isPlainObject, cloneDeep } from 'lodash';
import { red, yellow, green } from 'chalk';
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

function arrayToString(array: any[], deep: number, len: number): string[] {
  const pre = new Array(deep * len).join(' ');
  const strings: string[] = [];

  for (const value of array) {
    if (Array.isArray(value)) {
      strings.push(`${pre}- `);
      strings.push(...arrayToString(value, deep + 1, len));
    } else if (isPlainObject(value)) {
      strings.push(`${pre}- `);
      strings.push(...objectToString(value, deep + 1, len));
    } else {
      // 每项值因为已经处理成了颜色
      // 所以一定值是 string / array / object, 否则不符合预期跳出
      if (!value) {
        continue;
      }
      strings.push(`${pre}- ${value}`);
    }
  }

  return strings;
}

function objectToString(obj: any, deep: number, len: number): string[] {
  const strings: string[] = [];
  const pre = new Array(deep * len).join(' ');
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      strings.push(`${pre}${key}: `);
      strings.push(...arrayToString(value, deep + 1, len));
    } else if (isPlainObject(value)) {
      strings.push(`${pre}${key}: `);
      strings.push(...objectToString(value, deep + 1, len));
    } else {
      strings.push(`${pre}${key}: ${value}`);
    }
  }
  return strings;
}

export default function (
  oldObject: Record<string, any>,
  newObject: Record<string, any>,
  opts?: IOpts,
): { diffResult: any[]; show: string } {
  const diffResult = diff(oldObject, newObject);

  if (isEmpty(diffResult) && !opts?.complete) {
    return {
      diffResult,
      show: '',
    };
  }

  const result = opts?.complete ? cloneDeep(oldObject) : {};
  for (const { op, path, value } of diffResult) {
    const pathString = path.join('.');
    if (op === 'add') {
      const setValue = toString(value);
      set(result, pathString, green(setValue));
    } else if (op === 'remove') {
      const oldValue = get(oldObject, pathString);
      const setValue = toString(oldValue);
      set(result, pathString, red(setValue));
    } else {
      const oldValue = get(oldObject, pathString);
      const setOldValue = toString(oldValue);
      const setNewValue = toString(value);
      set(result, pathString, yellow(`${setOldValue} => ${setNewValue}`));
    }
  }

  const deep = opts?.deep || 0;
  const len = opts?.len || 4;
  const strings = Array.isArray(result)
    ? arrayToString(result, deep, len)
    : objectToString(result, deep, len);

  return {
    diffResult,
    show: strings.join('\n'),
  };
}
