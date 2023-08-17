import minimist from 'minimist';
import { defaultsDeep, isEmpty } from 'lodash';

const DEFAULT_OPTS = {
  alias: {
    access: 'a',
    help: 'h',
    force: 'f',
    template: 't',
    version: 'v',
    output: 'o',
  },
  boolean: ['debug', 'skip-actions', 'help', 'version', 'force'],
  string: ['access', 'template', 'output'],
};

/**
 * 解析参数
 * @param opts
 * @returns
 */
function parseArgv(argv: string[], opts?: minimist.Opts): Record<string, any> {
  // 需要考虑两个 case
  //   1. 包含空格: -e '{ "setCredential": "value" }'
  //   2. -la => l + a
  //   3. --la => la

  if (isEmpty(argv)) {
    return { _: [] };
  }

  return minimist(argv, defaultsDeep(opts, DEFAULT_OPTS));
}

export default parseArgv;
