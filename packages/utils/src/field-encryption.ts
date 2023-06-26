export default (val: string): string => {
  if (!val || typeof val !== 'string') {
    return val;
  }

  const valLength = val.length;

  if (valLength > 8) {
    const prefix = val.slice(0, 3);
    const suffix = val.slice(valLength - 3, valLength);
    const encryption = '*'.repeat(valLength - 6);

    return `${prefix}${encryption}${suffix}`;
  }

  return new Array(valLength).fill('*').join('');
}