
import zip from '@serverless-devs/zip';
import { getRootHome } from '@serverless-devs/utils';
import fs from 'fs';
import { getYamlContentText, getContentText, request_post, request_put } from '../utils';
import { PUBLISH_URL } from './constants';
import logger from '../logger';
import path from 'path';

async function publish(token: string): Promise<string> {
  const publishYaml = getYamlContentText('./publish');
  const sYaml = getYamlContentText('./src/s');
  const versionMd = getContentText('./version.md');
  const readme = getContentText('./readme.md');

  const { Response, ResponseId } = await request_post(PUBLISH_URL, {
    safety_code: token,
    publish: publishYaml,
    version_body: versionMd,
    syaml: sYaml,
    readme,
  });
  logger.debug(`ResponseId: ${ResponseId}`);
  if (Response?.Error) {
    throw new Error(`${Response.Error}: ${Response.Message}`);
  }
  return Response.url;
}

export default async (token: string, codeUri: string) => {
  // 发布版本，获取上传文件地址
  const uploadUrl = await publish(token);
  logger.debug(`Publish upload url: ${uploadUrl}`);

  // 压缩文件
  const zipResult = await zip({
    codeUri,
    outputFilePath: path.join(getRootHome(), 'cache', 'registry', 'publish'),
  });
  logger.debug(`Zip file size: ${zipResult.compressedSize}`);
  logger.debug(`Zip file count: ${zipResult.count}`);
  logger.debug(`Zip file outputFile: ${zipResult.outputFile}`);

  // 上传压缩文件
  const result = await request_put(uploadUrl, zipResult.outputFile);
  console.log(result);

  // 删除压缩文件
  fs.unlinkSync(zipResult.outputFile);
}
