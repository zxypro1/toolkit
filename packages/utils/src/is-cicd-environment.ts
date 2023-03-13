import getCurrentEnvironment from './get-current-environment';

const isCiCdEnvironment = () =>
  ['app_center', 'cloud_shell', 'yunxiao', 'github', 'gitlab', 'jenkins'].includes(
    getCurrentEnvironment(),
  );

export default isCiCdEnvironment;
