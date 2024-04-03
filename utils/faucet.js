const config = require('../config.js');
const mongo = require('./mongo.js');

let db = mongo.getDb();

// Separate collections for each currency
let collections = {};
db.then((db) => {
  // Check what currencies are supported, and get a collection for each one
  let enabled_coins = config.enabled_coins;
  for (let i = 0; i < enabled_coins.length; i++) {
    collections[enabled_coins[i]] = db.collection(enabled_coins[i]);
  }
});

async function insert(address, last_claim, coin) {
  await collections[coin].insertOne({ address: address, last_claim: last_claim });
}

async function replace(address, new_last_claim, coin) {
  await collections[coin].replaceOne({ address: address }, { address: address, last_claim: new_last_claim });
}

async function find(address, coin) {
  return await collections[coin].findOne({ address: address });
}

async function count(query, coin) {
  return await collections[coin].count(query);
}

async function add_to_db(address, coin) {
  let address_info = await find(address, coin);

  if (!address_info) await insert(address, Date.now(), coin);
  else await replace(address, Date.now(), coin);
}

async function claim_too_soon_db(address, coin) {
  let address_info = await find(address, coin);

  if (!address_info) return false;
  if (Date.now() > address_info.last_claim + config[coin].claim_frequency) return false;
  else return true;
}

function add_to_cookies(res, coin) {
  res.cookie('last_claim_' + coin, String(Date.now()));
}

async function claim_too_soon_cookies(req_cookies, coin) {
  if (!req_cookies['last_claim_' + coin]) return false;
  if (Date.now() > Number(req_cookies['last_claim_' + coin]) + config[coin].claim_frequency) return false;
  else return true;
}

function count_decimals(number) {
  number = String(number);
  if (number.includes('.')) return number.split('.')[1].length;
  else return 0;
}

function calculate_payouts(config_payouts) {
  let payout;
  if (config_payouts.percentage) {
    // Fet faucet balance, multiply by percentage
    payout = current_bal * config_payouts.percentage;
    if (payout < config_payouts.min_payout) {
      payout = config_payouts.min_payout;
    } else if (payout > config_payouts.max_payout) {
      payout = config_payouts.max_payout;
    }
  } else {
    // Random payouts in between min and max
    // Ternary operator to get the highest amount of decimal places
    let decimals = count_decimals(config_payouts.max_payout) > count_decimals(config_payouts.min_payout) ? count_decimals(config_payouts.max_payout) : count_decimals(config_payouts.min_payout);
    // With decimal places, multiply and then random
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
  insert,
  replace,
  find,
  count,
  claim_too_soon_db,
  claim_too_soon_cookies,
  count_decimals,
  calculate_payouts,
  add_to_db,
  add_to_cookies,
};
