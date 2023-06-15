import * as utils from '@serverless-devs/utils';


const use3version = (filePath: string) => {
    const res = utils.getYamlContent(filePath);
    return String(res.edition) === '3.0.0'
}

export default use3version;
