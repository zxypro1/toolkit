import { prompt, getYamlContent, writeData } from "../utils";
import { hasIn, unset } from "lodash";

export default async (access?: string) => {
  const content = await getYamlContent();

  if (access) {
    if (!hasIn(content, access)) {
      console.error(`Not found alias name: ${access}`);
      return;
    }
    unset(content, access);
  } else {
    const aliasNames = Object.keys(content);
    
    const { aliasName } = await prompt([
      {
        type: 'list',
        name: 'aliasName',
        message: 'Please select need remove alias:',
        choices: aliasNames.map((alias: string) => ({
          name: alias, value: alias
        })),
      },
    ]);
    unset(content, aliasName);
  }

  await writeData(content);
}