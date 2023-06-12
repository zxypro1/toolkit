import { isEmpty, isNil } from 'lodash';
import { blue, grey } from 'chalk';

const showDetail = (detail: string): string => {
  const details = detail.split('/');

  if (details.length > 1) {
    const endItem = details.pop();
    const startItem = `${details.join('/')}/`;
    return `${grey(startItem)}${endItem}`;
  }

  return detail;
}

const showStartGrey = (start: string, type: string, detail: string): string => {
  return `${blue(`${start} ${type}`)}: ${showDetail(detail)}`;
}

/**
 * 正在获取信息
 * @param type 资源类型
 * @param detail 资源详情
 * @returns 输出值
 * E.g.: Getting domain: todo.list.*****.cn-hangzhou.fc.xxxx.net
 */
export const getting = (type: string, detail: string): string => {
  return showStartGrey('Getting', type, detail);
}

/**
 * 正在设置信息
 * @param type 资源类型
 * @param detail 资源详情
 * @returns 输出值
 * E.g.: Setting domain: todo.list.*****.cn-hangzhou.fc.xxxx.net
 */
export const setting = (type: string, detail: string): string => {
  return showStartGrey('Setting', type, detail);
}

/**
 * 正在创建资源
 * @param type 资源类型
 * @param detail 资源详情
 * @returns 输出值
 * E.g.: Creating service: my-test-service
 */
export const creating = (type: string, detail: string): string => {
  return showStartGrey('Creating', type, detail);
}

/**
 * 正在更新资源
 * @param type 资源类型
 * @param detail 资源详情
 * @returns 输出值
 * E.g.: Updating function: my-test-service/function
 */
export const updating = (type: string, detail: string): string => {
  return showStartGrey('Updating', type, detail);
}

/**
 * 正在删除资源
 * @param type 资源类型
 * @param detail 资源详情
 * @returns 输出值
 * E.g.: Removing function: my-test-service/function
 */
export const removing = (type: string, detail: string): string => {
  return showStartGrey('Removing', type, detail);
}

/**
 * 正在检查资源
 * @param type  资源类型
 * @param detail  资源详情
 * @param target 目标
 * @returns 
 * E.g.: Checking function: my-test-service/function -> exists
 */
export const checking = (type: string, detail: string, target?: string): string => {
  const showLog = showStartGrey('Checking', type, detail);
  if (isEmpty(target)) {
    return showLog;
  }
  return `${showLog} ${grey('->')} ${target}`;
}

/**
 * 完成资源获取
 * @param type  资源类型
 * @param detail  资源详情
 * @returns 
 * E.g.: Got function: my-test-service/function
 */
export const got = (type: string, detail: string): string => {
  return showStartGrey('Got', type, detail);
}

/**
 * 完成设置信息
 * @param type  资源类型
 * @param detail  资源详情
 * @returns 
 * E.g.: Set function: my-test-service/function
 */
export const set = (type: string, detail: string): string => {
  return showStartGrey('Set', type, detail);
}

/**
 * 完成创建资源
 * @param type  资源类型
 * @param detail  资源详情
 * @returns 
 * E.g.: Created function: my-test-service/function
 */
export const created = (type: string, detail: string): string => {
  return showStartGrey('Created', type, detail);
}

/**
 * 完成更新资源
 * @param type  资源类型
 * @param detail  资源详情
 * @returns 
 * E.g.: Updated function: my-test-service/function
 */
export const updated = (type: string, detail: string): string => {
  return showStartGrey('Updated', type, detail);
}

/**
 * 完成删除资源
 * @param type  资源类型
 * @param detail  资源详情
 * @returns 
 * E.g.: Removed function: my-test-service/function
 */
export const removed = (type: string, detail: string): string => {
  return showStartGrey('Removed', type, detail);
}

/**
 * 完成检查资源
 * @param type  资源类型
 * @param detail  资源详情
 * @param target  检测结果
 * @returns 
 * E.g.: Checked function: my-test-service/function exists
 */
export const checked = (type: string, detail: string, target: string): string => {
  const showLog = showStartGrey('Checked', type, detail);
  return `${showLog} ${target}`;
}

/**
 * 使用信息
 * @param type  资源类型
 * @param detail  资源详情
 * @returns 
 * E.g.: Using region: cn-hangzhou
 */
export const using = (type: string, detail: string): string => {
  return showStartGrey('Using', type, detail);
}

/**
 * 重试操作
 * @param type  资源类型
 * @param action  行为
 * @param detail  资源详情
 * @param time  次数
 * @param times  最大次数
 * @returns 
 * E.g.: 
 *  Retrying fc-function: create cn-hangzhou/my-test-service/function
 *  Retrying fc-function: create cn-hangzhou/my-test-service/function, retry 1 times
 *  Retrying fc-function: create cn-hangzhou/my-test-service/function, retry 1/3 times
 */
export const retrying = (type: string, action: string, detail: string, time?: number, times?: number): string => {
  const showLog = `${blue(`Retrying ${type}`)}: ${action} ${showDetail(detail)}`;

  if (isNil(time)) {
    return showLog;
  }

  if (isNil(times)) {
    return `${showLog}, ${grey('retry')} ${time} ${grey('times')}`;
  }

  return `${showLog}, ${grey('retry')} ${time}/${times} ${grey('times')}`;
}
