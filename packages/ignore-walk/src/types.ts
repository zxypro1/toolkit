
export interface IOptions {
   /**
   * root dir to start in.
   *
   * @default process.cwd()
   */
   path?: string;
   /**
   * list of filenames.
   *
   * @default ['.signore']
   */
   ignoreFiles?: string[];
   /**
   * true to include empty dirs
   *
   * @default false
   */
   includeEmpty?: boolean;
   /**
   * true to follow symlink dirs
   *
   * @default false
   */
   follow?: boolean;
   /**
   * set to true if this.path is a symlink, whether follow is true or not
   *
   */
   isSymbolicLink?: boolean;
}
