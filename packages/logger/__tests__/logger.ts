import path from 'path';
import EngineLogger from '../src';

const logPath = path.join(__dirname, 'fixtures', 'logs');

// 基础使用
const basicUsage = () => {
  console.log('================基础使用 Start================');
  const logger = new EngineLogger();
  logger.info('logger info');
  logger.warn('logger warn');
  logger.debug('logger debug');
  logger.error('logger error');
}
basicUsage();

// 文件和加密
const fileUsage = () => {
  console.log('================文件和加密 Start================');
  const lp = path.join(logPath, `${Date.now()}.log`);
  const logger = new EngineLogger({
    file: lp,
    secrets: ['secret', 'Greater than eight characters'],
  });
  logger.info('文件地址: ', lp);
  logger.warn('短加密字符: secret');
  logger.info('大于八个字符: Greater than eight characters');
  logger.info('多个加密字符: secret, Greater than eight characters, secret, Greater than eight characters');
  logger.debug('默认在终端不显示，但是在文件可以查到这条日志');
}
fileUsage();

// 测试换行符
const eolUsage = () => {
  console.log('================测试换行符 Start================');
  const logger = new EngineLogger({ eol: '换行符' });
  logger.info('info 1');
  logger.info('info 2');
}
eolUsage();


// 模拟文件流输出
const appendUsage = () => {
  console.log('================模拟文件流输出 Start================');
  const logger = new EngineLogger();

  logger.info('下行换行(1)');
  logger.info('下行换行(2)');
  
  logger.append('append(不换行)(1)');
  logger.append('append(不换行)(2)');
  
  logger.info('下行换行(3)');
  logger.info('end');
  console.log('================模拟文件流输出 End================');
}
appendUsage()
