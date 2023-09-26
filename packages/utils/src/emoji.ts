import isWindow from "./is-window";

const emoji = (text: string, fallback?: string) => {
  if (isWindow()) {
    return fallback || '◆';
  }
  return `${text} `;
};

export default emoji;
