import fs from 'fs';

// 可以通过事件监听，console format 时发送一下请求
export default class ShowLog {
  readonly filePath: string;
  private row: number;
  private col: number;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.row = 0;
    this.col = 0;
  }

  start() {
    fs.watchFile(this.filePath, () => {
      
    });
  }

  stop() {
    fs.unwatchFile(this.filePath);
  }
}
