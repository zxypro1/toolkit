import { includes, map, split, set, sortBy } from 'lodash';
import { REGX } from './contants';
import { IStep } from './types';
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');

class Order {
    private orderMap = {} as Record<string, any>
    constructor(private steps: IStep[]) { }
    run() {
        const dependencies = this.getDependencies();
        this.analysis(dependencies);
        return this.sort();
    }
    sort() {
        const newSteps = map(this.steps, item => ({ ...item, order: this.orderMap[item.projectName] }));
        const result = sortBy(newSteps, (item) => -item.order);
        debug(`order steps: ${JSON.stringify(result, null, 2)}`);
        return result;
    }
    analysis(dependencies: Record<string, any>) {
        for (const project in dependencies) {
            const element = dependencies[project];
            for (const key in element) {
                if (this.orderMap[key]) {
                    set(this.orderMap, key, this.orderMap[key] + 1);
                }
            }
        }
        debug(`order map: ${JSON.stringify(this.orderMap, null, 2)}`);

    }
    getDependencies() {
        const projectNameList = map(this.steps, item => {
            set(this.orderMap, item.projectName, 1);
            return item.projectName
        });
        const dependencies = {} as Record<string, any>;
        let topKey = '';

        function deepCopy(obj: any) {
            let result: any = obj.constructor === Array ? [] : {};
            if (typeof obj === 'object') {
                for (var i in obj) {
                    let val = obj[i];

                    if (typeof val === 'string') {
                        const matchResult = val.match(REGX);
                        if (matchResult) {
                            const projectName = split(matchResult[1], '.')[0];
                            if (includes(projectNameList, projectName)) {
                                set(dependencies, topKey, { [projectName]: 1 })
                            }
                        }
                    }
                    result[i] = typeof val === 'object' ? deepCopy(val) : val;
                }
            } else {
                result = obj;
            }
            return result;
        }
        for (const step of this.steps) {
            topKey = step.projectName;
            deepCopy(step.props);
        }
        // 得到依赖关系后，需要对a依赖b，b依赖c这种case进行处理 => a依赖b,c
        console.log('dependencies', dependencies);
        for (const project in dependencies) {
            const element = dependencies[project];
            for (const key in element) {
                console.log('key', key);
                if (dependencies[key]) {
                    set(dependencies, project, { ...dependencies[project], ...dependencies[key] })
                }
            }
        }
        debug(`order dependencies: ${JSON.stringify(dependencies, null, 2)}`);
        return dependencies;
    }
}





export default (steps: IStep[]) => {
    return new Order(steps).run();
};