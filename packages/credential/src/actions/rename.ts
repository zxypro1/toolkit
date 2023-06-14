import { prompt, getYamlContent, validateInput, writeData } from "../utils";
import { hasIn, unset, set, trim } from "lodash";

export interface IRenameOptions {
  source?: string;
  target?: string;
}

export default async ({ source, target }: IRenameOptions) => {
  const content = await getYamlContent();

  let sourceName = source as string;
  if (source) {
    if (!hasIn(content, source)) {
      console.error(`Not found source alias name: ${source}`);
      return;
    }
  } else {
    const aliasNames = Object.keys(content);
    
    const { aliasName } = await prompt([
      {
        type: 'list',
        name: 'aliasName',
        message: 'Please select need rename alias name:',
        choices: aliasNames.map((alias: string) => ({
          name: alias, value: alias
        })),
      },
    ]);
    sourceName = aliasName;
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
}
