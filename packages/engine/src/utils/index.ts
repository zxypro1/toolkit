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

export function throw101Error(error: Error, prefix: string) {
  let jsonMsg;
  try {
    jsonMsg = JSON.parse(error.message);
  } catch (error) { }

  if (jsonMsg && jsonMsg.tips) {
    throw new Error(
      JSON.stringify({
        code: 101,
        message: jsonMsg.message,
        tips: jsonMsg.tips,
        prefix,
      }),
    );
  }
  throw new Error(
    JSON.stringify({
      code: 101,
      message: error.message,
      stack: error.stack,
      prefix
    }),
  );
}

export function throw100Error(message: string, tips?: string) {
  throw new Error(JSON.stringify({ code: 100, message, tips }));
}

export function throwError(message: string, tips?: string) {
  throw new Error(JSON.stringify({ message, tips }));
}