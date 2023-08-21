import { Low } from './lowdb/core/Low';
import { JSONFile } from './lowdb/node';
import lodash from 'lodash';

const applyFilter = require('loopback-filters');
interface IFileOption {
  url: string;
  model: string;
}
interface ICreateOption {
  data: Record<string, any>;
  skipDuplicates: boolean;
}

interface IFindOption {
  where: Record<string, any>;
}

interface IUpdateOption {
  where: Record<string, any>;
  data: Record<string, any>;
}

interface IDeleteOption {
  where: Record<string, any>;
}

interface IModelOption {
  [key: string]: any[];
}

export default class FileOrm {
  [key: string]: any;
  private client: any;
  private url: any;
  private modelOption: any;
  constructor(url: string, modelOption: IModelOption) {
    this.url = url;
    this.modelOption = modelOption;
    const adapter = new JSONFile(this.url);
    this.client = new Low(adapter, modelOption || {});
  }
  async init() {
    await this.client.read();
    for (const model in this.modelOption) {
      // @ts-ignore
      this[model] = {
        /**
       * 
       * @param args: 
       * @returns 
       * @example
       * await orm['posts'].create({
          data: {
            name: "dankun",
          }
        })
       */
        create: (args: ICreateOption) => this.create(args, model),

        /**
       * 
       * @param filter: 
       * @returns 
       * @example
       * await orm['posts'].findUnique({
          where: {
            name: "dankun_1",
          },
        })
       */
        findUnique: (filter: IFindOption) => this.findUnique(filter, model),

        /**
       * 
       * @param args: 
       * @returns 
       * @example
       * await orm['posts'].findUnique({
          where: {
            name: "dankun_1",
          },
        })
       */
        findMany: (filter: IFindOption) => this.findMany(filter, model),

        update: (filter: IUpdateOption) => this.update(filter, model),

        /**
       * 
       * @param filter: 
       * @returns 
       * @example
       * await orm['posts'].findUnique({
          where: {
            name: "dankun_1",
          },
        })
       */
        delete: (filter: IDeleteOption) => this.delete(filter, model),
      };
    }
  }

  async create(args: ICreateOption, model: string) {
    const { data } = args;
    if (!this.client.data[model]) {
      this.client.data[model] = [];
    }
    if (data) {
      const modelData = Array.isArray(data) ? data : [data];
      this.client.data[model] = lodash.concat(this.client.data[model], modelData);
      await this.client.write();
      return data;
    }
  }

  async findUnique(filter: IFindOption, model: string) {
    const modelData = lodash.get(this.client.data, model, []);
    const filtered = applyFilter(modelData, filter);
    return lodash.first(filtered);
  }

  async findMany(filter: IFindOption, model: string) {
    const modelData = lodash.get(this.client.data, model, []);
    const filtered = applyFilter(modelData, filter);
    return filtered;
  }

  async update(filter: IUpdateOption, model: string) {
    const modelData = lodash.get(this.client.data, model, []);
    const filtered = applyFilter(modelData, lodash.omit(filter, 'data'));
    const updateData = lodash.get(filter, 'data', {});

    if (!lodash.isEmpty(filtered)) {
      lodash.forEach(filtered, filterItem => {
        for (const key in filterItem) {
          // @ts-ignore
          filterItem[key] = updateData[key];
        }
      });
    }
    this.client.data[model] = modelData;
    await this.client.write();
    return modelData;
  }

  async delete(filter: IDeleteOption, model: string) {
    const modelData = lodash.get(this.client.data, model, []);
    const filtered = applyFilter(modelData, filter);
    const remainData = lodash.difference(modelData, filtered);
    this.client.data[model] = remainData;
    await this.client.write();
    return remainData;
  }
}
