import Credential from '@serverless-devs/credential';
import { ILoggerInstance } from '@serverless-devs/logger';
import ParseSpec, { IAllowFailure, ISpec } from '@serverless-devs/parse-spec';
import flatted from 'flatted';
import { get, omit, set, map, includes, isEmpty } from 'lodash';
import fs from 'fs-extra';
import Ajv from 'ajv';
import loadComponent from '@serverless-devs/load-component';

export function getLogPath(filePath: string) {
  return `step_${filePath}.log`;
}

export const randomId = () => Math.random().toString(16).slice(2);

export function getProcessTime(time: number) {
  return (Math.round((Date.now() - time) / 10) * 10) / 1000;
}

export async function getCredential(access: string | undefined, logger: ILoggerInstance) {
  try {
    const instance = new Credential({ logger });
    const res = await instance.get(access);
    return get(res, 'credential', {});
  } catch (error) {
    return {};
  }
}

export const stringify = (value: any) => {
  try {
    const data = { ...value };
    const steps = get(value, 'steps');
    if (steps) {
      set(
        data,
        'steps',
        map(steps, (step: any) => omit(step, 'instance')),
      );
    }
    const instance = get(data, 'instance');
    if (instance) {
      delete data.instance;
    }
    return JSON.stringify(data);
  } catch (error) {
    return flatted.stringify(value);
  }
};

export const getAllowFailure = (allowFailure: boolean | IAllowFailure | undefined, data: { exitCode?: number; command?: string }): boolean => {
  if (typeof allowFailure === 'boolean') {
    return allowFailure;
  }
  if (typeof allowFailure !== 'object') return false;
  if ('exit_code' in allowFailure && 'command' in allowFailure) {
    return includes(get(allowFailure, 'exit_code'), get(data, 'exitCode')) && includes(get(allowFailure, 'command'), get(data, 'command'));
  }
  if ('exit_code' in allowFailure) {
    return includes(get(allowFailure, 'exit_code'), get(data, 'exitCode'));
  }
  if ('command' in allowFailure) {
    return includes(get(allowFailure, 'command'), get(data, 'command'));
  }
  return false;
};

/**
 * Preview command function.  
 * Notice: only support json output.  
 * Example: 
 * ```javascript
 * await preview('s.yaml', 's.output', ['-a', 'default', '--debug']);
 * ```
 * @param {string} filePath template file path
 * @param {string} outputFile output file path
 * @param {string[]} argv all argv
 * @returns {string} preview result
 */
export async function preview(
  filePath: string, 
  outputFile: string,
  argv?: string[],
): Promise<string> {
  const spec = await new ParseSpec(filePath, { argv }).start();
  if (get(spec, 'yaml.use3x')) {
    const content = get(spec, 'yaml.content');
    const data = omit(content, ['extend']);
    if (outputFile) writeOutput(outputFile, data);
    return JSON.stringify(data);
  }
  return `Not support template: ${get(spec, 'yaml.path')}, you can update template to 3.x version`;
};

/**
 * Verify command function.  
 * Notice: only support json output.  
 * Example: 
 * ```javascript
 * await verify('s.yaml', 's.output', ['-a', 'default', '--debug']);
 * ```
 * @param {string} filePath template file path
 * @param {string} outputFile output file path
 * @param {string[]} argv all argv
 * @returns {string[]|string} verify result
 */
export async function verify(
  filePath: string, 
  outputFile: string,
  argv?: string[],
): Promise<string[]|string> {
  const ajv = new Ajv({ allErrors: true });
  const logger = console;
  const spec = await new ParseSpec(filePath, { argv }).start();
  if (get(spec, 'yaml.use3x')) {
    const errorsList = await getErrorList(spec, ajv, logger);
    let data;
    if (!isEmpty(errorsList)) {
      data = errorsList;
    } else {
      data = [`Format verification for [${get(spec, 'yaml.path', '').split('/').pop()}] passed.`];
    }
    if (outputFile) writeOutput(outputFile, data);
    return data;
  }

  return (`Not support template: ${get(spec, 'yaml.path')}, you can update template to 3.x version`);
}

const writeOutput = (outputFile: string, data: Record<string, any> | string[]) => {
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.appendFileSync(outputFile, '\n');
};

const getErrorList = async (spec: ISpec, ajv: Ajv, logger: any) => {
  let errorsList: any[] = [];
  for (const i of spec.steps) {
    const schema = await getSchema(i.component, logger);
    if (isEmpty(schema)) continue;
    const validate = ajv.compile(JSON.parse(schema));
    if (!validate(i.props)) {
      const errors = validate.errors;
      if (!errors) continue;
      for (const j of errors) {
        j.instancePath = i.projectName + '/props' + j.instancePath;
        if (j.keyword === 'enum') {
          j.message = j.message + ': ' + j.params.allowedValues.join(', ');
        }
      }
      errorsList = errorsList.concat(errors);
    }
  }
  return errorsList;
};

const getSchema = async (componentName: string, logger: any) => {
  // const componentLogger = logger.loggerInstance.__generate(componentName);
  const instance = await loadComponent(componentName, { logger });
  if (!instance || !instance.getSchema) return null;
  return instance.getSchema();
};