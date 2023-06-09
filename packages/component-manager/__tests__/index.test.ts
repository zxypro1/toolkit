import ComponentManager from '../src';
import path from "path";
import { IHelp } from '../src/types/commands';

// 模拟 yaml
const yamlConfig: any = {
  'a': {
    component: 'fc',
    props: { },
  },
  'b': {
    component: 'nas',
    props: { },
  },
  'c': {
    component: 'fc',
    props: { },
  },
};

// 模拟 engine 组件加载
const getRunConfigs = async () => await Promise.all(
  Object.keys(yamlConfig).map(async (key: string) => {
    const inputs: any = yamlConfig[key];
  
    // 下载组件以及其他的一些处理
    // await load(app);
    // ...
  
    // 组件地址
    const componentPath = path.join(__dirname, 'fixtures', inputs.component)
    const Component = require(componentPath).default;
    return {
      Component,
      commands: Component.commands,
      props: inputs.props,
      componentName: inputs.component,
      key,
    };
  }
));

describe('解析 commands', () => {
  test('解析命令都存在', async () => {
    const runConfigs = await getRunConfigs();
    const args = ['deploy', '--use-local', '--type', 'test', '--help']; // cli 的参数
  
    await Promise.all(
      runConfigs.map(async (runConfig: any) => {
        const { props, commands, componentName } = runConfig;
        const componentManager = new ComponentManager({
          commands,
          props,
          args,
        });
        const { argsCommand, argsData, help, hangRun, parallel, singleton } = await componentManager.parseCommands();

        // 断言指令
        expect(argsCommand).toEqual(['deploy']);

        if (componentName === 'fc') {
          expect(argsData).toEqual({ _: [ 'deploy' ], 'use-local': true, type: 'test', help: true });
          expect((help as IHelp).description).toBe(commands.deploy.help.description);
          expect(hangRun).toBeTruthy();
          expect(parallel).toBeTruthy();
          expect(singleton).toBeFalsy();
        } else if (componentName === 'nas') {
          // 断言解析别名
          expect(argsData).toEqual({ _: [ 'deploy' ], 'use-local': true, p: 'test', type: 'test', help: true });
          expect(hangRun).toBeFalsy();
          expect(parallel).toBeTruthy();
          expect(singleton).toBeFalsy();
        }
      })
    );
  });

  test('解析子命令', async () => {
    const runConfigs = await getRunConfigs();
    const args = ['deploy', 'service']; // cli 的参数

    await Promise.all(
      runConfigs.map(async (runConfig: any) => {
        const { props, commands, componentName } = runConfig;
        const componentManager = new ComponentManager({
          commands,
          props,
          args,
        });

        if (componentName === 'fc') {
          const { argsCommand, help } = await componentManager.parseCommands();

          expect(argsCommand).toEqual([ 'deploy', 'service' ]);
          expect((help as IHelp).description).toBe(commands.deploy.subCommands.service.help.description);
        } else if (componentName === 'nas') {
          await expect(async () => {
            await componentManager.parseCommands();
          }).rejects.toThrow('没有找到对应的指令');
        }
      })
    );
  })
});
