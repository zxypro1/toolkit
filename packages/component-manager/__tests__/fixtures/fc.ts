const commands = {
  deploy: {
    help: {
      description: 'fc deploy',
      document: 'https://serverless.help/t/fc-deploy',
      usage: ['$ s deploy <options>', '$ s deploy <sub-command> <options>'],
      options: [
        {
          name: 'type',
          description: '[Optional] Only deploy configuration or code, value: code/config ',
          defaultOption: false,
          type: String,
        },
        {
          name: 'use-local',
          description: '[Optional] Deploy resource using local config',
          defaultOption: false,
          type: Boolean,
        }
      ],
    },
    subCommands: {
      service: {
        help: {
          description: 'fc deploy service',
          document: 'https://serverless.help/t/fc-deploy',
          usage: ['$ s deploy service <options>'],
          options: [
            {
              name: 'use-local',
              description: '[Optional] Deploy resource using local config',
              defaultOption: false,
              type: Boolean,
            }
          ],
        },
        hangRun: false,
      },
      function: {
        hangRun: true,
      },
    },
    hangRun: (parsedArgs: Record<string, any>, _props: any) => {
      if (parsedArgs['use-local']) {
        return true;
      }
      return false;
    },
  },
  info: {
    help: {
      description: 'run info',
      document: 'https://serverless.help/t/fc-info',
      usage: ['$ s info <options>'],
      options: [
        {
          name: 'type',
          description: '[Optional] Only deploy configuration or code, value: code/config ',
          defaultOption: false,
          type: String,
        },
        {
          name: 'use-local',
          description: '[Optional] Deploy resource using local config',
          defaultOption: false,
          type: Boolean,
        },
      ],
    }
  }
}


export default class Fc {
  static readonly commands = commands;

  async deploy() {
    console.log('fc run deploy');
  }

  async info() {
    console.log('fc run info');
  }
}
