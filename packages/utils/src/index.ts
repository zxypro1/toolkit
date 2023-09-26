import path from 'path';

export { default as getCurrentEnvironment } from './get-current-environment';
export { default as isCiCdEnvironment } from './is-cicd-environment';
export { default as isChinaUser } from './is-china-user';
export { default as isDebugMode } from './is-debug-mode';
export { default as getRootHome } from './get-root-home';
export { setGlobalConfig, getGlobalConfig, GLOBAL_CONFIG_FILE_PATH } from './global-config';
export { default as parseArgv } from './parse-argv';
export { default as getYamlContent, getYamlPath, getAbsolutePath } from './get-yaml-content';
export { default as fieldEncryption } from './field-encryption';
export { default as isWindow } from './is-window';
export { default as DevsError } from './devs-error';
export { default as registry } from './registry';
export { default as traceid } from './traceid';
export { default as readJson } from './read-json';
export { default as emoji } from './emoji';
export const getLockFile = (basePath: string) => path.join(basePath, '.s.lock');