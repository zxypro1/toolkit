import path from 'path';
import fs from 'fs-extra';
import yaml from 'yaml';

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

export function getYamlContent(filePath: string) {
  // yaml 文件
  if (filePath.endsWith('yaml')) {
    if (fs.existsSync(filePath)) {
      return yaml.parse(fs.readFileSync(filePath, 'utf8'));
    }
    const ymlPath = filePath.replace('.yaml', '.yml');
    if (fs.existsSync(ymlPath)) {
      return yaml.parse(fs.readFileSync(ymlPath, 'utf8'));
    }
  }

  // yml 文件
  if (filePath.endsWith('yml')) {
    if (fs.existsSync(filePath)) {
      return yaml.parse(fs.readFileSync(filePath, 'utf8'));
    }
    const yamlPath = filePath.replace('.yml', '.yaml');
    if (fs.existsSync(yamlPath)) {
      return yaml.parse(fs.readFileSync(yamlPath, 'utf8'));
    }
  }
}
