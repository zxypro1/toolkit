import { includes, map, split, set, sortBy, isEmpty, get, cloneDeep, unset, isObject } from 'lodash';
import { REGXG } from './contants';
import { IStep } from './types';
const debug = require('@serverless-cd/debug')('serverless-devs:parse-spec');

class Order {
  private useOrder = false; // 是否使用分析出来的order
  private orderMap = {} as Record<string, any>;
  private dependencies = {} as Record<string, any>;
  // origin value
  constructor(private steps: IStep[]) { }
  start() {
    this.dependencies = this.getDependencies();
    this.analysis();
    return this;
  }
  // real value
  sort(steps: IStep[]) {
    if (!this.useOrder) return { steps, dependencies: this.dependencies };
    const newSteps = map(steps, item => ({
      ...item,
      order: this.orderMap[item.projectName],
    }));
    const result = sortBy(newSteps, item => item.order);
    return { steps: result, dependencies: this.dependencies, useOrder: this.useOrder };
  }
  private analysis() {
    const temp = cloneDeep(this.dependencies);
    let num = 0;
    const func = () => {
      for (const project in temp) {
        const element = temp[project];
        if (isEmpty(element)) {
          set(this.orderMap, project, num++);
          unset(temp, project);
          for (const key in temp) {
            unset(temp, [key, project]);
          }
          func();
        }
      }
    }
    func();
    debug(`order map: ${JSON.stringify(this.orderMap)}`);
  }
  private getDependencies() {
    debug(`order steps: ${JSON.stringify(this.steps)}`);
    const projectNameList = map(this.steps, item => item.projectName);
    const dependencies = {} as Record<string, any>;
    let topKey = '';
    const deepCopy = (obj: any) => {
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
                  this.useOrder = true;
                  set(dependencies, topKey, { ...dependencies[topKey], [projectName]: 1 });
                }
              }
            }
          }
          result[i] = isObject(val) ? deepCopy(val) : val;
        }
      } else {
        result = obj;
      }
      return result;
    }
    for (const step of this.steps) {
      topKey = step.projectName;
      set(dependencies, topKey, {});
      deepCopy(get(step, 'props', {}));
    }
    debug(`order dependencies: ${JSON.stringify(dependencies)}`);
    return dependencies;
  }
}

export default Order;
