import fs from 'fs';
import https from 'https';
import http from 'http';
import querystring from 'querystring';
import { getRootHome, getYamlPath } from '@serverless-devs/utils';
import path from 'path';

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

export const getPlatformPath = () => {
  const rootHome = getRootHome();
  fs.mkdirSync(rootHome, { recursive: true });

  return path.join(rootHome, 'serverless-devs-platform.dat');
};

export function writeFile(token: string) {
  const platformPath = getPlatformPath();

  const fd = fs.openSync(platformPath, 'w+');
  fs.writeSync(fd, token);
  fs.closeSync(fd);
}

export const sleep = async (timer: number) =>
  await new Promise((resolve) => setTimeout(resolve, timer));

export const request_get = async (url: string): Promise<{ ResponseId: string; Response: any }> => {
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;
  return new Promise((resolve) => {
    const res: any = [];
    pkg.get(uri.href, (response) => {
      response.on('data', (chunk: any) => {
        res.push(chunk);
      });
      response.on('end', () => {
        const r = JSON.parse(Buffer.concat(res).toString());
        resolve(r);
      });
    });
  });
};

export const request_post = async (url: string, body: Record<string, any>): Promise<{ ResponseId: string; Response: any }> => {
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;

  const contents = querystring.stringify(body);
  const options = {
    hostname: uri.hostname,
    path: uri.pathname,
    method: 'POST',
    headers: {
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
        const r = JSON.parse(Buffer.concat(res).toString());
        resolve(r);
      });
    });
    request.write(contents);
    request.end();
  });
};

export const request_put = async (url: string, filePath: string): Promise<{ ResponseId: string; Response: any }> => {
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;

  const options = {
    hostname: uri.hostname,
    path: uri.pathname,
    method: 'PUT',
  };
  const contents = fs.readFileSync(filePath);

  return new Promise((resolve) => {
    const res: any = [];
    const request = pkg.request(options, (response) => {
      response.on('data', (chunk: any) => {
        res.push(chunk);
      });
      response.on('end', () => {
        const r = JSON.parse(Buffer.concat(res).toString());
        resolve(r);
      });
    });
    request.write(contents);
    request.end();
  });
};
