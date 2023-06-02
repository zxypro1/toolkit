export default {
  format: (showList: Map<number | string, string>): string[] => {
    const show: string[] = [];

    showList.forEach((value, key) => {
      show.push(`${key}\n\t${value}`);
    });

    return show;
  },
  fps: 100,
  openRefresh: true,
};