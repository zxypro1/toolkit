module.exports = async function index(inputs, args, logger) {
  logger.info("pluginO======", JSON.stringify(inputs));
  return {
    ...inputs,
    output: {
      ...inputs.output,
      test: 'this is a test by o plugin'
    }
  };
};
