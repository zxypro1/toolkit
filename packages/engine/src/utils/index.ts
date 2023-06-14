import flatted from 'flatted';
import { get, omit } from 'lodash';

export function getLogPath(filePath: string) {
  return `step_${filePath}.log`;
}

export function getProcessTime(time: number) {
  return (Math.round((Date.now() - time) / 10) * 10) / 1000;
}

export const stringify = (value: any) => {
  try {
    const removeKey = 'logConfig.customLogger';
    const customLogger = get(value, removeKey);
    return customLogger ? JSON.stringify(omit(value, [removeKey])) : JSON.stringify(value, null, 2);
  } catch (error) {
    return flatted.stringify(value);
  }
};
