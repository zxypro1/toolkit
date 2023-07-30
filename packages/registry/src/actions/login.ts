import random from 'random-string';
// @ts-ignore
import opn from 'opn';
import { writeFile, sleep, request } from '../util';
import logger from '../util/logger';
import { GITHUB_LOGIN_URL, REGISTRY_INFORMATION_GITHUB, RESET_URL } from '../request-url';

/**
 * 请求接口登陆
 */
export async function generateToken() {
  const tempToken = random({ length: 20 });
  const loginUrl = `${GITHUB_LOGIN_URL}?token=${tempToken}`;

  // 输出提醒
  logger.warn(
    'Serverless registry no longer provides independent registration function, but will uniformly adopt GitHub authorized login scheme.',
  );
  logger.info('The system will attempt to automatically open the browser for authorization......');
  logger.info(
    'If the browser is not opened automatically, please try to open the following URL manually for authorization.',
  );
  logger.info(loginUrl);

  try {
    opn(loginUrl);
  } catch (_e) {}

  for (let i = 0; i < 100; i++) {
    await sleep(2000);
    const result = await request.new_request_get(
      `${REGISTRY_INFORMATION_GITHUB}?token=${tempToken}`,
    );
    const { body, request_id } = result || ({} as any);
    logger.debug(`ResponseId: ${request_id}`);
    if (typeof body === 'string') {
      throw new Error(body);
    }
    if (body.safety_code) {
      writeFile(body.safety_code);
      logger.log(`Hi ${body.name}, Welcome to Serverless Devs Registry.`);
      return;
    }
  }
  logger.error(
    'Login failed. Please log in to GitHub account on the pop-up page and authorize it, or try again later.',
  );
}

/**
 * 刷新 token
 * @param token 旧的 token
 */
export async function resetToken() {
  try {
    const { body, request_id } = await request.new_request_post(RESET_URL);
    logger.debug(`ResponseId: ${request_id}`);

    if (typeof body === 'string') {
      throw new Error(body);
    }

    writeFile(body.safety_code);
  } catch (_ex) {
    throw new Error('Network exception. Please try again later');
  }

  logger.log('Serverless Registry login token reset succeeded.');
}

/**
 * 登陆
 * @param token 指定 token
 */
export default async function login(token?: string) {
  if (token) {
    writeFile(token);
    logger.log('Welcome to Serverless Devs Registry.');
    return;
  }

  await generateToken();
}
