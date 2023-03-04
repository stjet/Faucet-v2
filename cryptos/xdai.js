const { ethers } = require('ethers');
const fetch = require('node-fetch');

let provider, wallet;

const set_rpc = (url) => (provider = new ethers.providers.JsonRpcProvider(url));
const connect = (private_key) => (wallet = new ethers.Wallet(private_key).connect(provider));

const erc20_abi = [{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];

async function send(address, amount, options) {
  let txs = {};
  if (options.send_xdai) {
    try {
      let trans = await wallet.sendTransaction({
        to: address.toLowerCase(),
        value: ethers.utils.parseEther(String(amount)),
      });
      txs["coin"] = trans.hash;
    } catch (error) {
      return false;
    }
  }
  if (options.send_token) {
    let token = new ethers.Contract(options.token_contract_address, erc20_abi, wallet);

    // Assumes 18 decimal places, the standard for tokens, unless token decimals are specified
    options.token_amount = ethers.utils.parseUnits(String(options.token_amount), options.token_decimals ? options.token_decimals : 18);
    try {
      let trans = await token.transfer(address, options.token_amount);
      txs["token"] = trans.hash;
    } catch (error) {
      if (!options.xdai_send) return false;
      //don't want to return fail if xdai send succeeded but token send didn't
    }
  }
  return txs;
}

async function check_bal(address, check_token = false, token_contract_address = undefined, token_decimals = 18) {
  let re = [];
  re.push(ethers.utils.formatEther(await provider.getBalance(address)));
  if (check_token) {
    let re = [];
    let token = new ethers.Contract(token_contract_address, erc20_abi, wallet);
    re.push(Math.floor(ethers.utils.formatUnits(await token.balanceOf(address), token_decimals)));
  } else {
    re.push(0);
  }
  return re;
}

async function dry(address, check_token = false, contract_address = undefined, token_decimals = 18) {
  let dry_info = { token: false, coin: false };
  let bal = await check_bal(address, check_token, contract_address, token_decimals);
  if (bal[0] < 0.02) dry_info.coin = true;
  if (bal[1] !== false && bal[1] <= 0) dry_info.token = true;
  return dry_info;
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
