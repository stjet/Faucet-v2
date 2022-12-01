const { ethers } = require('ethers');
const fetch = require('node-fetch');

let provider, wallet;

const set_rpc = (url) => (provider = new ethers.providers.JsonRpcProvider(url));
const connect = (private_key) => (wallet = new ethers.Wallet(private_key).connect(provider));

async function send(address, amount) {
  try {
    wallet.sendTransaction({
      to: address.toLowerCase(),
      value: ethers.utils.parseEther(String(amount)),
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function check_bal(address) {
  return ethers.utils.formatEther(await provider.getBalance(address));
}

async function dry(address) {
  if (Number(await check_bal(address, provider)) < 0.02) return true;
  else return false;
}

async function get_account_history(address) {
  // Only get most recent 500
  let resp = await fetch('https://blockscout.com/xdai/mainnet/api?module=account&action=txlist&offset=500&page=1&address=' + address, { method: 'GET' });
  resp = await resp.json();
  return resp.result;
}

async function is_unopened(address) {
  if (get_account_history(address).length == 0) return true;
  else return false;
}

function address_related_to_blacklist(account_history, blacklisted_addresses) {
  for (let i = 0; i < account_history.length; i++) {
    if (blacklisted_addresses.includes(account_history[i].to)) {
      return true;
    }
  }
  return false;
}

async function is_valid(address) {
  if (ethers.utils.isAddress(address)) return true;
  else return false;
}

async function send_token(address, amount, token_contract_address, token_abi = []) {
  let token = new ethers.Contract(token_contract_address, token_abi, wallet);

  // Assumes 18 decimal places, the standard for tokens. Change it if the amount of places is different
  amount = ethers.utils.parseUnits(amount, 18);
  return await token.transfer(address, amount);
}

module.exports = {
  set_rpc: set_rpc,
  connect: connect,
  send: send,
  dry: dry,
  check_bal: check_bal,
  address_related_to_blacklist: address_related_to_blacklist,
  is_unopened: is_unopened,
  get_account_history: get_account_history,
  is_valid: is_valid,
};
