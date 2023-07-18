module.exports = async function index(inputs, args) {
  // console.log("pluginB======", JSON.stringify(inputs), args);
  return {
    ...inputs,
    props: {
      ...inputs.props,
      pluginB: "pluginB data",
    }
  };
};
