
import fs from 'fs-extra';
import { buildComponentInstance } from './utils';

class Componet {
  constructor(private name: string, private params?: Record<string, any>) { }
  async run() {
    // 本地路径
    if (fs.existsSync(this.name)) {
      return await buildComponentInstance(this.name, this.params);
    }
  }
}

const loadComponent = async (name: string, params?: Record<string, any>) => {
  return await new Componet(name, params).run();
};

export default loadComponent;
