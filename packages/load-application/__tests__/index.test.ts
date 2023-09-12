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

test.only('v3 start-cadt-app', async () => {
  const dest = path.join(__dirname, '_temp');
  const template = 'start-cadt-app@0.0.3'
  const res = await loadApplication(template, {
    dest,
    projectName: template,
    parameters: {
      cadtJsonString: {
        "bucket_1691151092": {
          "component": "aliyun_oss_bucket@dev",
          "props": {
            "bucket": "xl-bucket-3002",
            "redundancy_type": "LRS",
          }
        },
        "logStore_sourcelog_1693965436": {
          "component": "aliyun_sls_logstore@dev",
          "props": {
            "depends_on": [
              "logProject_1693965436"
            ],
          }
        },
        "fc_function_1693882938": {
          "component": "fc3@dev",
          "actions": {
            "pre-deploy": [
              {
                "path": "./",
                "run": "bash init_code.sh nodejs16 xl-fc-3002 index.js"
              }
            ]
          },
          "props": {
            "function": {
              "handler": "index.handler",
              "diskSize": 512,
              "memorySize": 512,
              "code": "xl-fc-3002",
              "functionName": "xl-fc-3002",
              "environmentVariables": {
                "TZ": "Asia/Shanghai",
                "stackName": "${resources.cadt_9U8TNE2C4Z5EO3UF.props.name}"
              },
              "runtime": "nodejs16",
              "cpu": 0.35,
              "timeout": 60
            },
            "region": "cn-huhehaote",
          }
        },
        "logProject_1693965436": {
          "component": "aliyun_sls_project@dev",
          "props": {
            "name": "xl-sls-3002",
            "description": "xl 3002 test log project"
          }
        },
        "logStore_joblog_1693965436": {
          "component": "aliyun_sls_logstore@dev",
          "props": {
            "depends_on": [
              "logProject_1693965436"
            ],
            "retention_forever": false,
          }
        },
        "cadt_9U8TNE2C4Z5EO3UF": {
          "component": "ros_transformer@dev",
          "props": {
            "refs": [
              "${resources.bucket_1691151092.output}",
              "${resources.logProject_1693965436.output}",
              "${resources.logStore_sourcelog_1693965436.output}",
              "${resources.logStore_joblog_1693965436.output}"
            ],
            "name": "cadt_9U8TNE2C4Z5EO3UF",
            "region": "cn-huhehaote"
          }
        }
      }
    },
    appName: 'appname-test',
    access: 'default',
    reserveComments: false,
  })
  expect(res).toBe(path.join(dest, template))
});

test('v3 start-fc3-nodejs@dev', async () => {
  const dest = path.join(__dirname, '_temp');
  const template = 'start-fc3-nodejs@dev'
  const res = await loadApplication(template, {
    dest,
    projectName: template,
    parameters: {
      region: 'cn-huhehaote',
      functionName: 'start-nodejs-abd',
      runtime: 'nodejs14'
    },
    appName: 'appname-test',
    access: 'default',
    reserveComments: false,
  })
  expect(res).toBe(path.join(dest, template))
});
test('v3 shltest@dev.0.1', async () => {
  const dest = path.join(__dirname, '_temp');
  const res = await loadApplication('shltest@dev.0.1', {
    dest,
    projectName: 'shltest',
    appName: 'appname-test',
    access: 'default'
  })
  expect(res).toBe(path.join(dest, 'shltest'))
});

test('-y with v3', async () => {
  const dest = path.join(__dirname, '_temp');
  const res = await loadApplication('shltest', {
    dest,
    projectName: 'shltest',
    appName: 'appname-test',
    access: 'default',
    y: true
  })
  expect(res).toBe(path.join(dest, 'shltest'))
});

test('-y with v2', async () => {
  const dest = path.join(__dirname, '_temp');
  const template = 'start-yida-faas-connect-node'
  const res = await loadApplication(template, {
    dest,
    y: true
  })
  expect(res).toBe(path.join(dest, template))
});

test('-y --parameters', async () => {
  const dest = path.join(__dirname, '_temp');
  const res = await loadApplication('shltest', {
    dest,
    projectName: 'shltest',
    appName: 'appname-test',
    access: 'default',
    parameters: { runtime: 'node16' },
    y: true
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
