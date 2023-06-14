import { PROVIDER_LIST, PROVIDER_CREDENTIAL_KEYS, PROVIDER, PROVIDER_DOCS } from '../../constant';
import { get, set, merge, hasIn, isNil, trim, transform } from 'lodash';
import { prompt, getAliasDefault, getYamlContent, validateInput } from '../../utils';

async function addCustom(info: Record<string, string>) {
  const { type } = await prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Please select a type:',
      choices: [
        { name: 'Add key-value pairs', value: 'add' },
        { name: 'End of adding key-value pairs', value: 'over' },
      ],
    },
  ]);

  if (type === 'add') {
    const { key, value } = await prompt([
      {
        type: 'input',
        message: 'Please enter key: ',
        name: 'key',
        validate: validateInput,
      },
      {
        type: 'input',
        message: 'Please enter value: ',
        name: 'value',
        validate: validateInput,
      },
    ]);

    set(info, trim(key), trim(value))
    await addCustom(info);
  }
}

/**
 * 密钥设置处理
 * @returns 
 */
export async function inputCredentials (): Promise<Record<string, string>> {
  const { provider } = await prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Please select a provider:',
      choices: PROVIDER_LIST,
    }
  ]);

  const docs = get(PROVIDER_DOCS, provider);
  if (docs) {
    console.log(`🧭 Refer to the document for ${provider} key: ${docs}`);
  }

  const credentials = { __provider: provider };
  if (provider === PROVIDER['custom']) {
    await addCustom(credentials as Record<string, string>);
  } else {
    const promptKeys = get(PROVIDER_CREDENTIAL_KEYS, provider, []);
    const promptList = promptKeys.map((key: string) => ({
      type: 'input',
      message: `${key}: `,
      name: key,
      validate: validateInput,
    }));
    const result = await prompt(promptList);
    const trimResult = transform(result, (result: Record<string, string>, value: string, key: string) => {
      result[key] = trim(value)
    })
    merge(credentials, trimResult);
  }

  return credentials;
}

/**
 * 获取别名
 * @returns 
 */
export async function getAlias(options: { access?: string; force?: boolean }): Promise<string | boolean> {
  const { access, force } = options || {};
  let a = access;

  if (isNil(access)) {
    const { aliasName } = await prompt([
      {
        type: 'input',
        message: 'Please create alias for key pair. If not, please enter to skip',
        name: 'aliasName',
        default: await getAliasDefault(),
      }
    ]);
    a = trim(aliasName);
  }

  // 如果判断存在命名冲突
  const content = getYamlContent();
  if (hasIn(content, a as string) && force !== true) {
    const { type } = await prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Alias already exists. Please select a type:',
        choices: [
          { name: 'overwrite', value: 'overwrite' },
          { name: 'rename', value: 'rename' },
          { name: 'exit', value: 'exit' },
        ],
      },
    ]);
    
    if (type === 'rename') {
      return await getAlias(options);
    } else if (type === 'exit') {
      return false;
    }
  }

  return a as string;
}

