const bananojs = require('bananojs');
const config = require("./config.js");

const rpc_url = config.banano.rpc

bananojs.setBananodeApiUrl(rpc_url);

const seed;
if (config.secrets.use_env) {
  seed = process.env.bn_seed;
} else {
  seed = config.secrets.bn_seed;
}

//amount is in whole banano, not raw. Eg: amount=4.2 sends 4.2 banano
async function send(address, amount) {
  try {
    await bananojs.sendBananoWithdrawalFromSeed(seed, 0, address, amount);
    return true;
  } catch (e) {
    return false;
  }
}

async function get_account_history(address) {
  return await bananojs.getAccountHistory(address, -1);
}

//precision to 2 digits, round down (floor)
async function check_bal(address) {
  let raw_bal = await bananojs.getAccountBalanceRaw(address);
  let bal_parts = await bananojs.getBananoPartsFromRaw(raw_bal);
  return bal_parts.banano+(bal_parts.banoshi/100)
}

async function dry() {
  let bal = await check_bal(config.banano.address);
  //future: make this relative to payouts
  if (Number(bal) < 1) {
    return true;
  }
  return false;
}

function address_related_to_blacklist(account_history, blacklisted_addresses) {
  if (account_history.history) {
    for (let i=0; i < account_history.history.length; i++) {
      if (account_history.history[i].type == "send" && blacklisted_addresses.includes(account_history.history[i].account)) {
        return true;
      }
    }
  }
  return false;
}

async function is_unopened(address) {
  let account_history = await bananojs.getAccountHistory(address, -1);
  if (account_history.history == '') {
    return true;
  }
  return false;
}
 
async function receive_deposits() {
  let rep = await bananojs.getAccountInfo(await bananojs.getBananoAccountFromSeed(process.env.seed, 0), true);
  rep = rep.representative;
  if (!rep) {
    //set self as rep if no other set rep
    await bananojs.receiveBananoDepositsForSeed(process.env.seed, 0, await bananojs.getBananoAccountFromSeed(process.env.seed, 0));
  }
  await bananojs.receiveBananoDepositsForSeed(process.env.seed, 0, rep);
}

async function is_valid(address) {
  return await bananojs.getBananoAccountValidationInfo(address).valid;
}

module.exports = {
  send: send,
  dry: dry,
  check_bal: check_bal,
  receive_deposits: receive_deposits,
  address_related_to_blacklist: address_related_to_blacklist,
  is_unopened: is_unopened,
  get_account_history: get_account_history,
  is_valid: is_valid
}