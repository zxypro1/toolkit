import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

export const getAbsolutePath = (filePath: string = '', basePath: string = process.cwd()) => {
    if (!filePath) return filePath;
    return path.isAbsolute(filePath) ? filePath : path.join(basePath, filePath);
}


export function getYamlPath(filePath: string) {
    const parse = path.parse(filePath);
    const newPath = path.join(parse.dir, parse.name);

    const yamlPath = newPath + '.yaml'
    if (fs.existsSync(yamlPath)) return yamlPath;

    const ymlPath = newPath + '.yml'
    if (fs.existsSync(ymlPath)) return ymlPath;
}

export default function getYamlContent(filePath: string): Record<string, any> {
    const yamlPath = getYamlPath(filePath);
    const arr = ['.yaml', '.yml'];
    if (!arr.includes(path.extname(filePath))) {
        throw new Error(`${filePath} file should be yaml or yml file.`);
    }
    if (yamlPath) {
        try {
            return yaml.load(fs.readFileSync(filePath, 'utf8')) as Record<string, any>;
        } catch (e) {
            const error = e as Error;
            const filename = path.basename(filePath);
            let message = `${filename} format is incorrect`;
            if (error.message) message += `: ${error.message}`;
            throw new Error(
                JSON.stringify({
                    message,
                    tips: `Please check the configuration of ${filename}, Serverless Devs' Yaml specification document can refer to：'https://github.com/Serverless-Devs/Serverless-Devs/blob/master/docs/zh/yaml.md'`,
                }),
            );
        }
    }
    return {}
}
