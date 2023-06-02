const Logger = require('../lib').default;

const logger = new Logger({
  eol: '',
})

logger.info('info 1');
logger.info('info 2');