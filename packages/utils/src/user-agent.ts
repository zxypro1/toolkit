import { get, split } from 'lodash';
import { execSync } from 'child_process';

function getCurrentEnvironment() {
    const Environment = {
        AppCenter: 'app_center',
        ServerlessCD: 'serverless_cd',
        ServerlessDevsCICD: 'serverless_devs_cicd',
        CloudShell: 'cloud_shell',
        Yunxiao: 'yunxiao',
        Github: 'github',
        Gitlab: 'gitlab',
        Jenkins: 'jenkins',
    };
    if (process.env.BUILD_IMAGE_ENV === 'fc-backend') {
        return Environment.AppCenter;
    }
    // eslint-disable-next-line guard-for-in
    for (const key in process.env) {
        if (key === 'SERVERLESS_CD') return Environment.ServerlessCD;
        if (key === 'SERVERLESS_DEVS_CICD') return Environment.ServerlessDevsCICD;
        if (key.startsWith('CLOUDSHELL')) return Environment.CloudShell;
        if (key.startsWith('PIPELINE')) return Environment.Yunxiao;
        if (key.startsWith('GITHUB')) return Environment.Github;
        if (key.startsWith('GITLAB')) return Environment.Gitlab;
        if (key.startsWith('JENKINS')) return Environment.Jenkins;
    }
    return '';
}

export function getUserAgent({ component, componentVersion }: { component?: string; componentVersion?: string }) {
    let devsVersion = '';
    try {
        const sVersion = execSync('s -v');
        devsVersion = get(split(get(split(sVersion.toString(), ','), 0), ':'), 1);
    } catch (e) {
        // ignore exception
    }
    const getDevsVersion = () => devsVersion ? `S:${devsVersion};` : '';
    const getComponent = () => component ? `Component:${component};ComponentVersion:${componentVersion};` : '';

    return `${getDevsVersion()}${getComponent()}Env:${getCurrentEnvironment()};Nodejs:${process.version};OS:${process.platform}-${process.arch};`
}



