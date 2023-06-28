import { prompt, getYamlContent, validateInput, writeData } from '../utils';
import { hasIn, unset, set, trim } from 'lodash';
import decryptCredential from './decrypt';
import { IResult } from './set/type';

export interface IRenameOptions {
  source?: string;
  target?: string;
}

export default async (options?: IRenameOptions): Promise<IResult> => {
  const { source, target } = options || {};
  const content = await getYamlContent();

  let sourceName = source as string;
  if (!source) {
    const aliasNames = Object.keys(content);

    const { aliasName } = await prompt([
      {
        type: 'list',
        name: 'aliasName',
        message: 'Please select need rename alias name:',
        choices: aliasNames.map((alias: string) => ({
          name: alias,
          value: alias,
        })),
      },
    ]);
    sourceName = aliasName;
  } else if (!hasIn(content, source)) {
    throw new Error(`Not found source alias name: ${source}`);
  }

  let targetName = target as string;
  if (!target) {
    const { aliasName } = await prompt([
      {
        type: 'input',
        name: 'aliasName',
        message: 'Please select need rename alias name:',
        validate: validateInput,
      },
    ]);
    targetName = trim(aliasName);
  }

  set(content, targetName, content[sourceName]);
  unset(content, sourceName);

  await writeData(content);

  return {
    access: targetName,
    credential: decryptCredential(content[targetName]),
  };
};
