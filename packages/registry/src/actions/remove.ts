import { request } from "../util";
import logger from "../util/logger";
import { getPackageUrl } from "../request-url";

export default async (name: string, versionId: string) => {
  const uri = getPackageUrl(name, versionId);

  const { body, request_id } = await request.new_request_remove(uri);
  logger.debug(`Remove registry ${name}@${versionId} responseId: ${request_id}`);

  if (typeof body === 'string') {
    throw new Error(body);
  }
  return body;
};