import flatted from 'flatted';
import { get, omit, set, map } from 'lodash';

export function getLogPath(filePath: string) {
  return `step_${filePath}.log`;
}

export function getProcessTime(time: number) {
  return (Math.round((Date.now() - time) / 10) * 10) / 1000;
}

export const stringify = (value: any) => {
  try {
    const data = { ...value }
    const steps = get(value, 'steps');
    if (steps) {
      set(data, 'steps', map(steps, (step: any) => omit(step, 'instance')));
    }
    const instance = get(data, 'instance');
    if (instance) {
      delete data.instance;
    }
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return flatted.stringify(value, null, 2);
  }
};