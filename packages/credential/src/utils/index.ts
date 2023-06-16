import path from 'path';
import fs from 'fs-extra';
import { isEmpty, trim } from 'lodash';
import yaml from 'js-yaml';
import { getRootHome } from '@serverless-devs/utils';
import { DEFAULT_NAME } from '../constant';
import Logger from '../logger';

export { default as Alibaba, IAliCredential } from './alibaba';
export { prompt } from './inquirer';

export const validateInput = (input: string) => isEmpty(trim(input)) ? 'Cannot be empty' : true 

/**
 * 获取 yaml 文件路径
 */
export function getYamlPath(): string {
  const fileYamlPath = path.join(getRootHome(), 'access.yaml');
  if (fs.existsSync(fileYamlPath)) {
    return fileYamlPath;
  }

  const fileYmlPath = path.join(getRootHome(), 'access.yml');
  if (fs.existsSync(fileYmlPath)) {
    return fileYmlPath;
  }

  return fileYamlPath;
}

/**
 * 获取密钥文件的内容
 * @returns 
 */
export function getYamlContent(): Record<string, Record<string, string>> {
  const fileYamlPath = getYamlPath();

  if (fs.existsSync(fileYamlPath)) {
    const content = fs.readFileSync(fileYamlPath, 'utf8');
    return yaml.load(content) as Record<string, Record<string, string>>;
  }

  return {};
}

/**
 * 获取设置密钥默认名称
 * @returns 
 */
export async function getAliasDefault() {
  const content = getYamlContent();
  if (isEmpty(content)) {
    return DEFAULT_NAME;
  }

  const keys = Object.keys(content).filter((item) => item.startsWith(DEFAULT_NAME))
  if (keys.length === 0) {
    return DEFAULT_NAME;
  }

  let max = 0;

  keys.forEach((item) => {
    const [, end] = item.split('-');
    const e = parseInt(end);
    if (!isNaN(e) && e > max) {
      max = e;
    }
  });

  return `${DEFAULT_NAME}-${max + 1}`;
}

export async function writeData(content: Record<string, Record<string, string>>) {
  try {
    fs.ensureDirSync(getRootHome());
    fs.writeFileSync(getYamlPath(), yaml.dump(content));
  } catch (ex: any) {
    Logger.logger.debug(`write data error: ${ex.message}`);
    throw new Error('Configuration failed');
  }
}
