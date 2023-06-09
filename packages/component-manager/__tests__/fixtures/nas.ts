const commands = {
  deploy: {
    help: {
      description: 'run nas deploy',
      document: 'https://serverless.help/t/nas',
      usage: ['$ s deploy <options>'],
      options: [
        {
          name: 'type',
          alias: 'p',
          description: '[Optional] Only deploy configuration or code, value: code/config ',
          defaultOption: false,
          type: String,
        },
      ],
    },
  },
  upload: {
    help: {
      description: 'run upload',
      document: 'https://serverless.help/t/nas',
      usage: ['$ s nas <options>'],
      options: [
        {
          name: 'force',
          alias: 'f',
          description: '[Optional] xxxxxxxx',
          defaultOption: false,
          type: Boolean,
        },
      ],
    },
  },
}

export default class Nas {
  static readonly commands = commands;

  async deploy() {
    console.log('nas run deploy');
  }

  async upload() {
    console.log('nas run upload');
  }
}

/*

编排: 
  [a,b], c

a:
b:
c:

s deploy => engine yaml => 编排之前 => 调用我的包 == 组件的能力信息/配置信息 ==> 编排 => 运行组件
*/