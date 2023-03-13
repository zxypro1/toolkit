const isChinaUser = () =>
  new Intl.DateTimeFormat('en', { timeZoneName: 'long' }).format().includes('China Standard Time');

export default isChinaUser;
