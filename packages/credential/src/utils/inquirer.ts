import { isCiCdEnvironment } from '@serverless-devs/utils';
import inquirer, { QuestionCollection } from 'inquirer';

const DEFAULT_PROMPT_MESSAGE = 'Interaction in cicd environment, throwing exception';

export const prompt = async (options: QuestionCollection, errorMessage?: string) => {
  if (isCiCdEnvironment()) {
    throw new Error(errorMessage || DEFAULT_PROMPT_MESSAGE);
  }
  return await inquirer.prompt(options) 
}