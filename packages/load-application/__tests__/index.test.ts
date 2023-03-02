import loadApplication from '../src';
import path from 'path';

test('loadApplication template is empty', async () => {
  await expect(loadApplication('')).rejects.toThrow('template is required');
});

test('loadApplication template is not devsapp', async () => {
  await expect(loadApplication('xsahxl/start-fc-http-nodejs14')).rejects.toThrow(
    'xsahxl is not supported, only support devsapp',
  );
});

describe('loadApplication template is devsapp without version', () => {
  const template = 'start-fc-http-nodejs14';
  const dest = path.join(__dirname, '_temp');
  test('baisc', async () => {
    const appPath = await loadApplication(template, {
      dest,
    });
    expect(appPath).toBe(path.join(dest, template));
  });
  test('baisc with provider', async () => {
    const appPath = await loadApplication(`devsapp/${template}`, {
      dest,
    });
    expect(appPath).toBe(path.join(dest, template));
  });
  test('loadApplication template with projectName', async () => {
    const projectName = 'custom-project-name';
    const appPath = await loadApplication(template, {
      dest,
      projectName,
    });
    expect(appPath).toBe(path.join(dest, projectName));
  });
  test('loadApplication template with appName', async () => {
    const projectName = 'custom-app-name';
    const appPath = await loadApplication(template, {
      dest,
      projectName,
      appName: projectName,
    });
    expect(appPath).toBe(path.join(dest, projectName));
  });
  test('loadApplication template with parameters', async () => {
    const projectName = 'custom-parameters';
    const appPath = await loadApplication(template, {
      dest,
      projectName,
      parameters: { region: 'cn-chengdu' },
    });
    expect(appPath).toBe(path.join(dest, projectName));
  });
  test('loadApplication template with access', async () => {
    const projectName = 'custom-access';
    const appPath = await loadApplication(template, {
      dest,
      projectName,
      access: projectName,
    });
    expect(appPath).toBe(path.join(dest, projectName));
  });
});

describe('loadApplication template is devsapp with version', () => {
  const template = 'start-fc-http-nodejs14@1.1.14';
  const dest = path.join(__dirname, '_temp', 'version');
  test('baisc', async () => {
    const appPath = await loadApplication(template, {
      dest,
    });
    expect(appPath).toBe(path.join(dest, 'start-fc-http-nodejs14'));
  });
  test('baisc with provider', async () => {
    const appPath = await loadApplication(template, {
      dest,
    });
    expect(appPath).toBe(path.join(dest, 'start-fc-http-nodejs14'));
  });
  test('loadApplication template with projectName', async () => {
    const projectName = 'custom-project-name';
    const appPath = await loadApplication(template, {
      dest,
      projectName,
    });
    expect(appPath).toBe(path.join(dest, projectName));
  });
  test('loadApplication template with appName', async () => {
    const projectName = 'custom-app-name';
    const appPath = await loadApplication(template, {
      dest,
      projectName,
      appName: projectName,
    });
    expect(appPath).toBe(path.join(dest, projectName));
  });
  test('loadApplication template with parameters', async () => {
    const projectName = 'custom-parameters';
    const appPath = await loadApplication(template, {
      dest,
      projectName,
      parameters: { region: 'cn-chengdu' },
    });
    expect(appPath).toBe(path.join(dest, projectName));
  });
  test('loadApplication template with access', async () => {
    const projectName = 'custom-access';
    const appPath = await loadApplication(template, {
      dest,
      projectName,
      access: projectName,
    });
    expect(appPath).toBe(path.join(dest, projectName));
  });
});
