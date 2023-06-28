export default class ComponentDemo {
  constructor(private logger = console) {}
  public async deploy(inputs) {
    this.logger.log(`deploy: ${JSON.stringify(inputs, null, 2)}`);
    return { hello: 'world' };
  }
}
