import fs from 'fs';
import https from 'https';
import http from 'http';
import querystring from 'querystring';
import { registry } from '@serverless-devs/utils';


export const new_request_get = async (
  url: string,
  headers?: Record<string, string>,
): Promise<{ request_id: string; body: any }> => {
  const uri = new URL(url);
  const pkg = url.toLowerCase().startsWith('https:') ? https : http;
  return new Promise((resolve) => {
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
  const headers = registry.getSignHeaders();

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
  const headers = registry.getSignHeaders();

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

