import * as fs from 'fs';

const readJson = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      return {};
    }
  }
  return {};
};

export default readJson;
