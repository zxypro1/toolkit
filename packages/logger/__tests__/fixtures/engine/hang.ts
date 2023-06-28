import inquirer from 'inquirer';

export default class Question {
  logger: any;

  constructor({ logger }: any) {
    this.logger = logger;
  }

  async deploy() {
    const answers: any = await inquirer.prompt([
      {
        type: 'list',
        name: 'prompt',
        message: '测试',
        choices: ['yes', 'no'],
      },
    ]);

    this.logger.info('answers.prompt', answers.prompt);
  }
}
