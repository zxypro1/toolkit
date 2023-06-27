import random from 'random-string';

// 需要 mock 的方法
require('opn');
const utils = require('../src/utils');

jest.mock('opn', () => jest.fn());
utils.request_get = jest.fn(() => ({
  ResponseId: random(),
  Response: {
    login: 'wss-git',
    safety_code: 'test-token',
  }
}));