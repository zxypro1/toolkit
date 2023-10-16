import Engine from '../src';
import path from 'path';
import fs from 'fs-extra';
import { get } from 'lodash';
import * as utils from '@serverless-devs/utils'
import { ENVIRONMENT_FILE_PATH, ENVIRONMENT_KEY } from '@serverless-devs/parse-spec';
const cwd = path.join(__dirname, './mock/environment');

describe('specify --env', () => {
  test('environment and extend is conflict', async () => {
    const engine = new Engine({
      template: 'extend.yaml',
      args: ['deploy', '--env', 'testing'],
      cwd,
    });
    const context = await engine.start();
    console.log(context);
    expect(get(context, 'error[0].message')).toMatch('Environment and extend is conflict');
  });
  test('environment file is not exist', async () => {
    const template = 'no.yaml'
    const engine = new Engine({
      template,
      args: ['deploy', '--env', 'testing'],
      cwd,
    });
    const context = await engine.start();
    console.log(context);
    const content = utils.getYamlContent(path.join(cwd, template));
    expect(get(context, 'error[0].message')).toMatch(`Environment file [${utils.getAbsolutePath(get(content, ENVIRONMENT_KEY), cwd)}] is not exist`);
  });
  test('env name was not found', async () => {
    const template = 's.yaml'
    const envName = 'no_found'
    const engine = new Engine({
      template,
      args: ['deploy', '--env', envName],
      cwd,
    });
    const context = await engine.start();
    console.log(context);
    const content = utils.getYamlContent(path.join(cwd, template));
    expect(get(context, 'error[0].message')).toMatch(`Env [${envName}] was not found`);
  });
  test('basic', async () => {
    const template = 's.yaml'
    const envName = 'testing'
    const engine = new Engine({
      template,
      args: ['deploy', '--env', envName],
      cwd,
    });
    const context = await engine.start();
    console.log(context);
    expect(get(context, 'status')).toBe('success')
  });
})


describe('not specify --env', () => {
  beforeEach(() => {
    jest.resetModules();
  })
  test('environment and extend is conflict', async () => {
    const engine = new Engine({
      template: 'extend.yaml',
      args: ['deploy'],
      cwd,
    });
    const context = await engine.start();
    console.log(context);
    expect(get(context, 'error[0].message')).toMatch('Environment and extend is conflict');
  });
  test('environment file is not exist', async () => {
    const template = 'no.yaml'
    const engine = new Engine({
      template,
      args: ['deploy'],
      cwd,
    });
    const context = await engine.start();
    console.log(context);
    const content = utils.getYamlContent(path.join(cwd, template));
    expect(get(context, 'error[0].message')).toMatch(`Environment file [${utils.getAbsolutePath(get(content, ENVIRONMENT_KEY), cwd)}] is not found`);
  });
  test('env name was not found', async () => {
    fs.ensureFileSync(ENVIRONMENT_FILE_PATH);
    fs.writeJSONSync(ENVIRONMENT_FILE_PATH, { 'demo': 'testing11' }, { spaces: 2 })
    const template = 's.yaml'
    const engine = new Engine({
      template,
      args: ['deploy'],
      cwd,
    });
    const context = await engine.start();
    console.log(context);
    expect(get(context, 'error[0].message')).toMatch('Default env [testing11] was not found');
  });
  test('basic', async () => {
    fs.ensureFileSync(ENVIRONMENT_FILE_PATH);
    fs.writeJSONSync(ENVIRONMENT_FILE_PATH, { 'demo': 'testing' }, { spaces: 2 })
    const template = 's.yaml'
    const engine = new Engine({
      template,
      args: ['deploy'],
      cwd,
    });
    const context = await engine.start();
    console.log(context);
    expect(get(context, 'status')).toBe('success')
  });
})