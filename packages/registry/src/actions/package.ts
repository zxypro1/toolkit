import zip from '@serverless-devs/zip';
import { getRootHome, registry } from '@serverless-devs/utils';
import fs from 'fs';
import { getYamlContentText, getContentText, request } from '../util';
import { PUBLISH_URL } from '../request-url';
import logger from '../util/logger';
import path from 'path';
import yaml from 'js-yaml';
import querystring from 'querystring';

interface IRequest {
  /**
   * 版本信息，如果指定了优先使用，如果不指定则优先使用publish参数中的version
   */
  package_version?: string;
  /**
   * Publish.yaml
   */
  publish: string;
  /**
   * 英文版 Publish.yaml
   */
  publish_en?: string;
  /**
   * readme
   */
  readme?: string;
  /**
   * 英文版 readme
   */
  readme_en?: string;
  /**
   * s.yaml
   */
  syaml?: string;
  /**
   * 英文版 s.yaml
   */
  syaml_en?: string;
  /**
   * 版本信息
   */
  version_body?: string;
  /**
   * 英文版版本信息
   */
  version_body_en?: string;
}

function checkEdition(str: string) {
  if (!str) {
    throw new Error('Need to publish YAML content');
  }
  const { Edition } = yaml.load(str) as Record<string, any>;
  if (Edition !== '3.0.0') {
    let message: string;
    if (!Edition || Edition === '2.0.0' || Edition === '1.0.0') {
      message = `Edition be 2.0.0 / 1.0.0 version, please use 's cli registry publish'`;
    } else {
      message = 'Edition must be 3.0.0 version.';
    }
    throw new Error(message);
  }
}

async function getUploadUrl(codeUri: string): Promise<string> {
  const publishYaml = getYamlContentText(path.join(codeUri, 'publish')) as string;
  checkEdition(publishYaml);
  const publishEnYaml = getYamlContentText(path.join(codeUri, 'publish_en'));
  const sYaml = getYamlContentText(path.join(codeUri, 'src', 's'));
  const sEnYaml = getYamlContentText(path.join(codeUri, 'src', 's_en'));
  const versionMd = getContentText(path.join(codeUri, 'version.md'));
  const versionEnMd = getContentText(path.join(codeUri, 'version_body_en.md'));
  const readme = getContentText(path.join(codeUri, 'readme.md'));
  const readmeEn = getContentText(path.join(codeUri, 'readme_en.md'));

  const requestBodyIRequest: IRequest = {
    publish: publishYaml,
    publish_en: publishEnYaml,
    version_body: versionMd,
    version_body_en: versionEnMd,
    syaml: sYaml,
    syaml_en: sEnYaml,
    readme_en: readmeEn,
    readme,
  };

  const { body, request_id } = await request.new_request_post(PUBLISH_URL, requestBodyIRequest);
  logger.debug(`Publish responseId: ${request_id}`);
  if (typeof body === 'string') {
    throw new Error(body);
  }
  logger.debug(`Publish res body: ${JSON.stringify(body)}`);
  return body.url;
}

export interface IList {
  category?: string;
  tag?: string;
  search?: string;
  page?: string;
}

export const list = async (options?: IList) => {
  const headers = registry.getSignHeaders();
  const qs = querystring.stringify((options || {}) as any);
  const uri = `${PUBLISH_URL}?${qs}`;

  const { body, request_id } = await request.new_request_get(uri, headers);
  logger.debug(`Get registry list responseId: ${request_id}`);

  if (typeof body === 'string') {
    throw new Error(body);
  }

  return body;
};

export const publish = async (codeUri: string) => {
  // 发布版本，获取上传文件地址
  const uploadUrl = await getUploadUrl(codeUri);
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
  await request.request_put(uploadUrl, zipResult.outputFile);

  // 删除压缩文件
  fs.unlinkSync(zipResult.outputFile);
};
