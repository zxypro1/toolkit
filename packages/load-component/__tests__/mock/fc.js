class FC {
  constructor(inputs) {
    // console.log('constructor inputs', JSON.stringify(inputs, null, 2));
  }
  deploy(inputs) {
    console.log('deploy inputs', JSON.stringify(inputs, null, 2));
    return { message: 'this is a local fc' };
  }
}

module.exports = FC;
