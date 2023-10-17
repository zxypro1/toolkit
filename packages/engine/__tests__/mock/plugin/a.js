module.exports = async function index(inputs, args, logger) {
  // console.log("pluginA======", JSON.stringify(inputs), args);
  logger.info('pluginA')
  return {
    ...inputs,
    props: {
      ...inputs.props,
      pluginA: "pluginA data",
    }
  };
};
