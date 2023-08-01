// @ts-ignore
const debug = require('@serverless-cd/debug')('serverless-devs:orm');
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// refer: https://www.prisma.io/docs/concepts/components/prisma-client/crud
interface IOptions {
  db: any;
}

export default class FileOrm {
  private db: any;
  constructor({ db }: IOptions) {
    const adapter = new JSONFile('db.json');
    this.db = new Low(adapter, { posts: [] });
  }

  async create(data: any) {
    await this.db.read();
    this.db.data.posts.push(data);
    await this.db.write();
  }

  async findUnique(data: any) {}

  async findMany(data: any) {}

  async findFirst(data: any) {}

  async delete(data: any) {}

  async update(data: any) {}
}
