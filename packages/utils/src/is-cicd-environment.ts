import getCurrentEnvironment from './get-current-environment';
import { Environment } from './constants';

const isCiCdEnvironment = () => Object.values(Environment).includes(getCurrentEnvironment());

export default isCiCdEnvironment;
