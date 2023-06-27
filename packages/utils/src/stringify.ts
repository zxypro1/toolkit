import flatted from 'flatted';
import { get, omit, set, map } from 'lodash';

const stringify = (value: any) => {
    try {
        const data = { ...value }
        const steps = get(value, 'steps');
        if (steps) {
            set(data, 'steps', map(steps, (step: any) => omit(step, 'instance')));
        }
        const instance = get(data, 'instance');
        if (instance) {
            delete data.instance;
        }
        return JSON.stringify(data);
    } catch (error) {
        return flatted.stringify(value);
    }
};

export default stringify;