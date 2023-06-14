import { hasIn, transform, set } from "lodash";
import { prompt, getYamlContent, writeData } from "../utils";
import { CRYPTO_TRUE, CRYPTO_FALSE } from "../constant";

export default async (access?: string) => {
  const content = await getYamlContent();

  let alias = access;
  if (access) {
    if (!hasIn(content, access)) {
      console.error(`Not found alias name: ${access}`);
      return;
    }
  } else {
    const aliasNames = Object.keys(content);
    console.log('You can choose an access to set as the default.');
    const { aliasName } = await prompt([
      {
        type: 'list',
        name: 'aliasName',
        message: 'Please select an access:',
        choices: aliasNames.map((alias: string) => ({
          name: alias, value: alias
        })),
      },
    ]);
    alias = aliasName;
  };

  transform(content, (result: Record<string, Record<string, string>>, value, key) => {
    if (value.__default === CRYPTO_TRUE) {
      value.__default = CRYPTO_FALSE;
    }
    set(result, key, value);
  })

  set(content, `${alias}.__default`, CRYPTO_TRUE);
  await writeData(content);
}