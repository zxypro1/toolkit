import path from 'path';
import fs from 'fs-extra';

export { default as getInputs } from './get-inputs';

export const tryfun = async (fn: Function, ...args: any[]) => {
  try {
    return await fn(...args);
  } catch (ex) {}
};

export const getYamlPath = (filePath: string, filename: string) => {
  const yamlPath = path.join(filePath, `${filename}.yaml`);
  if (fs.existsSync(yamlPath)) return yamlPath;
  const ymlPath = path.join(filePath, `${filename}.yml`);
  if (fs.existsSync(ymlPath)) return ymlPath;
};
