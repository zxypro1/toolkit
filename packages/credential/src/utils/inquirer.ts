import { isCiCdEnvironment } from '@serverless-devs/utils';
import inquirer, { QuestionCollection } from 'inquirer';
import { DEFAULT_PROMPT_MESSAGE } from '../constant';
import Logger from '../logger';

export const prompt = async (options: QuestionCollection, errorMessage?: string) => {
  Logger.logger.debug(`is CiCd Env: ${isCiCdEnvironment()}`);
  if (isCiCdEnvironment()) {
    throw new Error(errorMessage || DEFAULT_PROMPT_MESSAGE);
  }
  return await inquirer.prompt(options) 
}