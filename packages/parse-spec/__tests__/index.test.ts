import ParseSpec from '../src';
import path from 'path';
import { stringify } from '@serverless-devs/utils'

test('基本测试', async () => {
    const parse = new ParseSpec(path.join(__dirname, './mock/simple.yaml'));
    const res = await parse.start();
    expect(res).not.toBeNull();
});