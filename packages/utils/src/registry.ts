import fs from 'fs';
import getRootHome from './get-root-home';
import path from 'path';
import random from 'random-string';
import crypto from 'crypto';

const md5 = require('md5');

const sha256 = (safety_code: string, nonce: string, timestamp: string) => {
  const message = `${safety_code}${nonce}${timestamp}`;
  const sha = crypto.createHash('sha256');
  sha.update(message);
  return sha.digest('hex');
};

class Registry {
  getPlatformPath = () => {
    const rootHome = getRootHome();
    fs.mkdirSync(rootHome, { recursive: true });

    return path.join(rootHome, 'serverless-devs-platform-V3.dat');
  };

  getToken = (): string => {
    if (process.env.serverless_devs_registry_token) {
      return process.env.serverless_devs_registry_token;
    }

    const platformPath = this.getPlatformPath();
    if (!fs.existsSync(platformPath)) {
      throw new Error('Please perform serverless registry through [s registry login]');
    }

    return fs.readFileSync(platformPath, 'utf-8');
  };

  getSignHeaders = ({ ignoreError }: { ignoreError?: boolean } = {}): Record<string, string> => {
    let safety_code: string;
    try {
      safety_code = this.getToken();
    } catch (error) {
      if (ignoreError) return {};
      throw error;
    }
    if (!safety_code) {
      return {};
    }
    const token = md5(safety_code);
    const timestamp = `${parseInt(`${new Date().getTime() / 1000}`, 10)}`;
    const nonce = random({ length: 15 });
    const sign_code = sha256(safety_code, nonce, timestamp);

    return {
      sign_code,
      nonce,
      timestamp,
      token,
    };

  };
}

export default new Registry();
