import { IMateValue } from "./types";
import { blackBright, green, greenBright } from 'chalk';

export default {
  format: (showList: Map<string, IMateValue>): string[] => {
    const show: string[] = [];

    showList.forEach((value: IMateValue, key: string) => {
      const { timer, message } = value;
      const runTime = Math.floor((new Date().getTime() - timer) / 1000);

      const showMessage = `${blackBright(key)} ${green(`${runTime}s`)}
    ${greenBright(message)}`;
  
      show.push(showMessage);
    });

    return show;
  },
  fps: 100,
  openRefresh: true,
};