import { hasIn, transform, set } from "lodash";
import { prompt, getYamlContent, writeData } from "../utils";
import { CRYPTO_TRUE, CRYPTO_FALSE } from "../constant";

export default async (access?: string) => {
  const content = await getYamlContent();

  let alias = access;
  if (access) {
    if (!hasIn(content, access)) {
      throw new Error(`Not found alias name: ${access}`);
    }
  } else {
    const aliasNames = Object.keys(content);
    const { aliasName } = await prompt([
      {
        type: 'list',
        name: 'aliasName',
        message: 'You can choose an access to set as the default.\nPlease select an access:',
        choices: aliasNames.map((alias: string) => ({
          name: alias, value: alias
        })),
      },
    ]);
    alias = aliasName;
  };

  transform(content, (result: Record<string, Record<string, string>>, value, key) => {
    value.__default = CRYPTO_FALSE;
    set(result, key, value);
  })

  set(content, `${alias}.__default`, CRYPTO_TRUE);
  await writeData(content);
}