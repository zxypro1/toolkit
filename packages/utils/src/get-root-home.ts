import os from 'os';
import path from 'path';
import fs from 'fs';
import getCurrentEnvironment from './get-current-environment';
import { Environment } from './constants';

const USER_HOME = process.env.serverless_devs_config_home || os.homedir();

const formatWorkspacePath = (val: string) => val.replace(/~/, USER_HOME);

export default function getRootHome() {
  const homedir = path.join(USER_HOME, '.s');
  const sJsonPath = path.join(homedir, 'config', 's.json');
  if (fs.existsSync(sJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(sJsonPath, { encoding: 'utf8' }));
      return data.workspace ? formatWorkspacePath(data.workspace) : homedir;
    } catch (ex) {

    }
  }
  
  const env = getCurrentEnvironment();
  if (env === Environment.Yunxiao) {
    return path.join(USER_HOME, '.cache', '.s')
  };

  return homedir;
}
