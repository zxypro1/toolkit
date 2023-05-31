
export interface IOptions {
   /**
   * 代码包路径
   */
   codeUri: string;
   /**
   * 代码包忽略声明文件名称
   * 
   * @default ['.signore']
   */
   ignoreFiles?: string[];
   /**
   * 额外的压缩代码目录
   */
   includes?: string[];
   /**
   * 压缩文件输出目录
   * 
   * @default process.cwd()
   */
   outputFilePath?: string;
   /**
   * 压缩文件输出名称
   * 
   * @default `${Date.now()}.zip`
   */
   outputFileName?: string;
   /**
   * 压缩级别
   * 
   * @default 9
   */
   level?: number;
   /**
   * 新增压缩目录前缀
   * 
   */
   prefix?: string;
}

export interface IResult {
   /**
   * 被压缩的文件个数
   */
   count: number;
   /**
   * 生成文件的大小
   */
   compressedSize: number;
   /**
   * 生成文件的本地地址
   */
   outputFile: string;
}
