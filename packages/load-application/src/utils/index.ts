import { endsWith, keys, replace } from 'lodash';
import { RANDOM_PATTERN, REGISTRY } from '../constant';
import Credential from '@serverless-devs/credential';

export { default as getInputs } from './get-inputs';

export const tryfun = async (fn: Function, ...args: any[]) => {
  try {
    return await fn(...args);
  } catch (ex) {}
};

export const getUrlWithLatest = (name: string) => `${REGISTRY.V3}/packages/${name}/release/latest`;
export const getUrlWithVersion = (name: string, versionId: string) => `${REGISTRY.V3}/packages/${name}/release/tags/${versionId}`;

export const randomId = () => Math.random().toString(36).substring(2, 6);

export const getAllCredential = async ({ logger }: any) => {
  const c = new Credential({ logger });
  return keys(c.getAll());
};

export const getDefaultValue = (value: any) => {
  if (typeof value !== 'string') return;
  return endsWith(value, RANDOM_PATTERN) ? replace(value, RANDOM_PATTERN, randomId()) : value;
};
