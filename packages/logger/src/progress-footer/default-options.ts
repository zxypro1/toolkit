import { IFormatOptions, IMateValue, IShowList } from './types';
import { blackBright, green, greenBright } from 'chalk';
import cliSpinners from 'cli-spinners';
import { get } from 'lodash';

const spinner = cliSpinners.fistBump;

export default {
  format: (showList: IShowList, options: IFormatOptions): string[] => {
    const frames = get(options, 'frames', spinner.frames);
    const framesLength = frames.length;

    const show: string[] = [];
    showList.forEach((value: IMateValue, key: string) => {
      const { timer, message } = value;
      const runTime = Math.floor((new Date().getTime() - timer) / 1000);
      const frameIndex = runTime % framesLength;

      const showMessage = `${blackBright(key)} ${frames[frameIndex]} ${green(`${runTime}s`)}
    ${greenBright(message)}`;

      show.push(showMessage);
    });

    return show;
  },
  spinner,
  openRefresh: true,
};
