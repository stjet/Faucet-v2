const vite = require('@vite/vitejs');
const { HTTP_RPC } = require('@vite/vitejs-http');
const config = require("../config.js");
const Big = require('big.js');

//https://docs.vite.org/vite-docs/vite.js/
//https://docs.vite.org/vite-docs/vite.js/accountBlock/createAccountBlock.html
//https://docs.vite.org/vite-docs/api/rpc/ledger_v2.html#

let privKey;
if (config.secrets.use_env) {
  privKey = process.env.vite_privkey;
} else {
  privKey = config.secrets.vite_privkey;
}

//send both VITC token and VITE
//token can be undefined
let token_id;
let token_amount;
let faucet_address = config.vite.address;
if (config.vite.token) {
  token_id = config.vite.token.id;
  token_amount = config.vite.token.amount;
}

//if true, facuet will work with token only if there is no supply of VITE
let token_only = config.vite.optional;

//set provider
const rpc_url = config.vite.rpc;

let provider = new vite.ViteAPI(new HTTP_RPC(rpc_url));

//auto receive
let receive = new vite.accountBlock.ReceiveAccountBlockTask({
  address: faucet_address,
  privateKey: privKey,
  provider: provider
});

async function check_bal(address) {
  //ledger_getAccountInfoByAddress
  let resp = await provider.request('ledger_getAccountInfoByAddress', address);
  //this is vite
  let token_resp = resp.balanceInfoMap?.[token_id]
  let vite_resp = resp.balanceInfoMap['tti_5649544520544f4b454e6e40'];
  if (config.vite.token) {
    let re = [];
    if (!vite_resp) {
      re.push(false);
    } else {
      re.push(vite_resp.balance*(10**-vite_resp.tokenInfo.decimals));
    }
    if (!token_resp) {
      re.push(false);
    } else {
      re.push(token_resp.balance*(10**-token_resp.tokenInfo.decimals));
    }
    return re;
  }
  return [vite_resp.balance*(10**-vite_resp.tokenInfo.decimals), false];
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
  if (bal[1] === false) {
  } else {
    if (bal[1] < config.vite.token.amount) {
      dry_info.token = true;
    }
  }
  return dry_info
}


async function get_account_history(address) {
  let resp = await provider.request('ledger_getAccountBlocks', [address, null, null, 1500]);
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
      amount: Big(String(amount)+"e18").toFixed()
    }).setProvider(provider).setPrivateKey(privKey);

    const [quota, difficulty] = await Promise.all([provider.request("contract_getQuotaByAccount", faucet_address), vite_send.autoSetPreviousAccountBlock().then(() => provider.request("ledger_getPoWDifficulty", {
        address: vite_send.address,
        previousHash: vite_send.previousHash,
        blockType: vite_send.blockType,
        toAddress: vite_send.toAddress,
        data: vite_send.data
      }))
  	])

		const availableQuota = Big(quota.currentQuota);
		if (availableQuota < difficulty.requiredQuota) {
      await vite_send.PoW(difficulty.difficulty)
    }
		
    try {
      let result = await vite_send.sign().send();
    } catch (e) {
      console.log(e)
    }
  }
  //send token
  if (send_token) {
    let token_send = vite.accountBlock.createAccountBlock('send', {
      "address": faucet_address,
      "toAddress": address,
      "tokenId": token_id,
      "amount": Big(String(token_amount)+"e"+String(config.vite.token.decimals)).toFixed()
    }).setProvider(provider).setPrivateKey(privKey);

    const [quota, difficulty] = await Promise.all([provider.request("contract_getQuotaByAccount", faucet_address), token_send.autoSetPreviousAccountBlock().then(() => provider.request("ledger_getPoWDifficulty", {
        address: token_send.address,
        previousHash: token_send.previousHash,
        blockType: token_send.blockType,
        toAddress: token_send.toAddress,
        data: token_send.data
      }))
  	])

		const availableQuota = Big(quota.currentQuota);
		if (availableQuota < difficulty.requiredQuota) {
      await token_send.PoW(difficulty.difficulty)
    }
		
    try {
      let result = await token_send.sign().send();
    } catch (e) {
      console.log(e)
    }
    //how to see success? not sure
  }
  return true;
}

process.on('unhandledRejection', (err) => {
	console.log(err)
})

module.exports = {
  send: send,
  dry: dry,
  check_bal: check_bal,
  get_account_history: get_account_history,
  is_unopened: is_unopened,
  receive: receive
}