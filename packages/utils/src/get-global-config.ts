import path from 'path';
import getRootHome from './get-root-home';
import getYamlContent from './get-yaml-content';


// 全局配置文件存放位置
export const GLOBAL_CONFIG_FILE_PATH = path.join(getRootHome(), 'set-config.yml');

const getGlobalConfig = (key: string) => {
  const content = getYamlContent(GLOBAL_CONFIG_FILE_PATH);
  return content?.[key];
}

export default getGlobalConfig;
