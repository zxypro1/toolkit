import { Environment } from './constants';

const getCurrentEnvironment = () => {
  if (process.env.HOME === '/kaniko' && process.env.BUILD_IMAGE_ENV === 'fc-backend') {
    return Environment.AppCenter;
  }

  for (const key in process.env) {
    if (key === 'SERVERLESS_CD') return Environment.ServerlessCD;
    if (key.startsWith('CLOUDSHELL')) return Environment.CloudShell;
    if (key.startsWith('PIPELINE')) return Environment.Yunxiao;
    if (key.startsWith('GITHUB')) return Environment.Github;
    if (key.startsWith('GITLAB')) return Environment.Gitlab;
    if (key.startsWith('JENKINS')) return Environment.Jenkins;
  }
  return process.platform;
};

export default getCurrentEnvironment;
