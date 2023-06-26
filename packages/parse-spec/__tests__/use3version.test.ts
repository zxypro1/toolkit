import { use3version } from '../src';
import path from 'path';

test.skip('use3version', () => {
    const res = use3version(path.join(__dirname, './mock/use3version.yaml'));
    expect(res).toBeTruthy();
});