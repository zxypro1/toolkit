class FC {
  constructor({logger}) {
    this.logger = logger;
  }
  async deploy(inputs) {
    this.logger.debug(`deploy: ${JSON.stringify(inputs)}`)
    const { getCredential } = inputs;
    const res = await getCredential()
    this.logger.debug(`get credential: ${JSON.stringify(res)}`)
  }
  error() {
    throw new Error('Not implemented')
  }
}

module.exports = FC;