module.exports = async function index(inputs, args) {
  // console.log("pluginA======", JSON.stringify(inputs), args);
  return {
    ...inputs,
    props: {
      ...inputs.props,
      pluginA: "pluginA data",
    }
  };
};
