import { includes, map, split, set, sortBy, isEmpty, get } from 'lodash';
import { REGXG } from './contants';
import { IStep } from './types';
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');

class Order {
  private orderMap = {} as Record<string, any>;
  constructor(private steps: IStep[]) {}
  run() {
    const dependencies = this.getDependencies();
    if (isEmpty(dependencies)) return { steps: this.steps, dependencies };
    this.analysis(dependencies);
    return { steps: this.sort(), dependencies };
  }
  sort() {
    const newSteps = map(this.steps, (item) => ({
      ...item,
      order: this.orderMap[item.projectName],
    }));
    const result = sortBy(newSteps, (item) => -item.order);
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
    debug(`order map: ${JSON.stringify(this.orderMap)}`);
  }
  getDependencies() {
    const projectNameList = map(this.steps, (item) => {
      set(this.orderMap, item.projectName, 1);
      return item.projectName;
    });
    const dependencies = {} as Record<string, any>;
    let topKey = '';

    function deepCopy(obj: any) {
      let result: any = obj.constructor === Array ? [] : {};
      if (typeof obj === 'object') {
        for (var i in obj) {
          let val = obj[i];

          if (typeof val === 'string') {
            const matchResult = val.match(REGXG);
            if (matchResult) {
              for (const item of matchResult) {
                const newItem = item.replace(REGXG, '$1');
                const projectName = split(newItem, '.')[1];
                if (includes(projectNameList, projectName)) {
                  set(dependencies, topKey, { ...dependencies[topKey], [projectName]: 1 });
                }
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
      deepCopy(get(step, 'props', {}));
    }
    // 得到依赖关系后，需要对a依赖b，b依赖c这种case进行处理 => a依赖b,c
    for (const project in dependencies) {
      const element = dependencies[project];
      for (const key in element) {
        if (dependencies[key]) {
          set(dependencies, project, { ...dependencies[project], ...dependencies[key] });
        }
      }
    }
    debug(`order dependencies: ${JSON.stringify(dependencies)}`);
    return dependencies;
  }
}

export default (steps: IStep[]) => {
  return new Order(steps).run();
};
