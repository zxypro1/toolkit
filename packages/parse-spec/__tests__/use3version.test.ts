import { use3version } from '../src';
import path from 'path';

test('use3version', () => {
    const res = use3version(path.join(__dirname, './mock/use3version.yaml'));
    expect(res).toBeTruthy();
});