const nanojs = require('nanojs');

async function set_rpc(url) {
  nanojs.setBananodeApiUrl(url);
}

async function set_auth(key) {
  nanojs.setAuth(key);
}

// Amount is in whole nano, not raw. I.e. 'amount = 4.2' sends 4.2 XNO
async function send(seed, address, amount) {
  try {
    const tx = await nanojs.sendNanoWithdrawalFromSeed(seed, 0, address, amount);
    return tx;
  } catch (error) {
    return false;
  }
}

async function get_account_history(address, amount = -1) {
  try {
    const account_history = await nanojs.getAccountHistory(address, amount);
    return account_history.history;
  } catch (error) {
    return false;
  }
}

// Precision to 2 digits, round down (floor)
async function check_bal(address) {
  let raw_bal = await nanojs.getAccountBalanceRaw(address);
  let bal_parts = await nanojs.getNanoPartsFromRaw(raw_bal);
  return Number(bal_parts.nano) + Number(bal_parts.nanoshi) / 1000000;
}

async function dry(address) {
  let bal = await check_bal(address);
  // TODO: Make this relative to payouts
  if (Number(bal) < 0.1) return true;
  else return false;
}

async function is_unopened(address, amount = -1) {
  let account_history = await nanojs.getAccountHistory(address, amount);
  if (account_history.history == '') return true;
  else return false;
}

async function receive_deposits(seed) {
  let rep = await nanojs.getAccountInfo(await nanojs.getNanoAccountFromSeed(seed, 0), true);
  // Set self as rep if no other set rep
  if (!rep?.representative) await nanojs.receiveNanoDepositsForSeed(process.env.seed, 0, await nanojs.getNanoAccountFromSeed(process.env.seed, 0));
  await nanojs.receiveNanoDepositsForSeed(process.env.seed, 0, rep);
}

function is_valid(address) {
  return nanojs.getNanoAccountValidationInfo(address).valid;
}

module.exports = {
  set_rpc: set_rpc,
  set_auth: set_auth,
  send: send,
  dry: dry,
  check_bal: check_bal,
  receive_deposits: receive_deposits,
  is_unopened: is_unopened,
  get_account_history: get_account_history,
  is_valid: is_valid,
};
