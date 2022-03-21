const nanojs = require('nanojs');
const config = require("./config.js");

const rpc_url = config.nano.rpc

nanojs.setBananodeApiUrl(rpc_url);

if (config.nano.auth) {
  nanojs.setAuth(config.nano.auth)
}

const seed;
if (config.secrets.use_env) {
  seed = process.env.bn_seed;
} else {
  seed = config.secrets.bn_seed;
}

//amount is in whole nano, not raw. Eg: amount=4.2 sends 4.2 nano
async function send(address, amount) {
  try {
    await nanojs.sendNanoWithdrawalFromSeed(seed, 0, address, amount);
    return true;
  } catch (e) {
    return false;
  }
}

async function get_account_history(address) {
  return await nanojs.getAccountHistory(address, -1);
}

//precision to 2 digits, round down (floor)
async function check_bal(address) {
  let raw_bal = await nanojs.getAccountBalanceRaw(address);
  let bal_parts = await nanojs.getNanoPartsFromRaw(raw_bal);
  return bal_parts.nano+(bal_parts.nanoshi/100)
}

async function dry() {
  let bal = await check_bal(config.nano.address);
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
  let account_history = await nanojs.getAccountHistory(address, -1);
  if (account_history.history == '') {
    return true;
  }
  return false;
}
 
async function receive_deposits() {
  let rep = await nanojs.getAccountInfo(await nanojs.getNanoAccountFromSeed(process.env.seed, 0), true);
  rep = rep.representative;
  if (!rep) {
    //set self as rep if no other set rep
    await nanojs.receiveNanoDepositsForSeed(process.env.seed, 0, await nanojs.getNanoAccountFromSeed(process.env.seed, 0));
  }
  await nanojs.receiveNanoDepositsForSeed(process.env.seed, 0, rep);
}

async function is_valid(address) {
  return await nanojs.getNanoAccountValidationInfo(address).valid;
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