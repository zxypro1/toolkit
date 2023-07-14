module.exports = async function index(inputs, args) {
  // console.log("pluginE======", JSON.stringify(inputs));
  throw new Error('this is a test error by e plugin');
  return {
    ...inputs,
    output: {
      ...inputs.output,
      test: 'this is a test by o plugin'
    }
  };
};
