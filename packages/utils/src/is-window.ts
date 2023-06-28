import os from 'os';

const isWindow = () => os.platform() === 'win32';

export default isWindow;
