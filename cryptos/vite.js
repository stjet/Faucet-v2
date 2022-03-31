const vite = require('@vite/vitejs');
const { HTTP_RPC } = require('@vite/vitejs-http');
const config = require("./config.js");

//https://docs.vite.org/vite-docs/vite.js/
//https://docs.vite.org/vite-docs/vite.js/accountBlock/createAccountBlock.html
//https://docs.vite.org/vite-docs/api/rpc/ledger_v2.html#

let privKey;
if (config.secrets.use_env) {
  privKey = process.env.privateKey;
} else {
  privKey = config.secrets.privateKey;
}

//send both VITC token and VITE
//token can be undefined
let token_id = config.vite.token.id;
let token_amount = config.vite.token.amount;
let faucet_address = config.vite.address;
//if true, facuet will work with token only if there is no supply of VITE
let token_only = config.vite.optional;

//set provider
const rpc_url = config.vite.rpc;

let provider = new HTTP_RPC(rpc_url);

async function check_bal(address) {
  //ledger_getAccountInfoByAddress
  let resp = await provider.request('ledger_getAccountInfoByAddress', address);
  //this is vite
  return [resp.balanceInfoMap['tti_5649544520544f4b454e6e40'].balance, resp.balanceInfoMap[token_id].balance];
}

async function dry() {
  let dry_info = {
    token: false,
    coin: false
  }
  let bal = await check_bal(faucet_address);
  if (bal[0] < 1) {
    dry_info.coin = true;
  }
  if (bal[1] < 1) {
    dry_info.token = true;
  }
  return dry_info
}


async function get_account_history(address) {
  let resp = await provider.request('ledger_getAccountBlocks', address, null, null, 1500);
  return resp.result;
}

async function is_unopened(address) {
  if (Object.keys(await get_account_history(address)).length == 0) {
    return true;
  }
  return false;
}

async function send(address, amount, send_vite=true, send_token=true) {
  //createAccountBlock
  //ledger_sendRawTransaction
  //send vite
  //CONVERT AMOUNTS TO RAW (no decimals)
  if (send_vite) {
    let vite_send = vite.accountBlock.createAccountBlock('send', {
      address: faucet_address,
      toAddress: address,
      tokenId: 'tti_5649544520544f4b454e6e40',
      amount: String(amount*(10**-18)),
      data: ''
    });
    vite_send.setProvider(provider).setPrivateKey(privKey);
    await vite_send.autoSetPreviousAccountBlock();
    let result = await vite_send.sign().send();
    //how to see success? not sure
  }
  //send token
  if (send_token) {
    let token_send = vite.accountBlock.createAccountBlock('send', {
      address: faucet_address,
      toAddress: address,
      tokenId: token_id,
      amount: String(token_amount*(10**-18)),
      data: ''
    });
    token_send.setProvider(provider).setPrivateKey(privKey);
    await token_send.autoSetPreviousAccountBlock();
    let result = await token_send.sign().send();
    //how to see success? not sure
  }
  return true;
}

module.exports = {
  send: send,
  dry: dry,
  check_bal: check_bal,
  get_account_history: get_account_history,
  is_unopened: is_unopened
}