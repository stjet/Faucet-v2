const bananojs = require('bananojs');
const config = require("../config.js");

const rpc_url = config.banano.rpc

bananojs.setBananodeApiUrl(rpc_url);

let seed;
if (config.secrets.use_env) {
  seed = process.env.bn_seed;
} else {
  seed = config.secrets.bn_seed;
}

let blacklisted_addresses = config.blacklist.banano;

//amount is in whole banano, not raw. Eg: amount=4.2 sends 4.2 banano
async function send(address, amount) {
  try {
    let tx = await bananojs.sendBananoWithdrawalFromSeed(seed, 0, address, amount);
    return tx;
  } catch (e) {
    return false;
  }
}

async function get_account_history(address) {
  let account_history = await bananojs.getAccountHistory(address, -1);
  return account_history.history;
}

//precision to 2 digits, round down (floor)
async function check_bal(address) {
  let raw_bal = await bananojs.getAccountBalanceRaw(address);
  let bal_parts = await bananojs.getBananoPartsFromRaw(raw_bal);
  return Number(bal_parts.banano)+Number(bal_parts.banoshi)/100;
}

async function dry() {
  let bal = await check_bal(config.banano.address);
  //future: make this relative to payouts
  if (Number(bal) < 1) {
    return true;
  }
  return false;
}

function address_related_to_blacklist(account_history) {
  if (account_history.history) {
    for (let i=0; i < account_history.history.length; i++) {
      if (account_history.history[i].type == "send" && blacklisted_addresses.includes(account_history.history[i].account)) {
        return true;
      }
    }
  }
  return false;
}

async function is_unopened(address, amount=-1) {
  let account_history = await bananojs.getAccountHistory(address, amount);
  if (account_history.history == '') {
    return true;
  }
  return false;
}
 
async function receive_deposits() {
  let rep = await bananojs.getAccountInfo(await bananojs.getBananoAccountFromSeed(seed, 0), true);
  rep = rep.representative;
  if (!rep) {
    //set self as rep if no other set rep
    await bananojs.receiveBananoDepositsForSeed(seed, 0, await bananojs.getBananoAccountFromSeed(seed, 0));
  }
  await bananojs.receiveBananoDepositsForSeed(seed, 0, rep);
}

async function is_valid(address) {
  return await bananojs.getBananoAccountValidationInfo(address).valid;
}

//Following functions are related to get_score function. return score where higher number means high suspicion. this is only to strain out suspicious addresses from a mass of addresses. a high number does not mean an address is definitely a bot/cheating account and vice versa.
async function account_creation(account_history) {
  let current_time = Math.round(new Date().getTime()/1000);
  //3500 is the maximum amount of transactions the lib will return. If more or equal to 3500, we dont know the true age, but its probably old
  if (account_history.length >= 3500) {
    return false;
  }
  let account_creation = Number(account_history[account_history.length-1].local_timestamp);
  return current_time-account_creation;
}

async function is_funneling(account_history) {
  //account_history = account_history.slice(0,100);
  let sent_to = {};
  for (let i=0; i < account_history.length; i++) {
    if (account_history[i].type == "send" && !blacklisted_addresses.includes(account_history[i].account)) {
      if (sent_to[account_history[i].account]) {
        sent_to[account_history[i].account] += 1;
      } else {
        sent_to[account_history[i].account] = 1;
      }
    }
  }
  let funneling = 0;
  for (i=0; i < Object.keys(sent_to).length; i++) {
    if (sent_to[Object.keys(sent_to)[i]] > 4) {
      funneling += 1;
    }
  }
  if (funneling == 0) {
    return false
  } else {
    return true
  }
}

async function get_score(address) {
  let score = 0;
  let account_history = await get_account_history(address, 500);
  let unopened = await is_unopened(address);
  if (await is_unopened(address)) {
    score += 4;
    return score;
  } else {
    let creation = await account_creation(account_history);
    if (creation) {
      if (creation < 60*60*24*7) {
        score += 3;
      }
    }
  }
  if (address_related_to_blacklist(account_history)) {
    score += 10;
  }
  let balance = await check_bal(address);
  if (balance < 0.1) {
    score += 3;
  } else if (balance < 1) {
    score += 1;
  }
  let funneling = await is_funneling(account_history);
  if (funneling) {
    score += 3;
  }
  let ratioBalanceHistory = balance/account_history.length;
  if (ratioBalanceHistory < 1/4) {
    score += 4;
  }
  return score;
}

module.exports = {
  send: send,
  dry: dry,
  check_bal: check_bal,
  receive_deposits: receive_deposits,
  address_related_to_blacklist: address_related_to_blacklist,
  is_unopened: is_unopened,
  get_account_history: get_account_history,
  is_valid: is_valid,
  get_score: get_score
}