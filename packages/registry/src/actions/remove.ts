import { request } from '../util';
import logger from '../util/logger';
import { getPackageUrl } from '../request-url';
import chalk from 'chalk';

export default async (name: string, versionId: string) => {
  const uri = getPackageUrl(name, versionId);

  const { body, request_id } = await request.new_request_remove(uri);
  logger.debug(`Remove registry ${name}@${versionId} responseId: ${request_id}`);

  if (typeof body === 'string') {
    throw new Error(body);
  }

  logger.write(chalk.green(`Delete package ${name}@${versionId} success.`));
  return body;
};
