import fs from 'fs';
import https from 'https';
import http from 'http';
import querystring from 'querystring';
import { getRootHome } from '@serverless-devs/utils';
import path from 'path';

export const getPlatformPath = () => {
  const rootHome = getRootHome();
  fs.mkdirSync(rootHome, { recursive: true });

  return path.join(rootHome, 'serverless-devs-platform.dat');
}

export function writeFile(token: string) {
  const platformPath = getPlatformPath();

  const fd = fs.openSync(platformPath, 'w+');
  fs.writeSync(fd, token);
  fs.closeSync(fd);
}

export const sleep = async (timer: number) => await new Promise((resolve) => setTimeout(resolve, timer))

export const request_get = async (url: string) => {
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;
  return new Promise((resolve) => {
    const res: any = [];
    pkg.get(uri.href, response => {
      response.on('data', (chunk: any) => {
        res.push(chunk);
      });
      response.on('end', () => {
        const r = JSON.parse(Buffer.concat(res).toString());
        resolve(r);
      })
    });
  });
}

export const request_post = async (url: string, body: Record<string, any>): Promise<any> => {
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;

  const contents = querystring.stringify(body);
  const options = {
    hostname: uri.hostname,
    path: uri.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  }

  return new Promise((resolve) => {
    const res: any = [];
    const request = pkg.request(options, response => {
      response.on('data', (chunk: any) => {
        res.push(chunk);
      });
      response.on('end', () => {
        const r = JSON.parse(Buffer.concat(res).toString());
        resolve(r);
      })
    });
    request.write(contents);
    request.end();
  });
}
