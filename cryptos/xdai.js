const { ethers } = require("ethers");
const config = require("../config.js");
const fetch = require('node-fetch');

const rpc_url = config.xdai.rpc;

const provider = new ethers.providers.JsonRpcProvider(rpc_url);
const signer = provider.getSigner();

const privkey;
if (config.secrets.use_env) {
  privkey = process.env.eth_privkey;
} else {
  privkey = config.secrets.eth_privkey;
}

let wallet = new ethers.Wallet(privkey);
wallet = wallet.connect(provider);

async function send(address, amount) {
  let transaction = {
    to: address.toLowerCase(),
    value: ethers.utils.parseEther(amount),
  };
  try {
    wallet.sendTransaction(transaction)
    return true
  } catch (e) {
    console.log(e)
    return false
  }
}

async function check_bal(address) {
  return ethers.utils.formatEther(await provider.getBalance(address));
}

async function dry(address) {
  if (Number(await check_bal(address)) > 0.06) {
    return false;
  }
  return true;
}

async function get_account_history(address) {
  //only get most recent 500
  let resp = await fetch("https://blockscout.com/xdai/mainnet/api?module=account&action=txlist&offset=500&page=1&address="+address, {method: "GET"});
  resp = await resp.json();
  return resp.result;
}

async function is_unopened(address) {
  if (get_account_history(address).length == 0) {
    return true;
  }
  return false;
}

function address_related_to_blacklist(account_history, blacklisted_addresses) {
  for (let i=0; i < account_history.length; i++) {
    if (blacklisted_addresses.includes(account_history[i].to)) {
      return true
    }
  }
  return false
}

/*token stuff
const token_contract_address = "";
const token_abi = [];
let token = new ethers.Contract(token_contract_addr, token_abi, wallet);
async function send_token(address, amount) {
  //assumes 18 decimal places, the standard for tokens. Change it if the amount of places is different
  amount = ethers.utils.parseUnits(amount, 18);
  return await token.transfer(addr, amount);
}
*/

module.exports = {
  dry: dry,
  check_bal: check_bal,
  send: send,
  address_related_to_blacklist: address_related_to_blacklist,
  is_unopened: is_unopened,
  get_account_history: get_account_history
}