import fs from 'fs';
import https from 'https';
import http from 'http';
import querystring from 'querystring';
import { getRootHome, getYamlPath } from '@serverless-devs/utils';
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

/**
 * 获取 yaml 的内容
 * @param filePath 文件路径（不需要后缀）
 * @returns
 */
export const getYamlContentText = (filePath: string): string | undefined => {
  const fileUri = getYamlPath(filePath);
  if (fileUri) {
    return fs.readFileSync(fileUri, 'utf-8');
  }
  return undefined;
};

/**
 * 获取 md 文件内容
 * @param filePath 文件路径（需要后缀）
 * @returns
 */
export const getContentText = (fileUri: string): string | undefined => {
  if (fs.existsSync(fileUri)) {
    return fs.readFileSync(fileUri, 'utf-8');
  }
};

/**
 * 获取 token
 * @returns
 */
export const getToken = (): string => {
  if (process.env.serverless_devs_registry_token) {
    return process.env.serverless_devs_registry_token;
  }

  const platformPath = getPlatformPath();
  if (!fs.existsSync(platformPath)) {
    throw new Error('Please perform serverless registry through [s cli registry login]');
  }

  return fs.readFileSync(platformPath, 'utf-8');
};

export const getPlatformPath = () => {
  const rootHome = getRootHome();
  fs.mkdirSync(rootHome, { recursive: true });

  return path.join(rootHome, 'serverless-devs-platform-V3.dat');
};

export function writeFile(token: string) {
  const platformPath = getPlatformPath();

  const fd = fs.openSync(platformPath, 'w+');
  fs.writeSync(fd, token);
  fs.closeSync(fd);
}

export const sleep = async (timer: number) =>
  await new Promise((resolve) => setTimeout(resolve, timer));

export const getSignHeaders = (): Record<string, string> => {
  const safety_code = getToken();
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

export const new_request_get = async (
  url: string,
  headers?: Record<string, string>,
): Promise<{ request_id: string; body: any }> => {
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;
  return new Promise((resolve, reject) => {
    const res: any = [];
    pkg.get(
      uri.href,
      {
        headers,
      },
      (response) => {
        response.on('data', (chunk: any) => {
          res.push(chunk);
        });
        response.on('end', () => {
          const r = JSON.parse(Buffer.concat(res).toString());
          resolve(r);
        });
      },
    );
  });
};

export const new_request_post = async (
  url: string,
  body?: Record<string, any>,
): Promise<{ request_id: string; body: any }> => {
  const headers = getSignHeaders();

  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;

  const options = {
    hostname: uri.hostname,
    path: uri.pathname,
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  return new Promise((resolve) => {
    const res: any = [];
    const request = pkg.request(options, (response) => {
      response.on('data', (chunk: any) => {
        res.push(chunk);
      });
      response.on('end', () => {
        const result = Buffer.concat(res).toString();
        resolve(JSON.parse(result));
      });
    });
    if (body) {
      const contents = querystring.stringify(body);
      request.write(contents);
    }
    request.end();
  });
};

export const new_request_remove = async (
  url: string,
): Promise<{ request_id: string; body: any }> => {
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;
  const headers = getSignHeaders();

  const options = {
    hostname: uri.hostname,
    path: uri.pathname,
    method: 'DELETE',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  return new Promise((resolve) => {
    const res: any = [];
    const request = pkg.request(options, (response) => {
      response.on('data', (chunk: any) => {
        res.push(chunk);
      });
      response.on('end', () => {
        const result = Buffer.concat(res).toString();
        resolve(JSON.parse(result));
      });
    });
    request.end();
  });
};

export const request_put = async (url: string, filePath: string): Promise<any> => {
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;

  const options = {
    method: 'PUT',
  };
  const contents = fs.readFileSync(filePath);

  return new Promise((resolve) => {
    const res: any = [];
    const request = pkg.request(uri, options, (response) => {
      response.on('data', (chunk: any) => {
        res.push(chunk);
      });
      response.on('end', () => {
        resolve(Buffer.concat(res).toString());
      });
    });
    request.write(contents);
    request.end();
  });
};
