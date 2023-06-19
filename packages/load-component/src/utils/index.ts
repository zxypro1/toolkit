import path from 'path';
import fs from 'fs-extra';
import { get } from 'lodash';

export function readJsonFile(filePath: string) {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        try {
            return JSON.parse(data);
        } catch (error) { }
    }
}

const getEntryFile = async (componentPath: string) => {
    const fsStat = await fs.stat(componentPath);
    if (fsStat.isFile() || !fsStat.isDirectory()) return componentPath;
    const packageInfo: any = readJsonFile(path.resolve(componentPath, 'package.json'));
    // First look for main under the package json file
    let entry = get(packageInfo, 'main');
    if (entry) return path.resolve(componentPath, entry);
    // Second check the out dir under the tsconfig json file
    const tsconfigPath = path.resolve(componentPath, 'tsconfig.json');
    const tsconfigInfo = readJsonFile(tsconfigPath);
    entry = get(tsconfigInfo, 'compilerOptions.outDir');
    if (entry) return path.resolve(componentPath, entry);
    // Third look for src index js
    const srcIndexPath = path.resolve(componentPath, './src/index.js');
    if (fs.existsSync(srcIndexPath)) return srcIndexPath;
    const indexPath = path.resolve(componentPath, './index.js');
    if (fs.existsSync(indexPath)) return indexPath;
    throw new Error('The component cannot be required. Please check whether the setting of the component entry file is correct. In the current directory, first look for main under the package json file, secondly look for compiler options out dir under the tsconfig json file, thirdly look for src index js, and finally look for index js');
}

export const buildComponentInstance = async (componentPath: string, params?: any) => {
    const requirePath = await getEntryFile(componentPath);
    const baseChildComponent = await require(requirePath);

    const ChildComponent = baseChildComponent.default || baseChildComponent;
    try {
        const componentInstance = new ChildComponent(params);
        if (componentInstance) {
            componentInstance.__path = componentPath;
        }
        return componentInstance;
    } catch (error) {
        return ChildComponent;
    }
}