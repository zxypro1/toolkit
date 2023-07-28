import logger from '../logger';
import { new_request_get, getSignHeaders, new_request_remove } from '../utils';
import { getDetailUrl, CENTER_PUBLISH_URL, getRemoveUrl } from './constants';

export { default as login, generateToken, resetToken } from './login';
export { getToken } from '../utils';
export { default as publish } from './publish';

export interface IList {
  category?: string;
  tag?: string;
  search?: string;
  page?: string;
}

export const list = async (options?: IList) => {
  const { category, tag, search, page } = options || {};
  const headers = getSignHeaders();
  let uri = CENTER_PUBLISH_URL;
  if (category) {
    uri += `?category=${category}`;
  }
  if (tag) {
    uri += `&tag=${tag}`;
  }
  if (search) {
    uri += `&search=${search}`;
  }
  if (page) {
    uri += `&page=${page}`;
  }

  const { body, request_id } = await new_request_get(uri, headers);
  logger.debug(`Get registry list responseId: ${request_id}`);

  if (typeof body === 'string') {
    throw new Error(body);
  }

  return body;
};

export const detail = async (name: string, page?: string) => {
  let uri = getDetailUrl(name);
  if (page) {
    uri += `?page=${page}`;
  }

  const headers = getSignHeaders();
  const { body, request_id } = await new_request_get(uri, headers);
  logger.debug(`Get registry ${name} detail responseId: ${request_id}`);
  return body;
};

export const remove = async (name: string, versionId: string) => {
  const uri = getRemoveUrl(name, versionId);

  const { body, request_id } = await new_request_remove(uri);
  logger.debug(`Remove registry ${name}@${versionId} responseId: ${request_id}`);

  if (typeof body === 'string') {
    throw new Error(body);
  }
};
