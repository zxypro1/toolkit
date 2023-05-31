import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';
import archiver from 'archiver';
import readline from 'readline';
import ignoreWalk from '@serverless-devs/ignore-walk';
import ProgressService, { ProgressType } from '@serverless-devs/progress-bar';
import { IOptions, IResult } from './types';

const isWindows = process.platform === 'win32';
const logger = console;

class Zip {
  private codeUri: string;
  private ignoreFiles: string[] | undefined;
  private includes: string[] | undefined;
  private outputFileName: string;
  private outputFilePath: string;
  private level: number;
  private prefix: string | undefined;

  constructor(options: IOptions) {
    this.codeUri = options.codeUri;
    this.ignoreFiles = options.ignoreFiles;
    this.includes = options.includes;
    this.outputFileName = options.outputFileName || `${Date.now()}.zip`;
    this.outputFilePath = options.outputFilePath || process.cwd();
    this.level = options.level || 9;
    this.prefix = options.prefix;

    this.checkOptions();
  }

  // 校验
  checkOptions() {
    if (_.isEmpty(this.codeUri) && !_.isString(this.codeUri)) {
      throw new Error(`CodeUri incorrect format, expected to be string: ${this.codeUri}`);
    }

    if (!fs.pathExistsSync(this.codeUri)) {
      throw new Error(`CodeUri: ${this.codeUri} is not exist`);
    }

    if (!_.isEmpty(this.includes)) {
      _.forIn(this.includes, (file) => {
        if (!fs.pathExistsSync(file)) {
          throw new Error(`Include codeUri: ${file} is not exist`);
        }
      })
    }
  }

  async run(): Promise<IResult> {
    // 输出文件的路径
    const outputFile = path.join(this.outputFilePath, this.outputFileName);
    // 确保目录存在
    fs.ensureDir(this.outputFilePath);
    // 创建输出文件流
    const output = fs.createWriteStream(outputFile);
    
    const zipArchiver = archiver('zip', {
      zlib: { level: this.level }
    }).on('warning', (err) => logger.warn(err))
      .on('error', (err) => { throw err });

    zipArchiver.pipe(output);

    let count = await this.zipTo(zipArchiver, this.codeUri);
    
    if (this.includes) {
      for (const include of this.includes) {
        const c = await this.zipTo(zipArchiver, include);
      }
    }
  
    return await new Promise((resolve, reject) => {
      let bar: ProgressService;
      zipArchiver.on('progress', (processOptions) => {
        if (!bar) {
          bar = new ProgressService(
            ProgressType.Bar,
            { total: _.get(processOptions, 'fs.totalBytes') },
            `Zipping ((:bar)) :current/:total(Bytes) :percent :etas`,
          );
        }
        bar.update(_.get(processOptions, 'fs.processedBytes'));
      });
      output.on('close', () => {
        const compressedSize = zipArchiver.pointer();
        logger.debug('Package complete.');
        resolve({ count, compressedSize, outputFile });
      });

      try {
        zipArchiver.finalize();
      } catch (err) {
        reject(err);
      }
    });
  }

  private async zipTo(zipArchiver: archiver.Archiver, codeUri: string): Promise<number>{
    const absCodeUri = path.resolve(codeUri);
    const fsStat = fs.statSync(codeUri);

    // 如果是文件，简单处理单个文件
    if (fsStat.isFile()) {
      const isBootstrap = this.isBootstrapPath(absCodeUri, path.dirname(absCodeUri));
      zipArchiver.file(absCodeUri, {
        prefix: this.prefix,
        name: path.basename(codeUri),
        mode: isBootstrap ? fsStat.mode | 73 : fsStat.mode,
      });
      return 1;
    }

    const zipFiles = ignoreWalk.sync({
      ignoreFiles: this.ignoreFiles,
      path: codeUri,
      includeEmpty: true,
    });

    const filesPromise = zipFiles.map(async (f: string) => {
      const fPath = path.join(codeUri, f);
      let s;
      try {
        s = await fs.lstat(fPath);
      } catch (error) {
        logger.log(
          `Before zip: could not found fPath ${fPath}, absolute fPath is ${path.resolve(
            fPath,
          )}, exception is ${error}, skipping`,
        );
        return 0;
      }

      const absFilePath = path.resolve(fPath);
      const relative = path.relative(absCodeUri, absFilePath);

      const isBootstrap = this.isBootstrapPath(absFilePath, absCodeUri);

      if (s.size === 1067) {
        const content: any = await this.readLines(fPath);
        if (content[0] === 'XSym' && content.length === 5) {
          const target = content[3];
          zipArchiver.symlink(relative, target, (isBootstrap || isWindows) ? s.mode | 73 : s.mode);
          return 1;
        }
      }

      zipArchiver.file(fPath, {
        prefix: this.prefix,
        name: relative,
        mode: isBootstrap || isWindows ? s.mode | 73 : s.mode,
        stats: s, // The archiver uses fs.stat by default, and pasing the result of lstat to ensure that the symbolic link is properly packaged
      });

      return 1;
    });

    // TODO: 可能需要控制运行的个数
    await Promise.all(filesPromise);

    return zipFiles.length;
  }

  private isBootstrapPath(absFilePath: string, absBootstrapDir: string) {
    return path.join(absBootstrapDir, 'bootstrap') === absFilePath;
  }

  private async readLines(fileName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const lines: any[] = [];
  
      readline
        .createInterface({ input: fs.createReadStream(fileName) })
        .on('line', (line) => lines.push(line))
        .on('close', () => resolve(lines))
        .on('error', reject);
    });
  }
}

export default async (options: IOptions): Promise<IResult> => {
  const zip = new Zip(options);
  return await zip.run();
};
