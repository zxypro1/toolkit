import { IMateValue, IShowList } from './types';
import { blackBright, greenBright } from 'chalk';

export default {
  format: (showList: IShowList): string[] => {
    const show: string[] = [];
    showList.forEach((value: IMateValue, key: string) => {
      const { message } = value;
      const showMessage = `${blackBright(key)} \n ${greenBright(message)}`;
      show.push(showMessage);
    });
    return show;
  },
};
