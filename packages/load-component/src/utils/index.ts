import path from 'path';
import fs from 'fs-extra';
import { get, includes, find, split, filter, set, isEmpty } from 'lodash';
import axios from 'axios';
import { getRootHome } from '@serverless-devs/utils';

const debug = require('@serverless-cd/debug')('serverless-devs:load-component');


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
        debug('load component success')
        return componentInstance;
    } catch (error) {
        debug('load component error', error)
        return ChildComponent;
    }
}



export function getProvider(name: string) {
    const [provider, component] = includes(name, '/') ? split(name, '/') : [null, name];
    const [componentName, componentVersion] = split(component, '@');
    const { core_load_serverless_devs_component } = process.env;
    if (core_load_serverless_devs_component) {
        const componentList = filter(split(core_load_serverless_devs_component, ';'), (v) => includes(v, '@'));
        const componentNames = [];
        const obj: any = {};
        for (const item of componentList) {
            const [n, v] = split(item, '@');
            componentNames.push(n);
            obj[n] = v;
        }
        const key = provider ? `${provider}/${componentName}` : componentName;
        if (find(componentNames, (v) => v === key)) {
            return [provider, componentName, obj[key]];
        }
    }
    return [provider, componentName, componentVersion];
}

export const getZipballUrl = async (provider: string, componentName: string, componentVersion: string) => {
    const base = provider ? `http://registry.devsapp.cn/simple/${provider}/${componentName}/releases` : `http://registry.devsapp.cn/simple/${componentName}/releases`;
    const url = componentVersion ? base : `${base}/latest`;
    debug(`url: ${url}`);
    const response = await axios.get(url);
    const data = get(response, 'data.Response');
    let zipball_url = get(data, 'zipball_url');
    if (componentVersion) {
        const obj = find(data, (v) => v.tag_name === componentVersion);
        zipball_url = get(obj, 'zipball_url');
    }
    if (isEmpty(zipball_url)) throw new Error(`url: ${url} is not found`);
    return zipball_url;
}

export const getComponentCachePath = (provider: string, componentName: string, componentVersion: string) => {
    if (provider) {
        return path.join(getRootHome(), 'components', 'devsapp.cn', provider, componentVersion ? `${componentName}@${componentVersion}` : componentName)

    }
    return path.join(getRootHome(), 'components', 'devsapp.cn', componentVersion ? `${componentName}@${componentVersion}` : componentName)

};

export const getLockFile = (basePath: string) => path.join(basePath, '.s.lock');