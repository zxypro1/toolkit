import getCurrentEnvironment from "./get-current-environment";

function getUserAgent({ component, componentVersion }: { component?: string; componentVersion?: string }) {
    const devsVersion = process.env['serverless_devs_version'] ? `S3:${process.env['serverless_devs_version']};` : '';
    const getComponent = () => component ? `Component:${component};ComponentVersion:${componentVersion};` : '';
    return `${devsVersion}${getComponent()}Env:${getCurrentEnvironment()};Nodejs:${process.version};OS:${process.platform}-${process.arch};`
}

export default getUserAgent;



