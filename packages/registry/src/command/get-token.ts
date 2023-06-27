import { getPlatformPath } from '../utils';
import fs from 'fs';

export default (): string => {
  if (process.env.serverless_devs_registry_token) {
    return process.env.serverless_devs_registry_token;
  }

  const platformPath = getPlatformPath();
  if (!fs.existsSync(platformPath)) {
    throw new Error('Please perform serverless registry through [s cli registry login]');
  }

  return fs.readFileSync(platformPath, 'utf-8');
}
