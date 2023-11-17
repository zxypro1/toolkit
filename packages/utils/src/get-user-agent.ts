import getCurrentEnvironment from "./get-current-environment";

interface IUserAgent {
    component?: string;
}

function getUserAgent(options: IUserAgent = {}) {
    const devsVersion = process.env['serverless_devs_version'] ? `S3:${process.env['serverless_devs_version']};` : '';
    const component = options.component ? `Component:${options.component};` : '';
    return `${devsVersion}${component}Env:${getCurrentEnvironment()};Nodejs:${process.version};OS:${process.platform}-${process.arch};`
}

export default getUserAgent;



