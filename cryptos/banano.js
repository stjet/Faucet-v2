const bananojs = require('bananojs');

async function set_rpc(url) {
  bananojs.setBananodeApiUrl(url);
}

// Amount is in whole banano, not raw. I.e. 'amount = 4.2' sends 4.2 BAN
async function send(seed, address, amount) {
  try {
    const tx = await bananojs.sendBananoWithdrawalFromSeed(seed, 0, address, amount);
    return tx;
  } catch (error) {
    return false;
  }
}

async function get_account_history(address, amount = -1) {
  try {
    const account_history = await bananojs.getAccountHistory(address, amount);
    if (account_history.history) return account_history.history;
    // False means unopened account
    else return false;
  } catch (error) {
    return false;
  }
}

// Precision to 2 digits, round down (floor)
async function check_bal(address) {
  let raw_bal = await bananojs.getAccountBalanceRaw(address);
  let bal_parts = await bananojs.getBananoPartsFromRaw(raw_bal);
  return Number(bal_parts.banano) + Number(bal_parts.banoshi) / 100;
}

async function dry(address) {
  let bal = await check_bal(address);
  // TODO: Make this relative to payouts
  if (Number(bal) < 1) return true;
  else return false;
}

async function is_unopened(address, amount = -1) {
  let account_history = await bananojs.getAccountHistory(address, amount);
  if (!account_history.history) return true;
  else return false;
}

async function receive_deposits(seed) {
  const account = await bananojs.getBananoAccountFromSeed(seed, 0);
  const rep = await bananojs.getAccountInfo(account, true);
  await bananojs.receiveBananoDepositsForSeed(seed, 0, rep.representative ?? account);
}

function is_valid(address) {
  return bananojs.getBananoAccountValidationInfo(address).valid;
}

module.exports = {
  set_rpc: set_rpc,
  send: send,
  dry: dry,
  check_bal: check_bal,
  receive_deposits: receive_deposits,
  is_unopened: is_unopened,
  get_account_history: get_account_history,
  is_valid: is_valid,
};
