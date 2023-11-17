import getCurrentEnvironment from "./get-current-environment";

function getUserAgent({ component = '' }: { component: string; }) {
    const devsVersion = process.env['serverless_devs_version'] ? `S3:${process.env['serverless_devs_version']};` : '';
    return `${devsVersion}Component:${component};Env:${getCurrentEnvironment()};Nodejs:${process.version};OS:${process.platform}-${process.arch};`
}

export default getUserAgent;



