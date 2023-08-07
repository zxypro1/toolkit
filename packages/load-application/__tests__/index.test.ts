import loadApplication from '../src';
import path from 'path';

test('loadApplication template is empty', async () => {
  await expect(loadApplication('')).rejects.toThrow('template is required');
});

test('loadApplication template is not devsapp', async () => {
  await expect(loadApplication('xsahxl/start-fc-http-nodejs14')).rejects.toThrow(
    `The provider xsahxl is invalid, only support devsapp`
  );
});

test('v3 shltest', async () => {
  const dest = path.join(__dirname, '_temp');
  const res = await loadApplication('shltest', {
    dest,
    projectName: 'shltest',
    parameters: { cadtYamlString: { "bucket_1689926909": { "component": "aliyun_oss_bucket@dev", "props": { "bucket": "cadt-test-1111", "acl": "private", "storage_class": "Standard", "redundancy_type": "LRS" } }, "instance_1689926942": { "component": "aliyun_ots_instance@dev", "props": { "name": "cadt-inst-1111", "accessed_by": "Any", "instance_type": "HighPerformance" } }, "table_app_table_1689926942": { "component": "aliyun_ots_table@dev", "props": { "instance_name": "cadt-inst-1111", "table_name": "app_table", "primary_key": [{ "name": "id", "type": "String" }], "time_to_live": -1, "max_version": 1, "deviation_cell_version_in_sec": 86400, "depends_on": ["instance_1689926942"] } }, "cadt_HIIRNI7MVKJYL7FH": { "component": "ros_transformer@dev", "props": { "region": "cn-beijing", "name": "cadt_HIIRNI7MVKJYL7FH" } } } },
    appName: 'appname-test',
    access: 'default'
  })
  expect(res).toBe(path.join(dest, 'shltest'))
});
test.only('v3 shltest@dev.0.1', async () => {
  const dest = path.join(__dirname, '_temp');
  const res = await loadApplication('shltest@dev.0.1', {
    dest,
    projectName: 'shltest',
    appName: 'appname-test',
    access: 'default'
  })
  expect(res).toBe(path.join(dest, 'shltest'))
});

test('v2 start-fc-http-nodejs14', async () => {
  const dest = path.join(__dirname, '_temp');
  const appPath = await loadApplication('start-fc-http-nodejs14', {
    dest,
  });
  expect(appPath).toBe(path.join(dest, 'start-fc-http-nodejs14'));
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
