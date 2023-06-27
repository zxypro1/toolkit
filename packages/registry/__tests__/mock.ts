import random from 'random-string';

// 需要 mock 的方法
require('opn');
const utils = require('../src/utils');

export const GENERATE_TOKEN = 'generateToken';
export const RESET_TOKEN = 'resetToken';

jest.mock('opn', () => jest.fn());
utils.request_get = jest.fn(() => ({
  ResponseId: random(),
  Response: {
    login: 'wss-git',
    safety_code: GENERATE_TOKEN,
  }
}));

utils.request_post = jest.fn(() => ({
  ResponseId: random(),
  Response: {
    login: 'wss-git',
    safety_code: RESET_TOKEN,
  }
}));