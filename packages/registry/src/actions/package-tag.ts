import logger from '../util/logger';
import { registry } from '@serverless-devs/utils';
import { getDetailUrl, getPackageUrl, getDetailLatestUrl } from '../request-url';
import { request } from '../util';

export const detail = async (name: string, page?: string) => {
  let uri = getDetailUrl(name);
  if (page) {
    uri += `?page=${page}`;
  }

  const headers = registry.getSignHeaders();
  const { body, request_id } = await request.new_request_get(uri, headers);
  logger.debug(`Get registry ${name} detail responseId: ${request_id}`);
  if (typeof body === 'string') {
    throw new Error(body);
  }
  return body;
};

export const packageDetail = async (name: string, versionId?: string) => {
  let uri: string;
  if (versionId) {
    uri = getPackageUrl(name, versionId);
  } else {
    uri = getDetailLatestUrl(name);
  }
  const headers = registry.getSignHeaders();
  const { body, request_id } = await request.new_request_get(uri, headers);
  logger.debug(`Get registry ${name} detail responseId: ${request_id}`);
  return body;
};
