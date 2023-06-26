import ParseSpec from '../src';
import path from 'path';

test('基本测试', () => {
    const parse = new ParseSpec(path.join(__dirname, './mock/s.yaml'));
    parse.start();
    // expect(res).toBeTruthy();
});