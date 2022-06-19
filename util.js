const config = require('./config.js');
const mongo = require('./mongo.js');

// Returns the number of decimals in a number. If higher of equal to 1 returns -1.
function get_number_decimal_zeros(number) {
  return -Math.floor(Math.log10(number) + 1);
}

function truncate_to_decimals(number, decimals) {
  const calculateDecimals = Math.pow(10, decimals);
  return Math.trunc(number * calculateDecimals) / calculateDecimals;
}

function format_amount_decimals(amount) {
  if (amount >= 0.1) {
    return truncate_to_decimals(amount, 2);
  } else {
    return truncate_to_decimals(amount, get_number_decimal_zeros(amount) + 2);
  }
}

// Convert milliseconds to days, hours, and minutes, and then formats the result using a truth table.
function milliseconds_to_readable(milliseconds) {
  let diffDays = Math.floor(milliseconds / 86400000);
  let diffHrs = Math.floor((milliseconds % 86400000) / 3600000);
  let diffMins = Math.round(((milliseconds % 86400000) % 3600000) / 60000);
  const formatResult = (days, hours, minutes) => {
    // Without this it might display '23 hours and 60 minutes'.
    if (diffMins >= 60) {
      diffMins--;
    }
    // Singular and plural logic or false if 0.
    if (minutes == 0) {
      minutes = false;
    } else if (diffMins == 1) {
      minutes = `${diffMins} minute`;
    } else {
      minutes = `${diffMins} minutes`;
    }
    if (hours == 0) {
      hours = false;
    } else if (hours == 1) {
      hours = `${diffHrs} hour`;
    } else {
      hours = `${diffHrs} hours`;
    }
    if (days == 0) {
      days = false;
    } else if (days == 1) {
      days = `${diffDays} day`;
    } else {
      days = `${diffDays} days`;
    }
    // Truth table.
    if (days && hours && minutes) {
      return `${days}, ${hours} and ${minutes}`;
    }
    if (days && hours) {
      return `${days} and ${hours}`;
    }
    if (days && minutes) {
      return `${days} and ${minutes}`;
    }
    if (hours && minutes) {
      return `${hours} and ${minutes}`;
    }
    if (days) {
      return `${days}`;
    }
    if (hours) {
      return `${hours}`;
    }
    if (minutes) {
      return `${minutes}`;
    }
    if (!minutes && !hours && !days && diffMins < 1) {
      return `Less than one minute`;
    }
  };
  return formatResult(diffDays, diffHrs, diffMins);
}

let db = mongo.getDb();
// we want seperate collections for each currency
let collections = {};
db.then((db) => {
  // we want to see what currencies are supported, and get a collection for each one
  let enabled_coins = config.enabled_coins;
  for (let i = 0; i < enabled_coins.length; i++) {
    collections[enabled_coins[i]] = db.collection(enabled_coins[i]);
  }
});

async function insert(address, value, coin) {
  await collections[coin].insertOne({ address: address, value: value });
}

async function replace(address, newvalue, coin) {
  await collections[coin].replaceOne({ address: address }, { address: address, value: newvalue });
}

async function find(address, coin) {
  return await collections[coin].findOne({ address: address });
}

async function count(query, coin) {
  return await collections[coin].count(query);
}

async function add_to_db(address, coin) {
  let address_info = await find(address, coin);
  if (!address_info) {
    await insert(address, Date.now(), coin);
  } else {
    await replace(address, Date.now(), coin);
  }
}

async function claim_too_soon_db(address, coin) {
  let address_info = await find(address, coin);
  if (!address_info) {
    return false;
  }
  if (Date.now() > address_info.value + config[coin].claim_frequency) {
    return false;
  } else {
    return true;
  }
}

function add_to_cookies(res, coin) {
  res.cookie('last_claim_' + coin, String(Date.now()));
}

async function claim_too_soon_cookies(req_cookies, coin) {
  if (!req_cookies['last_claim_' + coin]) {
    return false;
  }
  if (Date.now() > Number(req_cookies['last_claim_' + coin]) + config[coin].claim_frequency) {
    return false;
  }
  return true;
}

function count_decimals(number) {
  number = String(number);
  if (number.includes('.')) {
    return number.split('.')[1].length;
  } else {
    return 0;
  }
}

function calculate_payouts(config_payouts) {
  let payout;
  if (config_payouts.percentage) {
    // get faucet balance, multiply by percentage
    payout = current_bal * config_payouts.percentage;
    if (payout < config_payouts.min_payout) {
      payout = config_payouts.min_payout;
    } else if (payout > config_payouts.max_payout) {
      payout = config_payouts.max_payout;
    }
  } else {
    // random payouts in between min and max
    // ternary operator to get the highest amount of decimal places
    let decimals = count_decimals(config_payouts.max_payout) > count_decimals(config_payouts.min_payout) ? count_decimals(config_payouts.max_payout) : count_decimals(config_payouts.min_payout);
    // with decimal places, multiply and then random
    if (decimals == 0) {
      payout = Math.floor(Math.random() * (config_payouts.max_payout - config_payouts.min_payout)) + config_payouts.min_payout;
    } else {
      let max_payout_shift = config_payouts.max_payout * 10 ** decimals;
      let min_payout_shift = config_payouts.min_payout * 10 ** decimals;
      payout = Math.floor(Math.random() * (max_payout_shift - min_payout_shift + 1)) + min_payout_shift;
      payout = payout / 10 ** decimals;
    }
    return payout;
  }
}

module.exports = {
  get_number_decimal_zeros: get_number_decimal_zeros,
  truncate_to_decimals: truncate_to_decimals,
  format_amount_decimals: format_amount_decimals,
  milliseconds_to_readable: milliseconds_to_readable,
  insert: insert,
  replace: replace,
  find: find,
  count: count,
  claim_too_soon_db: claim_too_soon_db,
  claim_too_soon_cookies: claim_too_soon_cookies,
  count_decimals: count_decimals,
  calculate_payouts: calculate_payouts,
  add_to_db: add_to_db,
  add_to_cookies: add_to_cookies,
};
