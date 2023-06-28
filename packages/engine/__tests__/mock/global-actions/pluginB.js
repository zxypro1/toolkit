module.exports = async function index(inputs, args) {
  console.log("pluginB======", JSON.stringify(inputs), args);
  return {
    ...inputs,
    pluginB: "pluginB data",
  };
};
