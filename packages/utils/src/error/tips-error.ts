class TipsError extends Error {
  code = 'TIPS';
  static code = 'TIPS';
  tips?: string;
  constructor(message: string, tips?: string) {
    super(message);
    this.tips = tips;
  }
}

export default TipsError;
