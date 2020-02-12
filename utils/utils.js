const dateOptions = {
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', second: 'numeric',
  hour12: false
};

const currencyDate = () => new Intl.DateTimeFormat('pt-BR', dateOptions).format(new Date());

const log = msg => console.log(`${currencyDate()}:`, msg);

module.exports = log;
